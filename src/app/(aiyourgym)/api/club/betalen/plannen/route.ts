// POST /api/club/betalen/plannen  { vormId, naam, interval, bedragCent, btwProcent, contractMaanden,
//   opzegtermijnDagen, verlenging, proefDagen, inschrijfkostenCent, vestigingen, doelgroep,
//   vereistBewijs, factuurDag, proRataEerste, actief, volgorde }  Antwoord: { id }.
// Alleen met lidgeld aan (zie src/lib/club/betalen/plannen/toegang.ts), recht Lidmaatschappen.

import { NextResponse, type NextRequest } from 'next/server'
import { leesJsonOfTeGroot } from '@/lib/club/kern/body'
import { vereisLidgeldBeheer } from '@/lib/club/betalen/plannen/toegang'
import { nieuwPlan } from '@/lib/club/betalen/plannen/acties'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const t = await vereisLidgeldBeheer(req)
  if (t instanceof NextResponse) return t
  const gelezen = await leesJsonOfTeGroot(req, 4_000)
  if (gelezen instanceof NextResponse) return gelezen
  return nieuwPlan(t, gelezen.body)
}
