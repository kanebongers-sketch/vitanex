// GET /api/club/lid/coaching?naam=... of ?kern=...&kern=...
// De coaching van oefeningen voor de ledenapp: de eigen coaching van de
// sportschool van het ingelogde lid, anders de standaardcoaching.

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLidToegang } from '@/lib/club/ledenlogin/toegang'
import { coachingAntwoord } from '@/lib/club/training/coaching/antwoord'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const l = await vereisLidToegang(req, 'schema')
  if (l instanceof NextResponse) return l
  const zoek = new URLSearchParams(req.nextUrl.searchParams)
  zoek.delete('voor')
  return coachingAntwoord(l, zoek)
}
