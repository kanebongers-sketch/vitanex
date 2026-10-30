// POST /api/club/lid/aanmelden  { code, voornaam, achternaam, email, telefoon?, geboortedatum?, akkoord, website? }
// POST /api/club/lid/aanmelden  { token, opnieuw: true }  een nieuwe code mailen
// Zelf aanmelden via een aanmeldlink of QR van de sportschool (besluit Kane
// 30-10-2026; nooit via een openbare pagina). Geen sessie, dus streng:
//   - alleen met een geldige, open link (anders 404, niets van de sportschool);
//   - altijd hetzelfde antwoord, of het adres nu al bij een lid hoort of niet;
//     de mail (code of "je bent al lid") gaat pas na het antwoord (after);
//   - een rem per IP, per adres (stil) en per link, in de database en in het geheugen;
//   - een honingpotveld (website) en alleen van onze eigen pagina.
// Het antwoord geeft een token dat alleen deze browser kent; daarmee rondt het
// lid af met de code uit de mail (/api/club/lid/aanmelden/afronden).

import { randomBytes } from 'node:crypto'
import { NextResponse, after, type NextRequest } from 'next/server'
import { clubDatabase } from '@/lib/club/kern/database'
import { ipVan, isZelfdeOorsprong } from '@/lib/club/kern/verzoek'
import { isRateLimited } from '@/lib/utils/rate-limit'
import { clubFout, clubJson } from '@/lib/club/toegang'
import { leesJsonOfTeGroot } from '@/lib/club/kern/body'
import { remSleutel } from '@/lib/club/kern/rem-hash'
import { CLUB_LEDEN_LOGIN } from '@/lib/club/ledenlogin/schakelaar'
import { AANMELD_TOKEN, leesAanmeldStart } from '@/lib/club/nieuwe-leden/regels'
import { nieuweCode, ruimAanmeldingenOp, startAanmelding } from '@/lib/club/nieuwe-leden/aanmelden-opslag'
import { aanmeldMailKlaar, stuurViaResend } from '@/lib/club/nieuwe-leden/mail'
import { getTaal } from '@/lib/aiyourgym/taal/server'
import { AANMELDEN } from '@/lib/aiyourgym/taal/woorden/ledenapp/aanmelden'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const IP_MAX = 10
const VENSTER_MS = 15 * 60_000

async function opnieuw(token: unknown): Promise<NextResponse> {
  const taal = await getTaal()
  if (typeof token === 'string' && AANMELD_TOKEN.test(token)) {
    const admin = clubDatabase()
    after(async () => {
      const mail = await nieuweCode(admin, token, taal, new Date())
      if (mail) await stuurViaResend(mail)
    })
  }
  return clubJson({ staat: 'ok' })
}

export async function POST(req: NextRequest) {
  if (!CLUB_LEDEN_LOGIN) return clubFout('Niet gevonden.', 404)
  const taal = await getTaal()
  const f = AANMELDEN[taal].fouten
  if (!isZelfdeOorsprong(req.headers)) return clubFout(f.nietVanApp, 403)
  const ip = ipVan(req)
  if (isRateLimited(`club-lid-aanmelden:${ip}`, IP_MAX, VENSTER_MS) || isRateLimited('club-lid-aanmelden:alles', 600, VENSTER_MS)) {
    return clubFout(f.teVeel, 429)
  }
  const gelezen = await leesJsonOfTeGroot(req, 2000)
  if (gelezen instanceof NextResponse) return gelezen
  const body = typeof gelezen.body === 'object' && gelezen.body !== null ? (gelezen.body as Record<string, unknown>) : {}
  if (body.opnieuw === true) return opnieuw(body.token)

  const nu = new Date()
  const invoer = leesAanmeldStart(body, nu)
  // Een robot krijgt een gewoon antwoord met een token dat nergens bij hoort.
  if (invoer.soort === 'robot') return clubJson({ staat: 'ok', token: randomBytes(32).toString('base64url') })
  if (invoer.soort === 'ongeldig') return clubJson({ fout: invoer.veld === 'link' ? f.link : f[invoer.veld], veld: invoer.veld }, invoer.veld === 'link' ? 404 : 400)
  if (!aanmeldMailKlaar()) return clubFout(f.geenMail, 503)

  try {
    const admin = clubDatabase()
    const uit = await startAanmelding(admin, invoer.waarde, remSleutel('club-aanmelden|ip', ip), taal, nu)
    after(() => ruimAanmeldingenOp(admin, nu))
    switch (uit.staat) {
      case 'ok': {
        const mail = uit.mail
        if (mail) after(async () => void (await stuurViaResend(mail)))
        return clubJson({ staat: 'ok', token: uit.token })
      }
      case 'link':
        return clubJson({ fout: f.link, veld: 'link' }, 404)
      case 'netwerk':
      case 'teVeelLink':
        return clubFout(f.teVeel, 429)
      default:
        return clubFout(f.misgegaan, 500)
    }
  } catch (err) {
    console.error('[club/nieuwe-leden] aanmelden mislukt', err instanceof Error ? err.message : 'onbekend')
    return clubFout(f.misgegaan, 500)
  }
}
