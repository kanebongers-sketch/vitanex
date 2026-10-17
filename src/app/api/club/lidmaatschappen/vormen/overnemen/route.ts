import { NextResponse, type NextRequest } from 'next/server'
import { vereisClubToegang } from '@/lib/club/toegang'
import { alsAntwoord } from '@/lib/club/rooster/api'
import { vormenOvernemen } from '@/lib/club/lidmaatschappen/opslag'

// POST /api/club/lidmaatschappen/vormen/overnemen
// Elke abonnementsnaam uit de ledenlijst die nog geen vorm is, wordt een vorm. Antwoord: { toegevoegd }.

export async function POST(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  return alsAntwoord(await vormenOvernemen(t))
}
