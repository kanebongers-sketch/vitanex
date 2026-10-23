// POST /api/club/lid/inloggen  { email, wachtwoord, sportschool? }
// Een lid logt in op de ledenapp met e-mailadres en wachtwoord (besluit Kane
// 23-10-2026; geen link of pincode meer). Goed: een httpOnly-sessiecookie van
// 90 dagen voor dit toestel. Is het adres lid bij meer sportscholen met dit
// wachtwoord, dan antwoordt de route { staat: 'kies', sportscholen } en stuurt
// de pagina het opnieuw met de gekozen `sportschool` (zie lib/ledenlogin/inloggen.ts).
// Onbekend adres en fout wachtwoord: hetzelfde antwoord. Schakelaar uit: 404.

import { NextResponse, type NextRequest } from 'next/server'
import { clubDatabase } from '@/lib/club/kern/database'
import { ipVan, isZelfdeOorsprong } from '@/lib/club/kern/verzoek'
import { isRateLimited } from '@/lib/utils/rate-limit'
import { clubFout, clubJson } from '@/lib/club/toegang'
import { leesJsonOfTeGroot } from '@/lib/club/kern/body'
import { isUuid } from '@/lib/club/kern/organisatie'
import { MAX_LENGTE, normaalEmail } from '@/lib/club/kern/wachtwoord-regels'
import { remSleutel } from '@/lib/club/kern/rem-hash'
import { CLUB_LEDEN_LOGIN } from '@/lib/club/ledenlogin/schakelaar'
import { logInMetEmail } from '@/lib/club/ledenlogin/inloggen'
import { DICHT_TEKST, INLOG_FOUT, blokkadeTekst, zetLidCookies } from '@/lib/club/ledenlogin/inlog-api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Per IP: ruim boven wat een mens tikt, ver onder wat raden nodig heeft. */
const IP_MAX = 20
/** Per e-mailadres (als HMAC, nooit het adres zelf): de rem in de database telt daarnaast per account. */
const EMAIL_MAX = 10
const VENSTER_MS = 15 * 60_000

function lees(body: unknown): { email: string | null; wachtwoord: string | null; sportschool: string | null } {
  const b = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {}
  const w = b.wachtwoord
  return {
    email: normaalEmail(b.email),
    wachtwoord: typeof w === 'string' && w.length > 0 && w.length <= MAX_LENGTE ? w : null,
    sportschool: isUuid(b.sportschool) ? b.sportschool : null,
  }
}

export async function POST(req: NextRequest) {
  if (!CLUB_LEDEN_LOGIN) return clubFout('Niet gevonden.', 404)
  if (!isZelfdeOorsprong(req.headers)) return clubFout('Dit verzoek komt niet van de app zelf.', 403)
  if (isRateLimited(`club-lid-inloggen:${ipVan(req)}`, IP_MAX, VENSTER_MS)) {
    return clubFout('Te veel inlogpogingen vanaf dit netwerk. Probeer het over een kwartier opnieuw.', 429)
  }
  const gelezen = await leesJsonOfTeGroot(req, 1000)
  if (gelezen instanceof NextResponse) return gelezen
  const { email, wachtwoord, sportschool } = lees(gelezen.body)
  if (!wachtwoord) return clubFout('Vul je e-mailadres en wachtwoord in.', 400)
  if (!email) return clubFout(INLOG_FOUT, 401)
  if (isRateLimited(`club-lid-inloggen-email:${remSleutel('lid-inloggen', email)}`, EMAIL_MAX, VENSTER_MS)) {
    return clubFout('Te veel inlogpogingen voor dit e-mailadres. Probeer het over een kwartier opnieuw.', 429)
  }

  const uit = await logInMetEmail(clubDatabase(), email, wachtwoord, sportschool, new Date())
  switch (uit.staat) {
    case 'ok': {
      const res = clubJson({ staat: 'ok' })
      zetLidCookies(res, uit.sessie)
      return res
    }
    case 'kies':
      return clubJson({ staat: 'kies', sportscholen: uit.sportscholen })
    case 'fout':
      return clubFout(INLOG_FOUT, 401)
    case 'geblokkeerd':
      return clubFout(blokkadeTekst(uit.totOp), 429)
    case 'dicht':
      return clubFout(DICHT_TEKST, 429)
    default:
      return clubFout('Inloggen mislukt. Probeer het opnieuw.', 502)
  }
}
