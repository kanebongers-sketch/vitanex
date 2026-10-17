import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, vereisClubToegang } from '@/lib/club/toegang'
import { alsAntwoord, leesJson } from '@/lib/club/rooster/api'
import { leesVorm } from '@/lib/club/lidmaatschappen/invoer'
import { voegVormToe } from '@/lib/club/lidmaatschappen/opslag'

// POST /api/club/lidmaatschappen/vormen  { naam, omschrijving, vestigingen (null = alle), groepslessen,
//   maxLessenPerWeek?, dalVan?, dalTot?, dalWeekendVrij, kleur, actief }  Antwoord: { id }.

export async function POST(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const invoer = leesVorm(await leesJson(req), t.vestigingen)
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  return alsAntwoord(await voegVormToe(t, invoer.waarde))
}
