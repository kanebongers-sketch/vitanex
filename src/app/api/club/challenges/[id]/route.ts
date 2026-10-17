import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, vereisClubToegang } from '@/lib/club/toegang'
import { alsAntwoord, leesJson } from '@/lib/club/rooster/api'
import { isUuid } from '@/lib/club/rooster/invoer'
import { leesWijziging } from '@/lib/club/challenges/invoer'
import { stopChallenge, wijzigChallenge } from '@/lib/club/challenges/opslag'

// PATCH /api/club/challenges/[id]  { actie: 'stoppen' }  of de hele challenge opnieuw.
// Verwijderen kan niet: een gestopte of afgelopen challenge blijft terug te zien.

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const { id } = await params
  if (!isUuid(id)) return clubFout('Deze challenge bestaat niet.', 404)
  const invoer = leesWijziging(await leesJson(req), t.vestigingen)
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  const actie = invoer.waarde
  return alsAntwoord(actie.soort === 'stoppen' ? await stopChallenge(t, id) : await wijzigChallenge(t, id, actie.waarde))
}
