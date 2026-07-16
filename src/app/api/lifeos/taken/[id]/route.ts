// PATCH  /api/lifeos/taken/[id] — afvinken, hernoemen, verplaatsen, top-3 zetten
// DELETE /api/lifeos/taken/[id] — weg ermee
//
// Zet-top-3 is atomair: de unieke partial index uit migratie 020 laat maar één
// taak per dag per positie toe. Twee tabbladen die tegelijk positie 1 claimen
// leveren dus één winnaar en één nette 409 — niet twee taken op plek 1.
//
// Auth: de founder-gate uit `@/lib/lifeos/admin` (`toegang.admin`/`toegang.userId`).

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { leesTaakWijziging } from '@/lib/lifeos/taken/taken'
import { verwijderTaak, wijzigTaak, type Reden } from '@/lib/lifeos/taken/opslag'

interface Context {
  // Next 16: params is een Promise. Zie node_modules/next/dist/docs →
  // 01-app/03-api-reference/03-file-conventions/route.md
  params: Promise<{ id: string }>
}

function foutAntwoord(reden: Reden) {
  if (reden === 'bezet') {
    return NextResponse.json(
      { fout: 'Die plek in je top-3 is al bezet. Haal eerst de andere taak weg.' },
      { status: 409 },
    )
  }
  if (reden === 'ongeldig') {
    return NextResponse.json(
      { fout: 'Die combinatie kan niet — een top-3-positie hoort bij een dag.' },
      { status: 400 },
    )
  }
  if (reden === 'niet_gevonden') {
    return NextResponse.json({ fout: 'Taak bestaat niet.' }, { status: 404 })
  }
  return NextResponse.json({ fout: 'Opslaan mislukt.' }, { status: 502 })
}

export async function PATCH(req: NextRequest, ctx: Context) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang

  const { id } = await ctx.params

  const body: unknown = await req.json().catch(() => null)
  const wijziging = leesTaakWijziging(body)
  if (!wijziging.ok) {
    return NextResponse.json({ fout: wijziging.fout }, { status: 400 })
  }

  const uitkomst = await wijzigTaak(toegang.admin, toegang.userId, id, wijziging.waarde)
  if (!uitkomst.ok) return foutAntwoord(uitkomst.reden)

  return NextResponse.json({ taak: uitkomst.waarde })
}

export async function DELETE(req: NextRequest, ctx: Context) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang

  const { id } = await ctx.params
  const uitkomst = await verwijderTaak(toegang.admin, toegang.userId, id)
  if (!uitkomst.ok) return foutAntwoord(uitkomst.reden)

  return new NextResponse(null, { status: 204 })
}
