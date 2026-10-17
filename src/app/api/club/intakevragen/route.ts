import { NextResponse, type NextRequest } from 'next/server'
import { vereisClubToegang } from '@/lib/club/toegang'
import { alsAntwoord, leesJson } from '@/lib/club/rooster/api'
import { voegVraagToe } from '@/lib/club/intakevragen/opslag'

// POST /api/club/intakevragen  { vraag, uitleg?, soort, opties?, verplicht, gezondheid, sectie, actief }
// Een eigen intakevraag voor de actieve sportschool. Antwoord: { id }.

export async function POST(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  return alsAntwoord(await voegVraagToe(t, await leesJson(req)))
}
