// POST /api/club/lid/aanmelden/afronden  { token, mailCode, wachtwoord, vormId? }
// De laatste stap van zelf aanmelden via een link: de code uit de mail plus een
// sterk wachtwoord. Daarna is het lid een proeflid van de sportschool (de
// sportschool bevestigt het lidmaatschap later) en is dit toestel meteen
// ingelogd in de ledenapp. Een foute code, een adres dat al bij een lid hoort
// en een onbekende aanmelding geven hetzelfde antwoord. Hooguit 5 pogingen per code.

import { NextResponse, type NextRequest } from 'next/server'
import { clubDatabase } from '@/lib/club/kern/database'
import { ipVan, isZelfdeOorsprong } from '@/lib/club/kern/verzoek'
import { isRateLimited } from '@/lib/utils/rate-limit'
import { clubFout, clubJson } from '@/lib/club/toegang'
import { leesJsonOfTeGroot } from '@/lib/club/kern/body'
import { wachtwoordFout } from '@/lib/club/kern/wachtwoord-regels'
import { CLUB_LEDEN_LOGIN } from '@/lib/club/ledenlogin/schakelaar'
import { zetLidCookies } from '@/lib/club/ledenlogin/inlog-api'
import { leesAanmeldAfronden } from '@/lib/club/nieuwe-leden/regels'
import { rondAanmeldingAf } from '@/lib/club/nieuwe-leden/aanmelden-opslag'
import { getTaal } from '@/lib/aiyourgym/taal/server'
import { AANMELDEN } from '@/lib/aiyourgym/taal/woorden/ledenapp/aanmelden'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const IP_MAX = 20
const VENSTER_MS = 15 * 60_000

export async function POST(req: NextRequest) {
  if (!CLUB_LEDEN_LOGIN) return clubFout('Niet gevonden.', 404)
  const taal = await getTaal()
  const f = AANMELDEN[taal].fouten
  if (!isZelfdeOorsprong(req.headers)) return clubFout(f.nietVanApp, 403)
  if (isRateLimited(`club-lid-aanmelden-af:${ipVan(req)}`, IP_MAX, VENSTER_MS)) return clubFout(f.teVeel, 429)
  const gelezen = await leesJsonOfTeGroot(req, 1000)
  if (gelezen instanceof NextResponse) return gelezen
  const invoer = leesAanmeldAfronden(gelezen.body)
  if (!invoer) return clubFout(f.code, 400)
  // De sterkte vooraf (de naam kennen we hier nog niet; het adres controleert de pagina ook).
  const zwak = wachtwoordFout(invoer.wachtwoord, { taal })
  if (zwak) return clubJson({ fout: zwak, veld: 'wachtwoord' }, 400)

  try {
    const uit = await rondAanmeldingAf(clubDatabase(), invoer, new Date())
    switch (uit.staat) {
      case 'ok': {
        const res = clubJson({ staat: 'ok' })
        zetLidCookies(res, uit.sessie)
        return res
      }
      case 'code':
        return clubJson({ fout: f.code, veld: 'code' }, 400)
      case 'codeOp':
        return clubJson({ fout: f.codeOp, veld: 'code' }, 429)
      case 'verlopen':
        return clubFout(f.verlopen, 410)
      case 'link':
        return clubFout(f.link, 404)
      default:
        return clubFout(f.misgegaan, 500)
    }
  } catch (err) {
    console.error('[club/nieuwe-leden] aanmelden afronden mislukt', err instanceof Error ? err.message : 'onbekend')
    return clubFout(f.misgegaan, 500)
  }
}
