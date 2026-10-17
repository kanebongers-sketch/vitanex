// POST /api/club/inloggen/[code]/pin  { pin }
// Een eigenaar of clubmanager kiest een pincode van 6 cijfers. Die werkt pas als
// Kane hem goedkeurt; het antwoord bevat de controlecode die Kane nodig heeft. Een
// gekozen pin kan hier niet overschreven worden (alleen Kane kan resetten).

import type { NextRequest } from 'next/server'
import { createLifeosAdminClient } from '@/lib/lifeos/admin'
import { ipVan, isZelfdeOorsprong, leesPin } from '@/lib/lifeos/leads/toegang'
import { isRateLimited } from '@/lib/utils/rate-limit'
import { clubFout, clubJson, haalEigenOrganisatie, hostPastBij } from '@/lib/club/toegang'
import { kiesBeheerderPin, vindBeheerder } from '@/lib/club/beheerders/beheerder-opslag'
import { CLUB_EIGEN_LOGIN } from '@/lib/club/beheerders/schakelaar'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Een pin kiezen gebeurt een keer; meer dan dit per IP is geen mens. */
const IP_MAX = 10
const IP_VENSTER_MS = 15 * 60_000

interface Context {
  params: Promise<{ code: string }>
}

export async function POST(req: NextRequest, ctx: Context) {
  if (!CLUB_EIGEN_LOGIN) return clubFout('Niet gevonden.', 404)
  if (!isZelfdeOorsprong(req.headers)) return clubFout('Dit verzoek komt niet van de app zelf.', 403)
  if (isRateLimited(`club-pin:${ipVan(req)}`, IP_MAX, IP_VENSTER_MS)) {
    return clubFout('Te veel pogingen vanaf dit netwerk. Probeer het over een kwartier opnieuw.', 429)
  }
  const { code } = await ctx.params
  const admin = createLifeosAdminClient()
  const b = await vindBeheerder(admin, code)
  if (!b) return clubFout('Niet gevonden.', 404)
  // Op het subdomein van een andere sportschool bestaat deze link niet.
  const { organisatie } = await haalEigenOrganisatie(admin, b.organisatieId)
  if (!organisatie || !(await hostPastBij(organisatie))) return clubFout('Niet gevonden.', 404)
  const pin = leesPin(await req.json().catch(() => null))
  if (!pin) return clubFout('Kies een pincode van precies 6 cijfers.', 400)

  const uit = await kiesBeheerderPin(admin, b, pin, new Date())
  if (uit.staat === 'db') return clubFout('Opslaan mislukt. Probeer het opnieuw.', 502)
  if (uit.staat === 'al_gekozen') return clubFout('Voor deze link is al een pincode gekozen.', 409)
  // De controlecode gaat alleen naar wie de pin net koos, nooit bij een later bezoek.
  return clubJson({ staat: 'wacht', controle: uit.controle })
}
