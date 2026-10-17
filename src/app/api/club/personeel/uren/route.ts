import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, vereisClubToegang } from '@/lib/club/toegang'
import { hoortBij } from '@/lib/club/kern/vestigingen'
import { nlDelen } from '@/lib/club/rooster/tijd'
import { alsAntwoord, leesJson } from '@/lib/club/personeel/api'
import { leesUrenBulk } from '@/lib/club/personeel/invoer'
import { urenInBulk } from '@/lib/club/personeel/uren-opslag'

// POST /api/club/personeel/uren  { vestiging, actie: 'goedkeuren' of 'verwerken', van, tot }
//   goedkeuren: alle gewerkte diensten zonder afwijking; verwerken: alle goedgekeurde.
//   Antwoord: { aantal, overgeslagen }

export async function POST(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const invoer = leesUrenBulk(await leesJson(req))
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  if (!hoortBij(t.vestigingen, invoer.waarde.vestiging)) return clubFout('Onbekende vestiging.', 400)
  const { vestiging, actie, van, tot } = invoer.waarde
  return alsAntwoord(await urenInBulk(t, vestiging, actie, van, tot, nlDelen(new Date())))
}
