// DELETE /api/lifeos/notities/[id] — weg ermee
// PATCH  /api/lifeos/notities/[id] — tekst, titel, tags en/of categorie bijwerken
//
// Een brain dump is een buffer, geen archief: dingen weghalen is de normale
// bediening, niet een randgeval. Daarom heeft dit endpoint geen "weet je het
// zeker?" — de kaart draait optimistisch terug én zegt het als het misgaat, en
// dat is de betere plek voor die twijfel.
//
// Verwijderen raakt de kennisgrafiek vanzelf goed, zonder dat deze route iets
// hoeft te doen: `notitie_links.bron_id` cascadeert (de verwijzingen stonden in
// die tekst) en `doel_id` valt terug naar null (er wérd naar verwezen — dat blijft
// waar). Dat staat in migratie 110, niet hier, want een database-garantie hoort
// niet in een route te wonen.

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { synchroniseerNotitieKennis } from '@/lib/lifeos/notities/kennis'
import { leesNotitieWijziging } from '@/lib/lifeos/notities/notities'
import { verwijderNotitie, wijzigNotitie, type Reden } from '@/lib/lifeos/notities/opslag'

interface Context {
  // Next 16: params is een Promise. Zie node_modules/next/dist/docs →
  // 01-app/03-api-reference/03-file-conventions/route.md
  params: Promise<{ id: string }>
}

/**
 * Eén vertaling van opslag-uitkomst naar HTTP. `mislukt` komt van de caller: een
 * DELETE die faalt is "Verwijderen mislukt", een PATCH "Opslaan mislukt" — twee
 * routes met één melding laat de gebruiker het verkeerde denken.
 */
function foutAntwoord(reden: Reden, mislukt: string) {
  if (reden === 'niet_gevonden') {
    return NextResponse.json({ fout: 'Notitie bestaat niet.' }, { status: 404 })
  }
  if (reden === 'ongeldig') {
    return NextResponse.json({ fout: 'Dat kan niet.' }, { status: 400 })
  }
  if (reden === 'bezet') {
    // De partiële unieke index op de titel (migratie 110). Zeg wát er botst en
    // waaróm het zo is — "opslaan mislukt" laat je raden.
    return NextResponse.json(
      {
        fout:
          'Je hebt al een notitie met die titel. Titels zijn uniek, anders weet een ' +
          'verwijzing niet welke notitie je bedoelt.',
      },
      { status: 409 },
    )
  }
  return NextResponse.json({ fout: mislukt }, { status: 502 })
}

export async function DELETE(req: NextRequest, ctx: Context) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang

  const { id } = await ctx.params
  const uitkomst = await verwijderNotitie(toegang.admin, toegang.userId, id)
  if (!uitkomst.ok) return foutAntwoord(uitkomst.reden, 'Verwijderen mislukt.')

  return new NextResponse(null, { status: 204 })
}

export async function PATCH(req: NextRequest, ctx: Context) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang

  const body: unknown = await req.json().catch(() => null)
  const wijziging = leesNotitieWijziging(body)
  if (!wijziging.ok) {
    return NextResponse.json({ fout: wijziging.fout }, { status: 400 })
  }

  const { id } = await ctx.params
  const uitkomst = await wijzigNotitie(toegang.admin, toegang.userId, id, wijziging.waarde)
  if (!uitkomst.ok) return foutAntwoord(uitkomst.reden, 'Opslaan mislukt.')

  // Alleen als de tekst of de titel raakte: een tag of categorie verandert de
  // verwijzingen niet, en dan is hersyncen twee queries voor niets.
  const raaktKennis = wijziging.waarde.tekst !== undefined || wijziging.waarde.titel !== undefined
  const waarschuwing = raaktKennis
    ? await synchroniseerNotitieKennis(toegang.admin, toegang.userId, uitkomst.waarde)
    : null

  return NextResponse.json({ notitie: uitkomst.waarde, waarschuwing })
}
