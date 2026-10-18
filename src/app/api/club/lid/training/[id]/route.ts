// DELETE /api/club/lid/training/[id]
// Een eigen afgevinkte training ongedaan maken; alleen trainingen van dit lid.

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLidToegang } from '@/lib/club/ledenlogin/toegang'
import { wisTraining } from '@/lib/club/app/acties-training'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const l = await vereisLidToegang(req, 'schema')
  if (l instanceof NextResponse) return l
  const { id } = await params
  return wisTraining(l, id, l.lid.id)
}
