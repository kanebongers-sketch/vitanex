// /api/lifeos/pt-documenten/[id] — één document aanpassen of verwijderen.
//   PATCH  → body met een of meer van { titel, beschrijving, categorie, volgorde, zichtbaar }
//   DELETE → verwijdert het bestand uit de bucket én de rij
// Auth: de founder-gate uit `@/lib/lifeos/admin`.

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { isUuid } from '@/lib/lifeos/leads/toegang'
import { leesDocumentWijziging } from '@/lib/lifeos/pt-dashboard/documenten-lezers'
import { verwijderDocument, wijzigDocument } from '@/lib/lifeos/pt-dashboard/documenten-opslag'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface Context {
  params: Promise<{ id: string }>
}

const GEEN_CACHE = { 'Cache-Control': 'private, no-store', Vary: 'Authorization' }
const NIET_GEVONDEN = 'Dit document bestaat niet (meer).'

function fout(bericht: string, status: number): NextResponse {
  return NextResponse.json({ fout: bericht }, { status, headers: GEEN_CACHE })
}

export async function PATCH(req: NextRequest, ctx: Context) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang
  const { id } = await ctx.params
  if (!isUuid(id)) return fout(NIET_GEVONDEN, 404)

  const w = leesDocumentWijziging(await req.json().catch(() => null))
  if (!w.ok) return fout(w.fout, 400)

  const uit = await wijzigDocument(toegang.admin, toegang.userId, id, w.waarde)
  if (uit.ok) return NextResponse.json(uit.waarde, { headers: GEEN_CACHE })
  return uit.reden === 'niet_gevonden' ? fout(NIET_GEVONDEN, 404) : fout('Opslaan mislukt. Probeer het opnieuw.', 502)
}

export async function DELETE(req: NextRequest, ctx: Context) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang
  const { id } = await ctx.params
  if (!isUuid(id)) return fout(NIET_GEVONDEN, 404)

  const uit = await verwijderDocument(toegang.admin, toegang.userId, id)
  if (uit.ok) return new NextResponse(null, { status: 204, headers: GEEN_CACHE })
  switch (uit.reden) {
    case 'niet_gevonden':
      return fout(NIET_GEVONDEN, 404)
    case 'opslag':
      return fout('Het bestand kon niet uit de opslag worden verwijderd. Er is niets veranderd; probeer het opnieuw.', 502)
    default:
      return fout('Het bestand is uit de opslag, maar het document staat nog in de lijst. Verwijder het opnieuw.', 502)
  }
}
