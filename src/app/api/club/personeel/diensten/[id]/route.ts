import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, vereisClubToegang } from '@/lib/club/toegang'
import { alsAntwoord, leesJson } from '@/lib/club/personeel/api'
import { verwijderDienst, wijzigDienst } from '@/lib/club/personeel/diensten-opslag'
import { isUuid, leesDienst } from '@/lib/club/personeel/invoer'

// PATCH  /api/club/personeel/diensten/[id]  zelfde body als POST (de hele dienst)
// DELETE /api/club/personeel/diensten/[id]  alleen zolang er geen uren op staan

interface Ctx {
  params: Promise<{ id: string }>
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const { id } = await params
  if (!isUuid(id)) return clubFout('Deze dienst bestaat niet.', 404)
  const invoer = leesDienst(await leesJson(req))
  if (!invoer.ok) return clubFout(invoer.fout, 400)
  return alsAntwoord(await wijzigDienst(t, id, invoer.waarde))
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const t = await vereisClubToegang(req)
  if (t instanceof NextResponse) return t
  const { id } = await params
  if (!isUuid(id)) return clubFout('Deze dienst bestaat niet.', 404)
  return alsAntwoord(await verwijderDienst(t, id))
}
