// ─── LifeOS — GET /api/cron/dagplanning-mail ────────────────────────────────
// Elke weekdag-ochtend: zet twee vaste bewegingsblokken in je persoonlijke agenda
// (sporten 90 min incl. reistijd — het liefst 's ochtends; wandelen 60 min erna),
// op een plek die past bij hoe je dag eruitziet, en mail je daarna je dagplanning.
//
// ─── GEEN SESSIE, DUS GEEN FOUNDER-GATE ─────────────────────────────────────
// Server-to-server, net als /api/cron/lifeos-briefing: geen ingelogde sessie. De
// beveiliging is het gedeelde CRON_SECRET (fail-closed: leeg = niemand komt binnen).
// De schrijf loopt via de service-role op de vaste lifeosUserId() — single-tenant.
//
// ─── INPLANNEN (dit doet zichzelf niet) ─────────────────────────────────────
// Er is geen vercel.json; de klok staat in .github/workflows/dagplanning-mail.yml,
// die deze route ma–vr aanroept. Zet daarvoor CRON_SECRET in de repo-secrets.
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
import { bouwDagplanningMail, type DagItem, type DagTodo } from '@/lib/lifeos/dagplanning/dagplanning'

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

  // De mail: de bestaande agenda + wat we net toevoegden.
  const items: DagItem[] = [
    ...afspraken.map((e) => ({
      startOp: e.startOp,
      eindOp: e.eindOp,
      titel: e.titel ?? '(zonder titel)',
      heleDag: e.heleDag,
      beweging: (e.titel ?? '').trim() === SPORT_TITEL || (e.titel ?? '').trim() === WANDEL_TITEL,
    })),
    ...nieuw,
  ]

  const mail = bouwDagplanningMail(nu, items, todos)

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
      return fout('Blokken gepland, maar de mail kon niet worden verzonden.', 502)
    }
  } catch (oorzaak) {
    console.error('[dagplanning-mail] mail versturen mislukt', oorzaak)
    return fout('Blokken gepland, maar de mail kon niet worden verzonden.', 502)
  }

  return klaar({
    verstuurd: true,
    nieuweBlokken: nieuw.map((n) => n.titel),
    problemen,
    aantalItems: items.length,
  })
}
