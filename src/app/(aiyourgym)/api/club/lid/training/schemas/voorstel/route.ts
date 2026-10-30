// POST /api/club/lid/training/schemas/voorstel { doel, dagen, materiaal, niveau }
// De snelle start: een voorstel met de vaste regels van het schemavoorstel.
// Er wordt niets opgeslagen; het lid past het eerst aan en bewaart het dan.

import { NextResponse, type NextRequest } from 'next/server'
import { leesJsonOfTeGroot } from '@/lib/club/kern/body'
import { vereisLidToegang, zonderLid } from '@/lib/club/ledenlogin/toegang'
import { voorstelAntwoord } from '@/lib/club/training/lid-schemas/api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const l = await vereisLidToegang(req, 'schema')
  if (l instanceof NextResponse) return l
  const gelezen = await leesJsonOfTeGroot(req, 2_000)
  if (gelezen instanceof NextResponse) return gelezen
  return voorstelAntwoord(l, zonderLid(gelezen.body))
}
