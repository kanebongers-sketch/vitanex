// POST /api/club/lid/inloggen  { pin, code? }
// Een lid logt in met zijn pincode. De link komt uit de body (op /mijn/start/<code>)
// of uit de onthouden link op dit toestel (op /mijn/inloggen). Goed: een
// httpOnly-sessiecookie van 90 dagen. Schakelaar uit, onbekende of ingetrokken
// link: een gewone 404, steeds met hetzelfde antwoord.

import { NextResponse, type NextRequest } from 'next/server'
import { createLifeosAdminClient } from '@/lib/lifeos/admin'
import { ipVan, isZelfdeOorsprong, leesPin } from '@/lib/lifeos/leads/toegang'
import { isRateLimited } from '@/lib/utils/rate-limit'
import { clubFout, clubJson } from '@/lib/club/toegang'
import { leesJsonOfTeGroot } from '@/lib/club/kern/body'
import { CLUB_LEDEN_LOGIN } from '@/lib/club/ledenlogin/schakelaar'
import { lidApparaatCookie } from '@/lib/club/ledenlogin/regels'
import { logInLid } from '@/lib/club/ledenlogin/opslag'
import { LINK_WERKT_NIET, blokkadeTekst, bruikbareLink, zetLidCookies } from '@/lib/club/ledenlogin/inlog-api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Per IP: ruim boven wat een mens tikt, ver onder wat bruteforce nodig heeft. */
const IP_MAX = 20
const IP_VENSTER_MS = 15 * 60_000

export async function POST(req: NextRequest) {
  if (!CLUB_LEDEN_LOGIN) return clubFout('Niet gevonden.', 404)
  if (!isZelfdeOorsprong(req.headers)) return clubFout('Dit verzoek komt niet van de app zelf.', 403)
  if (isRateLimited(`club-lid-inloggen:${ipVan(req)}`, IP_MAX, IP_VENSTER_MS)) {
    return clubFout('Te veel inlogpogingen vanaf dit netwerk. Probeer het over een kwartier opnieuw.', 429)
  }
  const gelezen = await leesJsonOfTeGroot(req, 500)
  if (gelezen instanceof NextResponse) return gelezen
  const body = gelezen.body
  const uitBody = typeof body === 'object' && body !== null ? (body as Record<string, unknown>).code : undefined
  const code = typeof uitBody === 'string' ? uitBody : req.cookies.get(lidApparaatCookie())?.value
  const nu = new Date()
  const admin = createLifeosAdminClient()
  const link = await bruikbareLink(admin, code, nu)
  if (!link) return clubFout(LINK_WERKT_NIET, 404)
  const pin = leesPin(body)
  if (!pin) return clubFout('Vul je pincode van 6 cijfers in.', 400)

  const uit = await logInLid(admin, link.toegang, pin, nu)
  switch (uit.staat) {
    case 'ok': {
      const res = clubJson({ staat: 'ok' })
      zetLidCookies(res, uit.sessie, link.toegang.code, nu)
      return res
    }
    case 'fout':
      return clubFout(`Pincode klopt niet. Nog ${uit.over} poging${uit.over === 1 ? '' : 'en'}.`, 401)
    case 'geblokkeerd':
      return clubFout(blokkadeTekst(uit.totOp), 429)
    case 'ongeldig':
      return clubFout(LINK_WERKT_NIET, 404)
    default:
      return clubFout('Inloggen mislukt. Probeer het opnieuw.', 502)
  }
}
