import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, vereisClubToegang } from '@/lib/club/toegang'
import { alsAntwoord, leesJson } from '@/lib/club/rooster/api'
import { leesVestiging } from '@/lib/club/instellingen/validatie'
import { isInstellingSoort, maakItem } from '@/lib/club/instellingen/opslag'

// POST /api/club/instellingen/[soort]  soort = zalen | lestypen | weekrooster | medewerkers
// Body: { vestiging, ...velden }. Antwoord: { id }.

export async function POST(req: NextRequest, { params }: { params: Promise<{ soort: string }> }) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const { soort } = await params
  if (!isInstellingSoort(soort)) return clubFout('Niet gevonden.', 404)
  const body = await leesJson(req)
  const vestiging = leesVestiging(body)
  if (!vestiging) return clubFout('Kies een vestiging.', 400)
  return alsAntwoord(await maakItem(t, soort, vestiging, body))
}
