import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, vereisClubToegang } from '@/lib/club/toegang'
import { alsAntwoord, leesJson } from '@/lib/club/taken/api'
import { isUuid, leesLijstWijziging } from '@/lib/club/taken/invoer'
import { wijzigLijst } from '@/lib/club/taken/beheer-opslag'

// PATCH /api/club/taken/lijst/[id]  { naam } of { actief } of { verplaats: 'omhoog' | 'omlaag' }

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const { id } = await params
  if (!isUuid(id)) return clubFout('Deze lijst bestaat niet.', 404)
  const w = leesLijstWijziging(await leesJson(req))
  if (!w.ok) return clubFout(w.fout, 400)
  return alsAntwoord(await wijzigLijst(t, id, w.waarde))
}
