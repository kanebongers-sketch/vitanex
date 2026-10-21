import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, vereisClubToegang } from '@/lib/club/toegang'
import { hoortBij } from '@/lib/club/kern/vestigingen'
import { alsAntwoord, leesJson } from '@/lib/club/rooster/api'
import { leesGenereerInvoer } from '@/lib/club/rooster/invoer'
import { genereerLessen } from '@/lib/club/rooster/opslag'

// POST /api/club/rooster/genereren  { vestiging, weken = 6 }
// Maakt de lessen uit het weekrooster aan; bestaande lessen blijven staan. Antwoord: { aangemaakt }.

export async function POST(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const invoer = leesGenereerInvoer(await leesJson(req))
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  if (!hoortBij(t.vestigingen, invoer.waarde.vestiging)) return clubFout('Onbekende vestiging.', 400)
  return alsAntwoord(await genereerLessen(t, invoer.waarde.vestiging, invoer.waarde.weken))
}
