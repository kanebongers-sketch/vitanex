// ─── LifeOS — GET /api/cron/dagplanning-mail ────────────────────────────────
// Elke weekdag-ochtend: zet twee vaste bewegingsblokken in je persoonlijke agenda
// (sporten 90 min incl. reistijd — het liefst 's ochtends; wandelen 60 min erna),
// op een plek die past bij hoe je dag eruitziet, en mail je daarna je dagplanning.
//
// ─── GEEN SESSIE, DUS GEEN FOUNDER-GATE ─────────────────────────────────────
// Server-to-server, net als /api/cron/lifeos-agenda-sync: geen ingelogde sessie. De
// beveiliging is het gedeelde CRON_SECRET (fail-closed: leeg = niemand komt binnen).
// De schrijf loopt via de service-role op de vaste lifeosUserId() — single-tenant.
//
// ─── INPLANNEN ──────────────────────────────────────────────────────────────
// Primair: de database-klok (pg_cron, migratie 270) — ma–vr 05:00 UTC op de
// minuut, plus een herkansing om 05:30. Back-up: .github/workflows/dagplanning-
// mail.yml. (GitHub-cron alléén bleek uren te laat: de mail kwam rond 11:45.)
// Beide sturen CRON_SECRET mee; het geheim staat in Vault als `lifeos_cron_secret`.
//
// ─── TIJDZONE ───────────────────────────────────────────────────────────────
// De dag-/weekdagbepaling en het werkvenster gebruiken lokale tijd. Zet op de host
// TZ=Europe/Amsterdam (zie .env.example / vrije-blokken.ts), anders loopt "vandaag"
// uit de pas. De mail-tijden zelf worden expliciet in Europe/Amsterdam opgemaakt.

import { type NextRequest } from 'next/server'
import { Resend } from 'resend'
import { createLifeosAdminClient, lifeosUserId } from '@/lib/lifeos/admin'
import { geheimGelijk } from '@/lib/lifeos/auth/geheim'
import { geldigToken, leesGekozenKalender } from '@/lib/lifeos/agenda/koppeling'
import { haalEvents } from '@/lib/lifeos/agenda/google'
import { maakAgendaEvent } from '@/lib/lifeos/agenda/schrijven'
import type { Afspraak } from '@/lib/lifeos/agenda/vrije-blokken'
import { haalTaken } from '@/lib/lifeos/taken/opslag'
import { kiesBewegingsblokken } from '@/lib/lifeos/dagplanning/bewegingsplan'
import { bouwDagplanningMail, vitaVoorMail, type DagItem, type DagTodo } from '@/lib/lifeos/dagplanning/dagplanning'
import { bouwAandacht, type Aandachtspunt } from '@/lib/lifeos/dagplanning/aandacht'
import { haalPersonen } from '@/lib/lifeos/crm/opslag'
import type { Persoon } from '@/lib/lifeos/crm/crm'
import { haalPtSignalen, type PtSignalen } from '@/lib/lifeos/pt-klant/afhaak-ophalen'
import { koppelTekstMetRegels } from '@/lib/lifeos/agenda/categorie'
import { haalCategorieRegels } from '@/lib/lifeos/agenda/categorie-opslag'
import type { AgendaCategorie } from '@/lib/lifeos/agenda/categorie'
import { haalFacturen } from '@/lib/lifeos/finance/opslag'
import { geldigToken as geldigMailToken, forceerVernieuwing as forceerMailVernieuwing } from '@/lib/lifeos/inbox/koppeling'
import { haalTriageMails } from '@/lib/lifeos/inbox/gmail'
import { triageer } from '@/lib/lifeos/inbox/classificeer'
import { haalContext } from '@/lib/lifeos/vita/context'
import { syncAgenda } from '@/lib/lifeos/agenda/sync'
import { bepaalSignalen, lokaleTijd } from '@/lib/lifeos/vita/signalen'
import { alGeclaimdVandaag, claimBriefing, geefClaimTerug, markeerBezorgd } from '@/lib/lifeos/vita/briefing-opslag'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SPORT_TITEL = 'Sporten (incl. reistijd)'
const WANDEL_TITEL = 'Wandelen'
const MAIL_VAN = 'MentaForce <onboarding@resend.dev>'

