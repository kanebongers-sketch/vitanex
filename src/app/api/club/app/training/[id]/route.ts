import { NextResponse, type NextRequest } from 'next/server'
import { vereisClubToegang } from '@/lib/club/toegang'
import { wisTraining } from '@/lib/club/app/acties-training'
import { eisVestigingVanRecord } from '@/lib/club/kern/vestiging-toegang'

// DELETE /api/club/app/training/[id]
// Een afgevinkte training weer ongedaan maken (per ongeluk aangetikt).

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const { id } = await params
  const buiten = await eisVestigingVanRecord(t, 'club_trainingslog', id)
  if (buiten) return buiten
  return wisTraining(t, id, null)
}
