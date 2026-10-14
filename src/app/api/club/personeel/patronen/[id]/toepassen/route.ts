import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, vereisClubToegang } from '@/lib/club/toegang'
import { alsAntwoord, leesJson } from '@/lib/club/personeel/api'
import { isUuid, leesToepassen } from '@/lib/club/personeel/invoer'
import { pasPatroonToe } from '@/lib/club/personeel/plannen-opslag'

// POST /api/club/personeel/patronen/[id]/toepassen  { vestiging, maandag, weken (1 tot 12), vervang? }
//   Antwoord: { toegevoegd }

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const { id } = await params
  if (!isUuid(id)) return clubFout('Dit patroon bestaat niet.', 404)
  const invoer = leesToepassen(await leesJson(req))
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  const { vestiging, maandag, weken, vervang } = invoer.waarde
  return alsAntwoord(await pasPatroonToe(t, id, vestiging, maandag, weken, vervang))
}