function ontvanger(): string {
  return process.env.LIFEOS_DAGPLANNING_MAIL?.trim() || 'kanebongers@gmail.com'
}

function fout(melding: string, status: number): Response {
  return Response.json({ fout: melding }, { status, headers: { 'Cache-Control': 'no-store' } })
}
function klaar(body: Record<string, unknown>): Response {
  return Response.json(body, { headers: { 'Cache-Control': 'no-store' } })
}

function secretGeldig(req: NextRequest): boolean {
  const gegeven = req.headers.get('x-cron-secret') ?? req.nextUrl.searchParams.get('secret')
  return geheimGelijk(process.env.CRON_SECRET ?? '', gegeven)
}

/** Bestaat er vandaag al een (niet-hele-dag) blok met deze titel? Dan niet dubbel maken. */
function heeftBlok(events: readonly Afspraak[], titel: string): boolean {
  return events.some((e) => !e.heleDag && (e.titel ?? '').trim() === titel)
}

/**
 * Vita's observaties voor vandaag als losse regels ("wat opvalt"). Best-effort:
 * elke fout of ontbrekende bron levert een lege lijst op — de dagmail gaat dan
 * gewoon zonder Vita-sectie, nooit met een halve of verzonnen briefing.
 */
async function haalVitaSignalen(
  admin: ReturnType<typeof createLifeosAdminClient>,
  userId: string,
  nu: Date,
): Promise<string[]> {
  try {
    const context = await haalContext(userId, admin, nu)
    const signalen = bepaalSignalen({
      herstel: context.herstel.ok ? context.herstel.waarde : [],
      agendaVandaag: context.agendaVandaag.ok ? context.agendaVandaag.waarde : [],
      taken: context.taken.ok ? context.taken.waarde : [],
      nu,
    })
    return vitaVoorMail(signalen)
  } catch (oorzaak) {
    console.error('[dagplanning-mail] Vita-signalen ophalen mislukt', oorzaak)
    return []
  }
}

/**
 * Hoeveel ongelezen mails vragen om een reactie? Best-effort en GOEDKOOP: één
 * Gmail-metadata-fetch (max 40 berichten) + de regelgebaseerde `triageer` — geen
 * AI-call, dus geen kosten per ochtend. `null` = niet nagegaan (Gmail niet
 * gekoppeld, toestemming ingetrokken, of Gmail even onbereikbaar): dan toont de
 * mail geen inbox-regel i.p.v. een misleidende "0". Één verse-token-herkansing bij
 * een 401, gespiegeld aan `inbox/vandaag/route.ts`.
 */
async function haalInboxActie(
  admin: ReturnType<typeof createLifeosAdminClient>,
  userId: string,
): Promise<number | null> {
  try {
    const token = await geldigMailToken(admin, userId)
    if (token.staat !== 'ok') return null

    let mails = await haalTriageMails(token.toegangstoken)
    if (mails.staat === 'verlopen') {
      const vers = await forceerMailVernieuwing(admin, userId)
      if (vers.staat !== 'ok') return null
      mails = await haalTriageMails(vers.toegangstoken)
    }
    if (mails.staat !== 'ok') return null

    return triageer(mails.mails).vraagtActie.length
  } catch (oorzaak) {
    console.error('[dagplanning-mail] inbox-triage mislukt', oorzaak)
    return null
  }
}

/**
 * Cross-domein aandachtspunten ("Vraagt je aandacht"): wie je vandaag zou opvolgen
 * (CRM), hoeveel mail een reactie vraagt (inbox) en welke facturen open of te laat
 * staan (finance). Best-effort, net als de Vita-signalen: valt een bron om, dan
 * levert die gewoon geen regels op — de mail gaat door met wat er wél is, nooit met
 * een halve of verzonnen sectie.
 */
