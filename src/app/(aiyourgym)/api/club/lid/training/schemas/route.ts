// GET  /api/club/lid/training/schemas: de actieve schema's van het lid ("Mijn schema's").
// POST /api/club/lid/training/schemas { naam, doel, niveau, dagTitels, regels }:
//      een eigen schema maken; het wordt meteen het schema in de app.
// Het lid komt altijd uit de sessie; een lidId in de body telt nooit.

import { NextResponse, type NextRequest } from 'next/server'
import { leesJsonOfTeGroot } from '@/lib/club/kern/body'
import { vereisLidToegang, zonderLid } from '@/lib/club/ledenlogin/toegang'
import { keuzesAntwoord, maakAntwoord } from '@/lib/club/training/lid-schemas/api'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const l = await vereisLidToegang(req, 'schema')
  if (l instanceof NextResponse) return l
  return keuzesAntwoord(l)
}

export async function POST(req: NextRequest) {
  const l = await vereisLidToegang(req, 'schema')
  if (l instanceof NextResponse) return l
  const gelezen = await leesJsonOfTeGroot(req, 60_000)
  if (gelezen instanceof NextResponse) return gelezen
  return maakAntwoord(l, zonderLid(gelezen.body))
}
