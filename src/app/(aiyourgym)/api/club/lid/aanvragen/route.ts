// POST /api/club/lid/aanvragen  { email, s?, website? }
// Een lid vraagt zelf een persoonlijke link voor de ledenapp aan. Openbaar
// (geen sessie), dus streng:
//   - altijd hetzelfde antwoord, of het adres nu bekend is of niet; het zoeken
//     en inplannen gebeurt pas na het antwoord (after), zodat ook de tijd niets
//     verraadt;
//   - een rem in de database: hooguit 3 per uur per adres (daarboven stil geen
//     mail) en 10 per uur per IP (daarboven 429), plus een rem in het geheugen;
//   - een honingpotveld (website): ingevuld = robot, stil genegeerd;
//   - alleen van onze eigen pagina.
// Zonder mail-instellingen: de melding "Vraag je link aan de balie". De mail
// zelf gaat via de wachtrij van de meldingen (soort app_link). Schakelaar
// CLUB_LEDEN_LOGIN uit: een gewone 404.

import { randomUUID } from 'node:crypto'
import { NextResponse, after, type NextRequest } from 'next/server'
import { clubDatabase } from '@/lib/club/kern/database'
import { ipVan, isZelfdeOorsprong } from '@/lib/club/kern/verzoek'
import { isRateLimited } from '@/lib/utils/rate-limit'
import { clubFout, clubJson } from '@/lib/club/toegang'
import { leesJsonOfTeGroot } from '@/lib/club/kern/body'
import { CLUB_LEDEN_LOGIN } from '@/lib/club/ledenlogin/schakelaar'
import { AANVRAAG_ANTWOORD, AANVRAAG_GEEN_MAIL, leesAanvraag, mailKlaar, remHash } from '@/lib/club/app-uitnodigen/regels'
import { planAanvraag, registreerAanvraag } from '@/lib/club/app-uitnodigen/opslag'
import { sportschoolVoorAanvraag } from '@/lib/club/app-uitnodigen/sportschool'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const IP_MAX = 20
const IP_VENSTER_MS = 15 * 60_000

function verstuurd(): NextResponse {
  return clubJson({ staat: 'ok', bericht: AANVRAAG_ANTWOORD })
}

export async function POST(req: NextRequest) {
  if (!CLUB_LEDEN_LOGIN) return clubFout('Niet gevonden.', 404)
  if (!isZelfdeOorsprong(req.headers)) return clubFout('Dit verzoek komt niet van de app zelf.', 403)
  const ip = ipVan(req)
  if (isRateLimited(`club-lid-aanvragen:${ip}`, IP_MAX, IP_VENSTER_MS) || isRateLimited('club-lid-aanvragen:alles', 600, IP_VENSTER_MS)) {
    return clubFout('Te veel aanvragen. Probeer het over een kwartier opnieuw.', 429)
  }
  const gelezen = await leesJsonOfTeGroot(req, 1000)
  if (gelezen instanceof NextResponse) return gelezen
  const invoer = leesAanvraag(gelezen.body)
  if (invoer.soort === 'robot') return verstuurd()
  if (invoer.soort === 'ongeldig') return clubFout('Vul een geldig e-mailadres in.', 400)
  if (!mailKlaar(process.env)) return clubJson({ staat: 'balie', bericht: AANVRAAG_GEEN_MAIL })

  try {
    const admin = clubDatabase()
    const nu = new Date()
    const org = await sportschoolVoorAanvraag(admin, invoer.sportschool)
    const rem = await registreerAanvraag(admin, remHash('email', invoer.email), remHash('ip', ip), org?.id ?? null, nu)
    if (rem.oordeel === 'ip') return clubFout('Te veel aanvragen vanaf dit netwerk. Probeer het over een uur opnieuw.', 429)
    if (rem.oordeel === 'ok' && org) {
      const aanvraagId = rem.id ?? randomUUID()
      after(() => planAanvraag(admin, org, invoer.email, aanvraagId, nu))
    }
    return verstuurd()
  } catch (err) {
    console.error('[club/app-uitnodigen] aanvraag mislukt', err instanceof Error ? err.message : 'onbekend')
    return clubFout('Er ging iets mis. Probeer het zo opnieuw.', 500)
  }
}