async function haalAandacht(
  admin: ReturnType<typeof createLifeosAdminClient>,
  userId: string,
  vandaagKey: string,
  personen: readonly Persoon[],
  pt: PtSignalen,
): Promise<Aandachtspunt[]> {
  const [facturen, inboxActie] = await Promise.all([
    haalFacturen(admin, userId).catch((oorzaak) => {
      console.error('[dagplanning-mail] facturen ophalen mislukt', oorzaak)
      return { ok: false as const, reden: 'db' as const }
    }),
    haalInboxActie(admin, userId),
  ])
  return bouwAandacht(personen, facturen.ok ? facturen.waarde : [], vandaagKey, inboxActie, pt)
}

/** De CRM-personen, best-effort: één ophaal, gedeeld door de agenda-koppeling én de aandacht-sectie. */
async function haalCrmPersonen(
  admin: ReturnType<typeof createLifeosAdminClient>,
  userId: string,
): Promise<Persoon[]> {
  try {
    const uit = await haalPersonen(admin, userId)
    return uit.ok ? uit.waarde : []
  } catch (oorzaak) {
    console.error('[dagplanning-mail] CRM ophalen mislukt', oorzaak)
    return []
  }
}

export async function GET(req: NextRequest): Promise<Response> {
  if (!secretGeldig(req)) return fout('Unauthorized', 401)

  let admin: ReturnType<typeof createLifeosAdminClient>
  let userId: string
  try {
    admin = createLifeosAdminClient()
    userId = lifeosUserId()
  } catch (oorzaak) {
    const melding = oorzaak instanceof Error ? oorzaak.message : 'Configuratie ontbreekt.'
    console.error('[dagplanning-mail] configuratiefout:', melding)
    return fout(melding, 503)
  }

  if (!process.env.RESEND_API_KEY) {
    return fout('RESEND_API_KEY ontbreekt — geen mailer.', 503)
  }

  const nu = new Date()

  // Alleen ma–vr. De workflow plant ook alleen op weekdagen, maar dit is de tweede
  // verdediging: draai je 'm handmatig op zaterdag, dan gebeurt er niets.
  const weekdag = nu.getDay() // 0 = zondag, 6 = zaterdag
  if (weekdag === 0 || weekdag === 6) {
    return klaar({ verstuurd: false, reden: 'weekend' })
  }

  // De dag-sleutel (lokaal) — gedeeld door de goedkope voor-check hier en de claim
  // vlak vóór het sturen. Beide moeten exact dezelfde datum-string gebruiken.
  const datum = lokaleTijd(nu).datum

  // ─── INHAAL-VANGNET (goedkope kant) ───────────────────────────────────────
  // De workflow probeert 's ochtends meerdere keren, zodat een door GitHub gemiste
  // tik van 05:00 alsnog wordt ingehaald door 05:30/06:00/… Is de dagmail van
  // vandaag al geclaimd, dan stoppen we hier — vóór we de agenda en inbox aflopen.
  // Zo doet alleen de éérste geslaagde poging op een dag echt werk; de rest is één
  // goedkope DB-lezing. Het échte slot tegen dubbele mails blijft de claim onderaan.
  if ((await alGeclaimdVandaag(admin, userId, datum, 'email')) === true) {
    return klaar({ verstuurd: false, reden: 'vandaag al verstuurd', datum })
  }

  const token = await geldigToken(admin, userId)
  if (token.staat === 'niet_gekoppeld') return fout('Agenda niet gekoppeld.', 503)
  if (token.staat === 'fout') return fout('Kon de agenda niet lezen.', 503)

  const kalenderId = await leesGekozenKalender(admin, userId)

  // De hele dag (lokaal 00:00–24:00) uit de persoonlijke agenda.
  const dagStart = new Date(nu)
  dagStart.setHours(0, 0, 0, 0)
  const dagEind = new Date(dagStart.getTime() + 24 * 60 * 60 * 1000)

  const gelezen = await haalEvents(token.toegangstoken, dagStart, dagEind, kalenderId)
  if (gelezen.staat === 'verlopen') return fout('Agenda-koppeling verlopen.', 503)
  if (gelezen.staat === 'fout') return fout('Kon de agenda niet lezen.', 502)

  const afspraken: Afspraak[] = gelezen.events.map((e) => ({
    id: e.externId,
    titel: e.titel,
    startOp: e.startOp,
    eindOp: e.eindOp,
    heleDag: e.heleDag,
    locatie: e.locatie,
  }))

  // Slim een plek kiezen op basis van de dag; alleen de blokken maken die er nog
  // niet zijn (idempotent — een tweede run op dezelfde dag maakt geen dubbele).
  const plan = kiesBewegingsblokken(afspraken, nu, nu)
  const nieuw: DagItem[] = []
  const problemen: string[] = []

  async function plaats(titel: string, venster: { startOp: Date; eindOp: Date } | null, alBestaat: boolean) {
    if (alBestaat || venster === null) return
    try {
      await maakAgendaEvent(
        admin,
        userId,
        { titel, startOp: venster.startOp.toISOString(), eindOp: venster.eindOp.toISOString() },
        kalenderId,
      )
      nieuw.push({ startOp: venster.startOp, eindOp: venster.eindOp, titel, heleDag: false, beweging: true })
    } catch (oorzaak) {
      const melding = oorzaak instanceof Error ? oorzaak.message : 'onbekend'
      console.error(`[dagplanning-mail] blok "${titel}" mislukte:`, melding)
      problemen.push(titel)
    }
  }

  await plaats(SPORT_TITEL, plan.sport, heeftBlok(afspraken, SPORT_TITEL))
  await plaats(WANDEL_TITEL, plan.wandeling, heeftBlok(afspraken, WANDEL_TITEL))

  // Je open to-do's erbij. Best-effort: lukt het lezen niet, dan gaat de mail
  // gewoon zonder takenlijst — een agenda-mail zonder to-do's is nog steeds nuttig.
  const vandaagKey = `${nu.getFullYear()}-${String(nu.getMonth() + 1).padStart(2, '0')}-${String(nu.getDate()).padStart(2, '0')}`
  const takenUitkomst = await haalTaken(admin, userId, { alleenOpen: true })
  const todos: DagTodo[] = takenUitkomst.ok
    ? takenUitkomst.waarde
        .map((t) => ({ titel: t.titel, top3: t.top3Positie !== null, vandaag: t.datum === vandaagKey }))
        // Top-3 eerst, dan wat vandaag gepland staat, dan de rest.
        .sort((a, b) => Number(b.top3) - Number(a.top3) || Number(b.vandaag) - Number(a.vandaag))
    : []

  // De CRM-personen één keer ophalen: zowel de agenda-koppeling hieronder als de
  // "Vraagt je aandacht"-sectie draaien erop.
  const personen = await haalCrmPersonen(admin, userId)
  // Je geleerde categorie-regels (categorieën-scherm): lossen dubbelzinnige namen op
  // in de koppeling achter elke afspraak. Best-effort — zonder regels gewoon zonder.
  const regels: ReadonlyMap<string, AgendaCategorie> = await haalCategorieRegels(admin, userId)
    .then((u) => (u.ok ? u.waarde : new Map<string, AgendaCategorie>()))
    .catch(() => new Map<string, AgendaCategorie>())

  // De mail: de bestaande agenda + wat we net toevoegden. Elke afspraak krijgt een
  // koppeling als de titel eenduidig naar één CRM-persoon wijst ("Training Sanne" →
  // "Sanne · PT-klant"). Bij twijfel (meerdere matches) een eerlijke hint, nooit een gok.
  const items: DagItem[] = [
    ...afspraken.map((e) => ({
      startOp: e.startOp,
      eindOp: e.eindOp,
      titel: e.titel ?? '(zonder titel)',
      heleDag: e.heleDag,
      beweging: (e.titel ?? '').trim() === SPORT_TITEL || (e.titel ?? '').trim() === WANDEL_TITEL,
      koppeling: koppelTekstMetRegels(e.titel, personen, regels) ?? undefined,
    })),
    ...nieuw,
  ]

  // Ververs de agenda-cache VÓÓR we Vita's signalen lezen. De mail-body hierboven
  // leest de agenda al live uit Google, maar Vita's signalen komen uit `haalContext`,
  // en dat leest de `agenda_events`-CACHE. Zonder deze sync redeneert Vita op een
  // cache die alleen ververst wordt als je de agenda-kaart opent — dan wijkt "wat
  // opvalt" af van de agenda die er pal boven staat. Best-effort: een gefaalde sync
  // (Google onbereikbaar, niet gekoppeld) mag de mail nooit tegenhouden.
  try {
    const sync = await syncAgenda(admin, userId)
    if (sync.staat !== 'ok') {
      console.warn(`[dagplanning-mail] agenda-sync niet ok (${sync.staat}); Vita's signalen draaien op de cache.`)
    }
  } catch (oorzaak) {
    console.error('[dagplanning-mail] agenda-sync wierp een fout; Vita draait op de cache.', oorzaak)
  }

  // Vita's observaties ("wat opvalt") — de dagbriefing zit nu in deze mail. Puur
  // best-effort: lukt het ophalen niet, dan gaat de mail zonder Vita-sectie. De
  // agenda + taken staan al in de mail, dus we nemen alléén de signalen over (geen
  // dubbeling), niet de hele briefingtekst.
  const vitaSignalen = await haalVitaSignalen(admin, userId, nu)

  // PT-signalen (afhaak + "traint al maar staat als prospect"): één breed agenda-
  // venster, best-effort — valt dat om, dan gewoon geen PT-regels.
  const pt = await haalPtSignalen(admin, userId, personen, nu)

  // "Vraagt je aandacht": CRM-opvolging + afhaak + inbox + facturen. Best-effort.
  const aandacht = await haalAandacht(admin, userId, vandaagKey, personen, pt)

  const mail = bouwDagplanningMail(nu, items, todos, vitaSignalen, aandacht)

  // Eén mail per dag, wie of wat 'm ook triggert (de meerdere ochtend-tikken van de
  // workflow + een handmatige run). Claim vlak vóór het sturen: zo verspilt een
  // dubbele run hooguit wat leeswerk, maar krijgt Kane nooit twee dagmails. Slot =
  // de insert (de goedkope voor-check hierboven is enkel een versnelling, geen slot).
  const claim = await claimBriefing(admin, userId, datum, 'email')
  if (claim.soort === 'bezet') {
    return klaar({ verstuurd: false, reden: 'vandaag al verstuurd', datum })
  }
  if (claim.soort === 'fout') {
    console.error('[dagplanning-mail] claim mislukt:', claim.melding)
    return fout('Kon de dagmail niet vastleggen; niets verstuurd.', 503)
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { error } = await resend.emails.send({
      from: MAIL_VAN,
      to: ontvanger(),
      subject: mail.onderwerp,
      html: mail.html,
      text: mail.tekst,
    })
    if (error) {
      console.error('[dagplanning-mail] Resend-fout:', error)
      await geefClaimTerug(admin, claim.id)
      return fout('Blokken gepland, maar de mail kon niet worden verzonden.', 502)
    }
  } catch (oorzaak) {
    console.error('[dagplanning-mail] mail versturen mislukt', oorzaak)
    await geefClaimTerug(admin, claim.id)
    return fout('Blokken gepland, maar de mail kon niet worden verzonden.', 502)
  }

  // De mail is de deur uit — leg vast dat vandaag bezorgd is (best-effort, net als
  // de briefing: een mislukte markering is geen reden om opnieuw te sturen).
  await markeerBezorgd(admin, claim.id, mail.tekst, nu)

  return klaar({
    verstuurd: true,
    nieuweBlokken: nieuw.map((n) => n.titel),
    vitaSignalen: vitaSignalen.length,
    aandacht: aandacht.length,
    problemen,
    aantalItems: items.length,
  })
}
