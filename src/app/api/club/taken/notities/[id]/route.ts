import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, vereisClubToegang } from '@/lib/club/toegang'
import { alsAntwoord } from '@/lib/club/taken/api'
import { isUuid } from '@/lib/club/taken/invoer'
import { verwijderNotitie } from '@/lib/club/taken/afvink-opslag'
import { eisVestigingVanRecord } from '@/lib/club/kern/vestiging-toegang'

// DELETE /api/club/taken/notities/[id]  geeft { weg: true }

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const { id } = await params
  const buiten = await eisVestigingVanRecord(t, 'club_taak_notities', id)
  if (buiten) return buiten
  if (!isUuid(id)) return clubFout('Deze notitie bestaat niet.', 404)
  return alsAntwoord(await verwijderNotitie(t, id))
}
