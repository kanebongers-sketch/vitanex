import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, vereisClubToegang } from '@/lib/club/toegang'
import { hoortBij } from '@/lib/club/kern/vestigingen'
import { alsAntwoord, leesJson } from '@/lib/club/taken/api'
import { leesNieuweLijst } from '@/lib/club/taken/invoer'
import { maakLijst } from '@/lib/club/taken/beheer-opslag'

// POST /api/club/taken/lijst  { vestiging, naam }  geeft de nieuwe lijst

export async function POST(req: NextRequest) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const invoer = leesNieuweLijst(await leesJson(req))
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  if (!hoortBij(t.vestigingen, invoer.waarde.vestiging)) return clubFout('Onbekende vestiging.', 400)
  return alsAntwoord(await maakLijst(t, invoer.waarde.vestiging, invoer.waarde.naam))
}
