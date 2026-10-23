// POST /api/club/betalen/kortingen/gezinnen  { naam, vanaf, kortingId }  Antwoord: { id }.
// De gezinskorting: alleen de instelling; toepassen op facturen komt in een latere fase.

import { NextResponse, type NextRequest } from 'next/server'
import { leesJsonOfTeGroot } from '@/lib/club/kern/body'
import { vereisLidgeldBeheer } from '@/lib/club/betalen/plannen/toegang'
import { nieuwGezin } from '@/lib/club/betalen/plannen/acties'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const t = await vereisLidgeldBeheer(req)
  if (t instanceof NextResponse) return t
  const gelezen = await leesJsonOfTeGroot(req, 1_000)
  if (gelezen instanceof NextResponse) return gelezen
  return nieuwGezin(t, gelezen.body)
}
