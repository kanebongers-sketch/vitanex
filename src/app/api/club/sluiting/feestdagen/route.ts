import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, vereisClubToegang } from '@/lib/club/toegang'
import { alsAntwoord, leesJson } from '@/lib/club/rooster/api'
import { leesFeestdagen } from '@/lib/club/sluiting/invoer'
import { voegFeestdagenToe } from '@/lib/club/sluiting/opslag'

// POST /api/club/sluiting/feestdagen  { jaar, vestiging (leeg = alle), keuzes: [{ sleutel, soort, van?, tot? }] }
// De Nederlandse feestdagen van een jaar in een keer; wat er al staat wordt overgeslagen.
// Antwoord: { toegevoegd, overgeslagen }.

export async function POST(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const invoer = leesFeestdagen(await leesJson(req), t.vestigingen)
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  return alsAntwoord(await voegFeestdagenToe(t, invoer.waarde))
}
