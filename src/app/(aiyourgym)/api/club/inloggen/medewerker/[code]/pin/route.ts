// POST /api/club/inloggen/medewerker/[code]/pin  { pin }
// Een medewerker kiest een pincode van 6 cijfers. Die werkt pas als de eigenaar
// of clubmanager hem goedkeurt; het antwoord bevat de controlecode die de
// medewerker aan hem noemt. Een gekozen pin kan hier niet overschreven worden.

import type { NextRequest } from 'next/server'
import { clubDatabase } from '@/lib/club/kern/database'
import { ipVan, isZelfdeOorsprong, leesPin } from '@/lib/club/kern/verzoek'
import { isRateLimited } from '@/lib/utils/rate-limit'
import { clubFout, clubJson, haalEigenOrganisatie, hostPastBij } from '@/lib/club/toegang'
import { kiesMedewerkerPin, vindMedewerkerLink } from '@/lib/club/medewerker-login/opslag'
import { isZwakkePin } from '@/lib/club/ledenlogin/pin-keuze'
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
  if (isRateLimited(`club-mw-pin:${ipVan(req)}`, IP_MAX, IP_VENSTER_MS)) {
    return clubFout('Te veel pogingen vanaf dit netwerk. Probeer het over een kwartier opnieuw.', 429)
  }
  const { code } = await ctx.params
  const admin = clubDatabase()
  const gevonden = await vindMedewerkerLink(admin, code)
  if (!gevonden) return clubFout('Niet gevonden.', 404)
  const { organisatie } = await haalEigenOrganisatie(admin, gevonden.toegang.userId)
  if (!organisatie || !(await hostPastBij(organisatie))) return clubFout('Niet gevonden.', 404)
  const pin = leesPin(await req.json().catch(() => null))
  if (!pin) return clubFout('Kies een pincode van precies 6 cijfers.', 400)

  if (isZwakkePin(pin)) return clubFout('Deze pincode is te makkelijk te raden. Kies een andere.', 400)

  const uit = await kiesMedewerkerPin(admin, gevonden.toegang, pin, new Date())
  if (uit.staat === 'db') return clubFout('Opslaan mislukt. Probeer het opnieuw.', 502)
  if (uit.staat === 'al_gekozen') return clubFout('Voor deze link is al een pincode gekozen.', 409)
  // De controlecode gaat alleen naar wie de pin net koos, nooit bij een later bezoek.
  return clubJson({ staat: 'wacht', controle: uit.controle })
}
