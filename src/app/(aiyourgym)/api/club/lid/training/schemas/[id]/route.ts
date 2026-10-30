// GET    /api/club/lid/training/schemas/[id]: een schema van het lid (om te bekijken of te bewerken).
// PUT    /api/club/lid/training/schemas/[id]: bewaren. Eigen schema altijd; dat van de
//        trainer alleen als de sportschool het toestaat (standaard nee).
// DELETE /api/club/lid/training/schemas/[id]: alleen een eigen schema.

import { NextResponse, type NextRequest } from 'next/server'
import { leesJsonOfTeGroot } from '@/lib/club/kern/body'
import { vereisLidToegang, zonderLid } from '@/lib/club/ledenlogin/toegang'
import { bewaarAntwoord, detailAntwoord, verwijderAntwoord } from '@/lib/club/training/lid-schemas/api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  const l = await vereisLidToegang(req, 'schema')
  if (l instanceof NextResponse) return l
  return detailAntwoord(l, (await params).id)
}

export async function PUT(req: NextRequest, { params }: Params) {
  const l = await vereisLidToegang(req, 'schema')
  if (l instanceof NextResponse) return l
  const gelezen = await leesJsonOfTeGroot(req, 60_000)
  if (gelezen instanceof NextResponse) return gelezen
  return bewaarAntwoord(l, (await params).id, zonderLid(gelezen.body))
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const l = await vereisLidToegang(req, 'schema')
  if (l instanceof NextResponse) return l
  return verwijderAntwoord(l, (await params).id)
}
