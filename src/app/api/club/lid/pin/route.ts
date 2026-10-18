// POST /api/club/lid/pin  { code, pin }
// Een lid kiest op een nieuwe link een pincode van 6 cijfers en is daarna op dit
// toestel ingelogd. Een gekozen pincode kan hier niet overschreven worden: bij
// vergeten maakt de sportschool een nieuwe link.

import { NextResponse, type NextRequest } from 'next/server'
import { createLifeosAdminClient } from '@/lib/lifeos/admin'
import { ipVan, isZelfdeOorsprong, leesPin } from '@/lib/lifeos/leads/toegang'
import { isRateLimited } from '@/lib/utils/rate-limit'
import { clubFout, clubJson } from '@/lib/club/toegang'
import { leesJsonOfTeGroot } from '@/lib/club/kern/body'
import { CLUB_LEDEN_LOGIN } from '@/lib/club/ledenlogin/schakelaar'
import { kiesLidPin } from '@/lib/club/ledenlogin/opslag'
import { lidApparaatCookie } from '@/lib/club/ledenlogin/regels'
import { isZwakkePin } from '@/lib/club/ledenlogin/pin-keuze'
import { LINK_WERKT_NIET, bruikbareLink, zetLidCookies } from '@/lib/club/ledenlogin/inlog-api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const IP_MAX = 10
const IP_VENSTER_MS = 15 * 60_000

export async function POST(req: NextRequest) {
  if (!CLUB_LEDEN_LOGIN) return clubFout('Niet gevonden.', 404)
  if (!isZelfdeOorsprong(req.headers)) return clubFout('Dit verzoek komt niet van de app zelf.', 403)
  if (isRateLimited(`club-lid-pin:${ipVan(req)}`, IP_MAX, IP_VENSTER_MS)) {
    return clubFout('Te veel pogingen vanaf dit netwerk. Probeer het over een kwartier opnieuw.', 429)
  }
  const gelezen = await leesJsonOfTeGroot(req, 500)
  if (gelezen instanceof NextResponse) return gelezen
  const body = gelezen.body
  const code = typeof body === 'object' && body !== null ? (body as Record<string, unknown>).code : undefined
  const nu = new Date()
  const admin = createLifeosAdminClient()
  const link = await bruikbareLink(admin, typeof code === 'string' ? code : req.cookies.get(lidApparaatCookie())?.value, nu)
  if (!link) return clubFout(LINK_WERKT_NIET, 404)
  const pin = leesPin(body)
  if (!pin) return clubFout('Kies een pincode van precies 6 cijfers.', 400)
  if (isZwakkePin(pin)) return clubFout('Deze pincode is te makkelijk te raden. Kies een andere.', 400)

  const uit = await kiesLidPin(admin, link.toegang, pin, nu)
  if (uit.staat === 'ok') {
    const res = clubJson({ staat: 'ok' })
    zetLidCookies(res, uit.sessie, link.toegang.code, nu)
    return res
  }
  if (uit.staat === 'al_gekozen') return clubFout('Voor deze link is al een pincode gekozen. Log in met je pincode.', 409)
  if (uit.staat === 'ongeldig') return clubFout(LINK_WERKT_NIET, 404)
  return clubFout('Opslaan mislukt. Probeer het opnieuw.', 502)
}
