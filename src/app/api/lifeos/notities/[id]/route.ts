// DELETE /api/lifeos/notities/[id] — weg ermee
//
// Een brain dump is een buffer, geen archief: dingen weghalen is de normale
// bediening, niet een randgeval. Daarom heeft dit endpoint geen "weet je het
// zeker?" — de kaart draait optimistisch terug én zegt het als het misgaat, en
// dat is de betere plek voor die twijfel.

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { verwijderNotitie, type Reden } from '@/lib/lifeos/notities/opslag'

interface Context {
  // Next 16: params is een Promise. Zie node_modules/next/dist/docs →
  // 01-app/03-api-reference/03-file-conventions/route.md
  params: Promise<{ id: string }>
}

function foutAntwoord(reden: Reden) {
  if (reden === 'niet_gevonden') {
    return NextResponse.json({ fout: 'Notitie bestaat niet.' }, { status: 404 })
  }
  if (reden === 'ongeldig') {
    return NextResponse.json({ fout: 'Dat kan niet.' }, { status: 400 })
  }
  return NextResponse.json({ fout: 'Verwijderen mislukt.' }, { status: 502 })
}

export async function DELETE(req: NextRequest, ctx: Context) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang

  const { id } = await ctx.params
  const uitkomst = await verwijderNotitie(toegang.admin, toegang.userId, id)
  if (!uitkomst.ok) return foutAntwoord(uitkomst.reden)

  return new NextResponse(null, { status: 204 })
}
