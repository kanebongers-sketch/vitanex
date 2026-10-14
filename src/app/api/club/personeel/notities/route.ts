import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, vereisClubToegang } from '@/lib/club/toegang'
import { alsAntwoord, leesJson } from '@/lib/club/personeel/api'
import { leesNotitie } from '@/lib/club/personeel/invoer'
import { maakNotitie } from '@/lib/club/personeel/team-opslag'

// POST /api/club/personeel/notities
//   { vestiging, datum, van?, tot?, soort: 'mededeling' of 'geen_afspraken', medewerkerId?, tekst }

export async function POST(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const invoer = leesNotitie(await leesJson(req))
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  return alsAntwoord(await maakNotitie(t, invoer.waarde))
}
