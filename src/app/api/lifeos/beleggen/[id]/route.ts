// PATCH  /api/lifeos/beleggen/[id] — aantal, aankoopprijs (GAK) of inleg in euro bijwerken.
// DELETE /api/lifeos/beleggen/[id] — positie verwijderen (verkocht).
// Auth: de founder-gate uit `@/lib/lifeos/admin`.

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { verwijderPositie, wijzigPositie } from '@/lib/lifeos/beleggen/opslag'
import { leesWijziging } from '@/lib/lifeos/beleggen/invoer'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface Context {
  // Next 16: params is een Promise (zie taken/[id]/route.ts).
  params: Promise<{ id: string }>
}

export async function PATCH(req: NextRequest, ctx: Context) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang
  const { id } = await ctx.params
  const wijziging = leesWijziging(await req.json().catch(() => null))
  if (!wijziging.ok) return NextResponse.json({ fout: wijziging.fout }, { status: 400 })
  const uit = await wijzigPositie(toegang.admin, toegang.userId, id, wijziging.waarde)
  if (!uit.ok) return NextResponse.json({ fout: uit.reden === 'niet_gevonden' ? 'Positie bestaat niet.' : 'Opslaan mislukt.' }, { status: uit.reden === 'niet_gevonden' ? 404 : 502 })
  return NextResponse.json(uit.waarde, { headers: { 'Cache-Control': 'private, no-store', Vary: 'Authorization' } })
}

export async function DELETE(req: NextRequest, ctx: Context) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang
  const { id } = await ctx.params
  const uit = await verwijderPositie(toegang.admin, toegang.userId, id)
  if (!uit.ok) return NextResponse.json({ fout: uit.reden === 'niet_gevonden' ? 'Positie bestaat niet.' : 'Verwijderen mislukt.' }, { status: uit.reden === 'niet_gevonden' ? 404 : 502 })
  return new Response(null, { status: 204 })
}
