// POST /api/club/lid/activeren  { code, email, wachtwoord }
// Een lid gebruikt de uitnodiging van de sportschool (/mijn/start/<code>, als
// link in de mail of QR aan de balie): het bevestigt zijn e-mailadres en kiest
// een sterk wachtwoord. Daarna is dit toestel ingelogd en werkt de link niet
// meer; voortaan alleen e-mail plus wachtwoord. Werkt ook als "wachtwoord
// vergeten" (een nieuwe uitnodiging). Onbekende, gebruikte of verlopen link:
// steeds hetzelfde antwoord. Schakelaar uit: 404.

import { NextResponse, type NextRequest } from 'next/server'
import { clubDatabase } from '@/lib/club/kern/database'
import { ipVan, isZelfdeOorsprong } from '@/lib/club/kern/verzoek'
import { isGeremd } from '@/lib/club/kern/rem-db'
import { clubFout, clubJson } from '@/lib/club/toegang'
import { leesJsonOfTeGroot } from '@/lib/club/kern/body'
import { normaalEmail, wachtwoordFout } from '@/lib/club/kern/wachtwoord-regels'
import { volledigeNaam } from '@/lib/club/kern/lid'
import { CLUB_LEDEN_LOGIN } from '@/lib/club/ledenlogin/schakelaar'
import { activeerLid } from '@/lib/club/ledenlogin/opslag'
import { EMAIL_BEZET, LINK_WERKT_NIET, bruikbareLink, zetLidCookies } from '@/lib/club/ledenlogin/inlog-api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const IP_MAX = 10
const IP_VENSTER_MS = 15 * 60_000

export async function POST(req: NextRequest) {
  if (!CLUB_LEDEN_LOGIN) return clubFout('Niet gevonden.', 404)
  if (!isZelfdeOorsprong(req.headers)) return clubFout('Dit verzoek komt niet van de app zelf.', 403)
  if (await isGeremd({ soort: 'club-lid-activeren', max: IP_MAX, vensterMs: IP_VENSTER_MS, bijStoring: 'geheugen' }, ipVan(req))) {
    return clubFout('Te veel pogingen vanaf dit netwerk. Probeer het over een kwartier opnieuw.', 429)
  }
  const gelezen = await leesJsonOfTeGroot(req, 1000)
  if (gelezen instanceof NextResponse) return gelezen
  const body = typeof gelezen.body === 'object' && gelezen.body !== null ? (gelezen.body as Record<string, unknown>) : {}
  const code = body.code
  const nu = new Date()
  const admin = clubDatabase()
  const link = await bruikbareLink(admin, typeof code === 'string' ? code : null, nu)
  if (!link) return clubFout(LINK_WERKT_NIET, 404)

  const email = normaalEmail(body.email)
  if (!email) return clubFout('Vul een geldig e-mailadres in.', 400)
  const wachtwoord = body.wachtwoord
  const zwak = wachtwoordFout(wachtwoord, { email, naam: volledigeNaam(link.lid) })
  if (zwak || typeof wachtwoord !== 'string') return clubFout(zwak ?? 'Kies een wachtwoord.', 400)

  const uit = await activeerLid(admin, link.toegang, email, wachtwoord, nu)
  switch (uit.staat) {
    case 'ok': {
      const res = clubJson({ staat: 'ok' })
      zetLidCookies(res, uit.sessie)
      return res
    }
    case 'email_bezet':
      return clubFout(EMAIL_BEZET, 409)
    case 'ongeldig':
      return clubFout(LINK_WERKT_NIET, 404)
    default:
      return clubFout('Opslaan mislukt. Probeer het opnieuw.', 502)
  }
}
