import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, vereisClubToegang } from '@/lib/club/toegang'
import { alsAntwoord, leesJson } from '@/lib/club/rooster/api'
import { leesChallenge } from '@/lib/club/challenges/invoer'
import { maakChallenge } from '@/lib/club/challenges/opslag'

// POST /api/club/challenges  { titel, uitleg, soort, doel, start, eind, vestigingen, deelname, zichtbaarApp, ranglijst }
// Een nieuwe challenge voor de leden. Antwoord: { id }.

export async function POST(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const invoer = leesChallenge(await leesJson(req), t.vestigingen)
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  return alsAntwoord(await maakChallenge(t, invoer.waarde))
}
