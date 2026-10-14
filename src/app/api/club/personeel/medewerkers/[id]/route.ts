import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, vereisClubToegang } from '@/lib/club/toegang'
import { alsAntwoord, leesJson } from '@/lib/club/personeel/api'
import { isUuid, leesMedewerkerInstelling } from '@/lib/club/personeel/invoer'
import { wijzigMedewerker } from '@/lib/club/personeel/team-opslag'

// PATCH /api/club/personeel/medewerkers/[id]  { contracturen?: number of null, kleur? }

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const { id } = await params
  if (!isUuid(id)) return clubFout('Deze medewerker bestaat niet.', 404)
  const invoer = leesMedewerkerInstelling(await leesJson(req))
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  return alsAntwoord(await wijzigMedewerker(t, id, invoer.waarde))
}
