// POST /api/club/betalen/kortingen  { naam, code, soort, waarde, planId, geldigVanaf, geldigTot,
//   duurTermijnen, maxGebruik, vereistBewijs, actief }  Antwoord: { id }.
// Alleen met lidgeld aan, recht Lidmaatschappen.

import { NextResponse, type NextRequest } from 'next/server'
import { leesJsonOfTeGroot } from '@/lib/club/kern/body'
import { vereisLidgeldBeheer } from '@/lib/club/betalen/plannen/toegang'
import { nieuweKorting } from '@/lib/club/betalen/plannen/acties'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const t = await vereisLidgeldBeheer(req)
  if (t instanceof NextResponse) return t
  const gelezen = await leesJsonOfTeGroot(req, 2_000)
  if (gelezen instanceof NextResponse) return gelezen
  return nieuweKorting(t, gelezen.body)
}
