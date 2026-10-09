// /api/lifeos/pt-documenten — Kane beheert de documenten voor zijn PT'ers.
//   GET  → { documenten: PtDocument[] } (ook de verborgen)
//   POST → legt de metadata vast ná de upload (stap 2). Body: { pad, titel,
//          beschrijving, categorie, volgorde, zichtbaar }. Controleert dat het
//          bestand echt in de bucket staat; mime en grootte komen van de server.
// Auth: de founder-gate uit `@/lib/lifeos/admin`.

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { leesDocumentInvoer } from '@/lib/lifeos/pt-dashboard/documenten-lezers'
import { haalDocumenten, voegDocumentToe } from '@/lib/lifeos/pt-dashboard/documenten-opslag'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const GEEN_CACHE = { 'Cache-Control': 'private, no-store', Vary: 'Authorization' }

function fout(bericht: string, status: number): NextResponse {
  return NextResponse.json({ fout: bericht }, { status, headers: GEEN_CACHE })
}

export async function GET(req: NextRequest) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang
  const uit = await haalDocumenten(toegang.admin, toegang.userId, { alleenZichtbaar: false })
  if (!uit.ok) return fout('Kon de documenten niet lezen. Is migratie 355 toegepast?', 502)
  return NextResponse.json({ documenten: uit.waarde }, { headers: GEEN_CACHE })
}

export async function POST(req: NextRequest) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang

  const invoer = leesDocumentInvoer(await req.json().catch(() => null))
  if (!invoer.ok) return fout(invoer.fout, 400)

  const uit = await voegDocumentToe(toegang.admin, toegang.userId, invoer.waarde)
  if (uit.ok) return NextResponse.json(uit.waarde, { status: 201, headers: GEEN_CACHE })
  switch (uit.reden) {
    case 'niet_gevonden':
      return fout('Het bestand staat niet in de opslag. De upload is niet gelukt; probeer het opnieuw.', 409)
    case 'te_groot':
      return fout('Het bestand is groter dan 50 MB en is weer verwijderd.', 413)
    case 'soort':
      return fout('De inhoud van het bestand past niet bij de extensie; het is weer verwijderd. Upload het originele bestand.', 415)
    default:
      return fout('Opslaan mislukt. Probeer het opnieuw.', 502)
  }
}
