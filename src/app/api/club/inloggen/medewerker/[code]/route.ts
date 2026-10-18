// POST /api/club/inloggen/medewerker/[code]  { pin }
// Een medewerker logt in met de pincode van zijn persoonlijke link. Goed: een
// httpOnly-sessiecookie voor dit toestel. Met de schakelaar uit, een onbekende
// of ingetrokken link, of een medewerker uit dienst: een gewone 404.

import type { NextRequest } from 'next/server'
import { createLifeosAdminClient } from '@/lib/lifeos/admin'
import { ipVan, isZelfdeOorsprong, leesPin } from '@/lib/lifeos/leads/toegang'
import { isRateLimited } from '@/lib/utils/rate-limit'
import { clubFout, clubJson, haalEigenOrganisatie, hostPastBij } from '@/lib/club/toegang'
import { medewerkerCookie } from '@/lib/club/medewerker-login/medewerker-login'
import { logInMedewerker, vindMedewerkerLink } from '@/lib/club/medewerker-login/opslag'
import { CLUB_EIGEN_LOGIN } from '@/lib/club/beheerders/schakelaar'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Per IP: ruim boven wat een mens tikt, ver onder wat bruteforce nodig heeft. */
const IP_MAX = 20
const IP_VENSTER_MS = 15 * 60_000

const TIJD = new Intl.DateTimeFormat('nl-NL', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'Europe/Amsterdam' })

interface Context {
  params: Promise<{ code: string }>
}

export async function POST(req: NextRequest, ctx: Context) {
  if (!CLUB_EIGEN_LOGIN) return clubFout('Niet gevonden.', 404)
  if (!isZelfdeOorsprong(req.headers)) return clubFout('Dit verzoek komt niet van de app zelf.', 403)
  if (isRateLimited(`club-mw-inloggen:${ipVan(req)}`, IP_MAX, IP_VENSTER_MS)) {
    return clubFout('Te veel inlogpogingen vanaf dit netwerk. Probeer het over een kwartier opnieuw.', 429)
  }
  const { code } = await ctx.params
  const admin = createLifeosAdminClient()
  const gevonden = await vindMedewerkerLink(admin, code)
  if (!gevonden) return clubFout('Niet gevonden.', 404)
  // Op het subdomein van een andere sportschool bestaat deze link niet.
  const { organisatie } = await haalEigenOrganisatie(admin, gevonden.toegang.userId)
  if (!organisatie || !(await hostPastBij(organisatie))) return clubFout('Niet gevonden.', 404)
  const pin = leesPin(await req.json().catch(() => null))
  if (!pin) return clubFout('Vul je pincode van 6 cijfers in.', 400)

  const uit = await logInMedewerker(admin, gevonden.toegang, pin, new Date())
  switch (uit.staat) {
    case 'ok': {
      const res = clubJson({ staat: 'ok' })
      res.cookies.set(medewerkerCookie(), uit.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        expires: uit.verlooptOp,
      })
      return res
    }
    case 'fout':
      return clubFout(`Pincode klopt niet. Nog ${uit.over} poging${uit.over === 1 ? '' : 'en'}.`, 401)
    case 'geblokkeerd':
      return clubFout(`Te vaak een foute pincode. Probeer het na ${TIJD.format(new Date(uit.totOp))} opnieuw.`, 429)
    case 'gesloten':
      return clubFout('Te vaak een foute pincode: deze link is dicht. Vraag je leidinggevende om de pincode te resetten.', 429)
    case 'niet_actief':
      return clubFout('Je pincode is nog niet goedgekeurd.', 403)
    default:
      return clubFout('Inloggen mislukt. Probeer het opnieuw.', 502)
  }
}
