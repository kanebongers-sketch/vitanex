import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, vereisClubToegang } from '@/lib/club/toegang'
import { alsAntwoord } from '@/lib/club/personeel/api'
import { isUuid } from '@/lib/club/personeel/invoer'
import { verwijderBeschikbaarheid } from '@/lib/club/personeel/team-opslag'
import { eisVestigingVanRecord } from '@/lib/club/kern/vestiging-toegang'

// DELETE /api/club/personeel/beschikbaarheid/[id]
// Een medewerker alleen bij collega's met wie hij een vestiging deelt (anders 404).

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const { id } = await params
  if (!isUuid(id)) return clubFout('Deze regel bestaat niet.', 404)
  const buiten = await eisVestigingVanRecord(t, 'club_beschikbaarheid', id)
  if (buiten) return buiten
  return alsAntwoord(await verwijderBeschikbaarheid(t, id))
}
