// PATCH  /api/lifeos/projecten/[id] — hernoemen, omschrijven, (de)archiveren
// DELETE /api/lifeos/projecten/[id] — weg ermee; de taken blijven bestaan
//
// Hernoemen naar een naam die je al hebt is atomair afgevangen: de unieke index
// uit migratie 100 laat maar één project per naam per gebruiker toe (case-
// insensitief). Twee tabbladen die tegelijk naar "MentaForce" hernoemen leveren
// dus één winnaar en één nette 409 — niet twee projecten met dezelfde naam.
//
// Auth: de founder-gate uit `@/lib/lifeos/admin` (`toegang.admin`/`toegang.userId`).

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { isProjectId, leesProjectWijziging } from '@/lib/lifeos/projecten/projecten'
import { verwijderProject, wijzigProject, type Reden } from '@/lib/lifeos/projecten/opslag'

interface Context {
  // Next 16: params is een Promise. Zie node_modules/next/dist/docs →
  // 01-app/03-api-reference/03-file-conventions/route.md
  params: Promise<{ id: string }>
}

function foutAntwoord(reden: Reden) {
  if (reden === 'bestaat_al') {
    return NextResponse.json({ fout: 'Je hebt al een project met die naam.' }, { status: 409 })
  }
  if (reden === 'ongeldig') {
    return NextResponse.json({ fout: 'Die combinatie kan niet.' }, { status: 400 })
  }
  if (reden === 'niet_gevonden') {
    return NextResponse.json({ fout: 'Project bestaat niet.' }, { status: 404 })
  }
  return NextResponse.json({ fout: 'Opslaan mislukt.' }, { status: 502 })
}

export async function PATCH(req: NextRequest, ctx: Context) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang

  const { id } = await ctx.params
  if (!isProjectId(id)) {
    return NextResponse.json({ fout: 'Project bestaat niet.' }, { status: 404 })
  }

  const body: unknown = await req.json().catch(() => null)
  const wijziging = leesProjectWijziging(body)
  if (!wijziging.ok) {
    return NextResponse.json({ fout: wijziging.fout }, { status: 400 })
  }

  const uitkomst = await wijzigProject(toegang.admin, toegang.userId, id, wijziging.waarde)
  if (!uitkomst.ok) return foutAntwoord(uitkomst.reden)

  return NextResponse.json({ project: uitkomst.waarde })
}

export async function DELETE(req: NextRequest, ctx: Context) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang

  const { id } = await ctx.params
  // Een id dat geen uuid is bestaat sowieso niet. Dat hier afvangen scheelt de
  // database een 22P02 en de gebruiker een onbegrijpelijke 400.
  if (!isProjectId(id)) {
    return NextResponse.json({ fout: 'Project bestaat niet.' }, { status: 404 })
  }

  const uitkomst = await verwijderProject(toegang.admin, toegang.userId, id)
  if (!uitkomst.ok) return foutAntwoord(uitkomst.reden)

  return new NextResponse(null, { status: 204 })
}
