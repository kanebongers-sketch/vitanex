// POST /api/club/lid/training  { schemaId, dag }
// Het ingelogde lid vinkt een training uit het eigen schema af.

import { NextResponse, type NextRequest } from 'next/server'
import { leesJsonOfTeGroot } from '@/lib/club/kern/body'
import { vereisLidToegang, zonderLid } from '@/lib/club/ledenlogin/toegang'
import { vinkTrainingAf } from '@/lib/club/app/acties-training'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const l = await vereisLidToegang(req, 'schema')
  if (l instanceof NextResponse) return l
  const gelezen = await leesJsonOfTeGroot(req, 1_000)
  if (gelezen instanceof NextResponse) return gelezen
  const b = zonderLid(gelezen.body)
  return vinkTrainingAf(l, l.lid, { schemaId: b.schemaId, dag: b.dag })
}
