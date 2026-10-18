import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, vereisClubToegang } from '@/lib/club/toegang'
import { alsAntwoord } from '@/lib/club/personeel/api'
import { isUuid } from '@/lib/club/personeel/invoer'
import { verwijderNotitie } from '@/lib/club/personeel/team-opslag'
import { eisVestigingVanRecord } from '@/lib/club/kern/vestiging-toegang'

// DELETE /api/club/personeel/notities/[id]

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const { id } = await params
  const buiten = await eisVestigingVanRecord(t, 'club_rooster_notities', id)
  if (buiten) return buiten
  if (!isUuid(id)) return clubFout('Deze mededeling bestaat niet.', 404)
  return alsAntwoord(await verwijderNotitie(t, id))
}
