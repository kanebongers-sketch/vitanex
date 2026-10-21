import { NextResponse, type NextRequest } from 'next/server'
import { vereisClubToegang } from '@/lib/club/toegang'
import { alsAntwoord } from '@/lib/club/rooster/api'
import { labelsOvernemen } from '@/lib/club/lidmaatschappen/opslag'

// POST /api/club/lidmaatschappen/labels/overnemen
// Elke tag van leden die nog geen label is, wordt een label. Antwoord: { toegevoegd }.

export async function POST(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  return alsAntwoord(await labelsOvernemen(t))
}
