// POST /api/club/lid/betalen/strippenkaart  { lesId }
// Het ingelogde lid boekt een groepsles met een strip, als het lidmaatschap
// geen groepslessen toestaat. Zie src/lib/club/betalen/regels.ts.

import { NextResponse, type NextRequest } from 'next/server'
import { leesJsonOfTeGroot } from '@/lib/club/kern/body'
import { vereisLidToegang, zonderLid } from '@/lib/club/ledenlogin/toegang'
import { boekMetStrippenkaart } from '@/lib/club/betalen/lid-acties'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const l = await vereisLidToegang(req, 'lessen')
  if (l instanceof NextResponse) return l
  const gelezen = await leesJsonOfTeGroot(req, 1_000)
  if (gelezen instanceof NextResponse) return gelezen
  return boekMetStrippenkaart(l, zonderLid(gelezen.body).lesId)
}
