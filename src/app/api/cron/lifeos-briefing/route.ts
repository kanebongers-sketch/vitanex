// ─── LifeOS — GET /api/cron/lifeos-briefing ─────────────────────────────────
// De enige plek in LifeOS waar Vita uit zichzelf begint. Al het andere wacht tot
// Kane een pagina opent; dit niet. Dat verschil is het hele verschil tussen een
// dashboard en een stafchef.
//
// ─── WAAROM DEZE ROUTE BESTAAT ──────────────────────────────────────────────
//   De Vita-kaart beloofde letterlijk: "Ik blijf meekijken en tik je aan zodra er
//   iets verandert." Dat was onwaar — er was geen cron, geen polling, geen push
//   die LifeOS raakte. Deze route maakt die zin waar. Zolang hij niet ingepland
//   is, blijft hij onwaar; zie "INPLANNEN" hieronder, en zie hoe de Vita-kaart
//   zich baseert op wat er échte bezorgd is (`vita_briefingen`) in plaats van op
//   het bestaan van dit bestand.
//
// ─── INPLANNEN (dit doet zichzelf niet) ─────────────────────────────────────
//   Er is GEEN vercel.json — dit draait op Render, en Render kent geen cron-veld
//   in de repo. De planner staat daarom buiten de app. Het bestaande precedent is
//   `.github/workflows/keep-alive.yml`; hiernaast staat nu
//   `.github/workflows/lifeos-briefing.yml`, die deze route elke ochtend aanroept.
//
//   Kane moet daarvoor precies dit doen:
//     1. GitHub → repo → Settings → Secrets → Actions → `CRON_SECRET` zetten,
//        met dezelfde waarde als de `CRON_SECRET` in de Render-omgeving.
//     2. `LIFEOS_TELEGRAM_CHAT_ID` in Render zetten (zie hieronder).
//     3. De workflow één keer handmatig draaien (Actions → Run workflow) om te
//        zien dát hij werkt, in plaats van aan te nemen dat hij dat doet.
//
//   Alternatief: cron-job.org, met de header `x-cron-secret`. Zelfde route.
//
// ─── GEEN SESSIE, DUS GEEN FOUNDER-GATE ─────────────────────────────────────
// Net als de Telegram-webhook draait dit server-to-server: er is geen ingelogde
// sessie om tegen te gate'n. De beveiliging is het gedeelde `CRON_SECRET`, en die
// is FAIL-CLOSED: zonder geconfigureerd secret komt niemand binnen. De schrijf
// loopt via de service-role op de vaste `lifeosUserId()` — single-tenant, precies
// zoals de rest van LifeOS, alleen zonder de sessie-gate ervoor.

import { type NextRequest } from 'next/server'
import { createLifeosAdminClient, lifeosUserId } from '@/lib/lifeos/admin'
import { geheimGelijk } from '@/lib/lifeos/auth/geheim'
import { maakTelegramBot } from '@/lib/lifeos/telegram/bot'
import { haalContext } from '@/lib/lifeos/vita/context'
import { bepaalSignalen, lokaleTijd } from '@/lib/lifeos/vita/signalen'
import { stelBriefingSamen } from '@/lib/lifeos/vita/briefing'
import { claimBriefing, geefClaimTerug, markeerBezorgd } from '@/lib/lifeos/vita/briefing-opslag'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const KANAAL = 'telegram' as const

/**
 * De chat waar de briefing heen gaat. Bewust een EIGEN variabele en niet "de
 * eerste uit `LIFEOS_TELEGRAM_ALLOWED_CHAT_ID`": die allowlist zegt wie er mág
 * schrijven, niet naar wie wij ongevraagd pushen. Die twee betekenissen op één
 * variabele stapelen is precies hoe je op een dag een briefing naar de verkeerde
 * chat stuurt omdat iemand de allowlist uitbreidde.
 */
function chatId(): number | null {
  const ruw = process.env.LIFEOS_TELEGRAM_CHAT_ID
  if (!ruw) return null
  const id = Number(ruw.trim())
  return Number.isInteger(id) ? id : null
}

function fout(melding: string, status: number): Response {
  return Response.json({ fout: melding }, { status, headers: { 'Cache-Control': 'no-store' } })
}

function klaar(body: Record<string, unknown>): Response {
  return Response.json(body, { headers: { 'Cache-Control': 'no-store' } })
}

/**
 * Fail-closed, gespiegeld aan `/api/cron/dagelijkse-briefing`: zonder
 * geconfigureerd `CRON_SECRET` is deze route niet aanroepbaar. Een cron die
 * standaard openstaat is een publieke knop die Telegram-berichten stuurt.
 *
 * De vergelijking is constant-tijd (`geheimGelijk`), net als bij de
 * Telegram-webhook. Die twee routes hebben hetzelfde probleem — geen sessie, een
 * gedeeld geheim in een header — en horen daarom hetzelfde slot te hebben. De
 * legacy-cronroutes ernaast gebruiken nog een kale `===`; dat is geen reden om
 * die fout hier over te nemen.
 */
