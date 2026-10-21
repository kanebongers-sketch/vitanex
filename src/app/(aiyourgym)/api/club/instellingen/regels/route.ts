import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, vereisClubToegang } from '@/lib/club/toegang'
import { alsAntwoord, leesJson } from '@/lib/club/rooster/api'
import { leesRegelsInvoer } from '@/lib/club/instellingen/validatie'
import { hoortBij } from '@/lib/club/kern/vestigingen'
import { slaRegelsOp } from '@/lib/club/instellingen/opslag'

// PUT /api/club/instellingen/regels  { vestiging, regels: { annuleerUren, ... }, openingstijden: [7 x { van, tot } | null] }

export async function PUT(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const invoer = leesRegelsInvoer(await leesJson(req))
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  if (!hoortBij(t.vestigingen, invoer.waarde.vestiging)) return clubFout('Onbekende vestiging.', 400)
  return alsAntwoord(await slaRegelsOp(t, invoer.waarde))
}
