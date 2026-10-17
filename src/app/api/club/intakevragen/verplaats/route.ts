import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, vereisClubToegang } from '@/lib/club/toegang'
import { alsAntwoord, leesJson } from '@/lib/club/rooster/api'
import { leesVerplaatsing } from '@/lib/club/intakevragen/invoer'
import { verplaats } from '@/lib/club/intakevragen/opslag'

// POST /api/club/intakevragen/verplaats
//   { wat: 'vraag', id, richting: 'omhoog' | 'omlaag' }   binnen de sectie
//   { wat: 'sectie', sectie, richting }                   een hele sectie

export async function POST(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const invoer = leesVerplaatsing(await leesJson(req))
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  return alsAntwoord(await verplaats(t, invoer.waarde))
}
