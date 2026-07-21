// PATCH  /api/lifeos/finance/facturen/[id] — bijwerken; typisch de status naar
//   'betaald' (of 'verlopen'), of klant/bedrag/datums corrigeren. → { factuur }.
// DELETE /api/lifeos/finance/facturen/[id] — weg ermee → 204.
//
// Auth: de founder-gate uit `@/lib/lifeos/admin` (`toegang.admin`/`toegang.userId`).

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { leesFactuurWijziging } from '@/lib/lifeos/finance/finance'
import { verwijderFactuur, wijzigFactuur, type Reden } from '@/lib/lifeos/finance/opslag'

export const runtime = 'nodejs'

interface Context {
  // Next 16: params is een Promise. Zie node_modules/next/dist/docs →
  // 01-app/03-api-reference/03-file-conventions/route.md
  params: Promise<{ id: string }>
}

function foutAntwoord(reden: Reden) {
  if (reden === 'bezet') {
    return NextResponse.json({ fout: 'Dit botst met een bestaande invoer.' }, { status: 409 })
  }
  if (reden === 'ongeldig') {
    return NextResponse.json({ fout: 'Die combinatie kan niet.' }, { status: 400 })
  }
  if (reden === 'niet_gevonden') {
    return NextResponse.json({ fout: 'Factuur bestaat niet.' }, { status: 404 })
  }
  return NextResponse.json({ fout: 'Opslaan mislukt.' }, { status: 502 })
}

export async function PATCH(req: NextRequest, ctx: Context) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang

  const { id } = await ctx.params

  const body: unknown = await req.json().catch(() => null)
  const wijziging = leesFactuurWijziging(body)
  if (!wijziging.ok) {
    return NextResponse.json({ fout: wijziging.fout }, { status: 400 })
  }

  const uitkomst = await wijzigFactuur(toegang.admin, toegang.userId, id, wijziging.waarde)
  if (!uitkomst.ok) return foutAntwoord(uitkomst.reden)

  return NextResponse.json({ factuur: uitkomst.waarde })
}

export async function DELETE(req: NextRequest, ctx: Context) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang

  const { id } = await ctx.params
  const uitkomst = await verwijderFactuur(toegang.admin, toegang.userId, id)
  if (!uitkomst.ok) return foutAntwoord(uitkomst.reden)

  return new NextResponse(null, { status: 204 })
}
