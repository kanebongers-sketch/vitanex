import { type NextRequest, NextResponse } from 'next/server'
import { vereisClubToegang } from '@/lib/club/toegang'
import { coachingAntwoord } from '@/lib/club/training/coaching/antwoord'

// GET /api/club/training/coaching?naam=Back%20squat
//   De coaching van een oefening: de eigen coaching van de sportschool als die
//   er is, anders de standaardcoaching. { coaching, eigen } (coaching null als
//   er geen is).
// GET /api/club/training/coaching?kern=Back%20squat&kern=Lat%20pulldown
//   Alleen de kernpunten van meerdere oefeningen, voor het geprinte schema.
// De ledenapp gebruikt /api/club/lid/coaching (zelfde antwoord).

export async function GET(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  return coachingAntwoord(t, req.nextUrl.searchParams)
}
