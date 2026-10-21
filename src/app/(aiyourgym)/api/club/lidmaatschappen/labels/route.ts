import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, vereisClubToegang } from '@/lib/club/toegang'
import { alsAntwoord, leesJson } from '@/lib/club/rooster/api'
import { leesLabel } from '@/lib/club/lidmaatschappen/invoer'
import { voegLabelToe } from '@/lib/club/lidmaatschappen/opslag'

// POST /api/club/lidmaatschappen/labels  { naam, omschrijving, kleur }  Antwoord: { id }.

export async function POST(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const invoer = leesLabel(await leesJson(req))
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  return alsAntwoord(await voegLabelToe(t, invoer.waarde))
}