function secretGeldig(req: NextRequest): boolean {
  const gegeven = req.headers.get('x-cron-secret') ?? req.nextUrl.searchParams.get('secret')
  return geheimGelijk(process.env.CRON_SECRET ?? '', gegeven)
}

export async function GET(req: NextRequest): Promise<Response> {
  if (!secretGeldig(req)) return fout('Unauthorized', 401)

  const chat = chatId()
  if (chat === null) {
    return fout('LIFEOS_TELEGRAM_CHAT_ID ontbreekt of is geen getal — er is geen chat om naartoe te sturen.', 503)
  }

  let admin: ReturnType<typeof createLifeosAdminClient>
  let userId: string
  let bot: ReturnType<typeof maakTelegramBot>
  try {
    admin = createLifeosAdminClient()
    userId = lifeosUserId()
    bot = maakTelegramBot()
  } catch (oorzaak) {
    // Ontbrekende env. Expliciet, niet stil doorgaan met een client die toch faalt.
    const melding = oorzaak instanceof Error ? oorzaak.message : 'Configuratie ontbreekt.'
    console.error('[lifeos/cron-briefing] configuratiefout:', melding)
    return fout(melding, 503)
  }

  const nu = new Date()

  let context: Awaited<ReturnType<typeof haalContext>>
  try {
    context = await haalContext(userId, admin, nu)
  } catch (oorzaak) {
    console.error('[lifeos/cron-briefing] context ophalen mislukt', oorzaak)
    return fout('Kon de gegevens niet ophalen.', 503)
  }

  // Viel álle data weg, dan weten we niets. Een briefing die op niets steunt is
  // erger dan geen briefing: hij ziet er precies zo uit als een briefing die klopt.
  // Gespiegeld aan `/api/lifeos/vita/signalen`.
  const dataVakken = [context.herstel, context.agendaVandaag, context.taken]
  if (dataVakken.every((vak) => !vak.ok)) {
    return fout('Kon de gegevens niet ophalen.', 503)
  }

  const briefing = stelBriefingSamen({
    signalen: bepaalSignalen({
      herstel: context.herstel.ok ? context.herstel.waarde : [],
      agendaVandaag: context.agendaVandaag.ok ? context.agendaVandaag.waarde : [],
      taken: context.taken.ok ? context.taken.waarde : [],
      nu,
    }),
    agendaVandaag: context.agendaVandaag.ok ? context.agendaVandaag.waarde : [],
    taken: context.taken.ok ? context.taken.waarde : [],
    nu,
  })

  // Niets te melden → niets sturen, en géén claim: morgen is een nieuwe dag en
  // vandaag was er simpelweg geen bericht. Een dagelijkse "goedemorgen, er is
  // niets" is precies de ruis waardoor je over Vita heen leest.
  if (briefing === null) {
    return klaar({ verstuurd: false, reden: 'niets te melden', datum: lokaleTijd(nu).datum })
  }

  // ── Claim → stuur → markeer ────────────────────────────────────────────────
  // Nooit stuur → claim: valt het proces tussen die twee om, dan stuurt de
  // volgende run hem opnieuw. Het slot is de insert (zie briefing-opslag.ts).
  const claim = await claimBriefing(admin, userId, briefing.datum, KANAAL)
  if (claim.soort === 'bezet') {
    // Geen fout: dit is het slot dat zijn werk doet.
    return klaar({ verstuurd: false, reden: 'vandaag al bezorgd', datum: briefing.datum })
  }
  if (claim.soort === 'fout') {
    console.error('[lifeos/cron-briefing] claim mislukt:', claim.melding)
    // We weten nu niet óf er al een briefing uit is. Liever een gemiste dan een dubbele.
    return fout('Kon de briefing niet vastleggen; niets verstuurd.', 503)
  }

  try {
    await bot.stuurBericht(chat, briefing.tekst)
  } catch (oorzaak) {
    // Geef de claim terug zodat een retry wél kan — anders zwijgt Vita de hele dag
    // omdat Telegram één keer hikte. De prijs (een zeldzame dubbele bij een fout
    // ná aanname door Telegram) staat uitgelegd in `geefClaimTerug`.
    await geefClaimTerug(admin, claim.id)
    console.error('[lifeos/cron-briefing] versturen mislukt', oorzaak)
    return fout('Kon de briefing niet versturen.', 502)
  }

  const gemarkeerd = await markeerBezorgd(admin, claim.id, briefing.tekst, nu)
  if (!gemarkeerd.ok) {
    // Het bericht is wél aangekomen. De claim staat er (zonder `bezorgd_op`), dus
    // een volgende run stuurt niet opnieuw. Loggen en eerlijk melden — niet doen
    // alsof er niets gebeurde, en zeker niet opnieuw sturen.
    console.error('[lifeos/cron-briefing] markeren mislukt:', gemarkeerd.melding)
    return klaar({
      verstuurd: true,
      datum: briefing.datum,
      waarschuwing: 'Bezorgd, maar niet als bezorgd genoteerd.',
    })
  }

  return klaar({ verstuurd: true, datum: briefing.datum })
}
