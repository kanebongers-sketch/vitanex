import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, vereisClubToegang } from '@/lib/club/toegang'
import { alsAntwoord, leesJson } from '@/lib/club/rooster/api'
import { isUuid, leesAfvinkInvoer } from '@/lib/club/rooster/invoer'
import { zetAfvinkStatus } from '@/lib/club/rooster/opslag'

// PATCH /api/club/rooster/reserveringen/[id]  { status: 'aanwezig'|'no_show'|'geboekt' }

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const { id } = await params
  if (!isUuid(id)) return clubFout('Deze reservering bestaat niet.', 404)
  const status = leesAfvinkInvoer(await leesJson(req))
  if (!status.ok) return clubFout(status.fout, 400)
  return alsAntwoord(await zetAfvinkStatus(t, id, status.waarde))
}
