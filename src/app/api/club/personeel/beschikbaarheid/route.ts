import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, vereisClubToegang } from '@/lib/club/toegang'
import { alsAntwoord, leesJson } from '@/lib/club/personeel/api'
import { leesBeschikbaar } from '@/lib/club/personeel/invoer'
import { voegBeschikbaarheidToe } from '@/lib/club/personeel/team-opslag'

// POST /api/club/personeel/beschikbaarheid
//   { medewerkerId, datum, datumTot?, beschikbaar, van?, tot?, reden? (verlof, vrij of ziek), notitie? }

export async function POST(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const invoer = leesBeschikbaar(await leesJson(req))
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  return alsAntwoord(await voegBeschikbaarheidToe(t, invoer.waarde))
}
