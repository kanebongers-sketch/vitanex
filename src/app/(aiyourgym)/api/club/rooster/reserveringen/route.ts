import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, vereisClubToegang } from '@/lib/club/toegang'
import { alsAntwoord, leesJson } from '@/lib/club/rooster/api'
import { leesReserveerInvoer } from '@/lib/club/rooster/invoer'
import { reserveer } from '@/lib/club/rooster/opslag'

// POST /api/club/rooster/reserveringen  { lesId, lidId, bron: 'app'|'balie'|'instructeur' }
// Antwoord: { id, status: 'geboekt'|'wachtlijst', wachtpositie } of { fout }.

export async function POST(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const invoer = leesReserveerInvoer(await leesJson(req))
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  return alsAntwoord(await reserveer(t, invoer.waarde))
}
