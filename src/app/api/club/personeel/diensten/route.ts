import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, vereisClubToegang } from '@/lib/club/toegang'
import { alsAntwoord, leesJson } from '@/lib/club/personeel/api'
import { maakDienst } from '@/lib/club/personeel/diensten-opslag'
import { leesDienst } from '@/lib/club/personeel/invoer'

// POST /api/club/personeel/diensten
//   { vestiging, datum, begin, eind, medewerkerId?, soortId?, notitie?, uursoort? }
//   medewerkerId leeg = open dienst. Antwoord: { id }

export async function POST(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const invoer = leesDienst(await leesJson(req))
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  return alsAntwoord(await maakDienst(t, invoer.waarde))
}
