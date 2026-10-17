import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, vereisClubToegang } from '@/lib/club/toegang'
import { alsAntwoord, leesJson } from '@/lib/club/rooster/api'
import { leesSluiting } from '@/lib/club/sluiting/invoer'
import { voegSluitingToe } from '@/lib/club/sluiting/opslag'

// POST /api/club/sluiting  { datum, vestiging (leeg = alle), soort, van?, tot?, reden }
// Een sluitingsdag of dag met afwijkende openingstijden toevoegen. Antwoord: { id }.

export async function POST(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const invoer = leesSluiting(await leesJson(req), t.vestigingen)
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  return alsAntwoord(await voegSluitingToe(t, invoer.waarde))
}
