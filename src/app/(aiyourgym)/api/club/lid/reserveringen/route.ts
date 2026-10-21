// POST /api/club/lid/reserveringen  { lesId }
// Het ingelogde lid boekt een les (of komt op de wachtlijst). Altijd met de
// regels voor de app (bron 'app'): wat het lidmaatschap niet toestaat, wordt
// geweigerd. Een lidId in de body telt niet: het lid komt uit de sessie.

import { NextResponse, type NextRequest } from 'next/server'
import { leesJsonOfTeGroot } from '@/lib/club/kern/body'
import { vereisLidToegang, zonderLid } from '@/lib/club/ledenlogin/toegang'
import { boekLesVoorLid } from '@/lib/club/app/acties-training'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const l = await vereisLidToegang(req, 'lessen')
  if (l instanceof NextResponse) return l
  const gelezen = await leesJsonOfTeGroot(req, 1_000)
  if (gelezen instanceof NextResponse) return gelezen
  return boekLesVoorLid(l, l.lid, zonderLid(gelezen.body).lesId)
}
