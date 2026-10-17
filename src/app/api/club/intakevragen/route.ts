import { NextResponse, type NextRequest } from 'next/server'
import { vereisClubToegang } from '@/lib/club/toegang'
import { alsAntwoord } from '@/lib/club/rooster/api'
import { leesJsonOfTeGroot } from '@/lib/club/kern/body'
import { voegVraagToe } from '@/lib/club/intakevragen/opslag'

// POST /api/club/intakevragen  { vraag, uitleg?, soort, opties?, verplicht, gezondheid, sectie, actief }
// Een eigen intakevraag voor de actieve sportschool. Antwoord: { id }.

export async function POST(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const b = await leesJsonOfTeGroot(req, 16_000)
  if (b instanceof NextResponse) return b
  return alsAntwoord(await voegVraagToe(t, b.body))
}
