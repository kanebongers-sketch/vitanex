// POST /api/lifeos/pt-documenten/upload-url — stap 1 van een upload door Kane.
// Body: { bestandsnaam, grootte, mime? }. Antwoord: { pad, signedUrl, token }.
// De browser PUT het bestand daarna zelf naar `signedUrl` (rechtstreeks naar
// Supabase, niet via Render) en legt dan de metadata vast met POST
// /api/lifeos/pt-documenten. Auth: de founder-gate.

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { leesUploadVerzoek } from '@/lib/lifeos/pt-dashboard/documenten-lezers'
import { maakUploadTicket } from '@/lib/lifeos/pt-dashboard/documenten-opslag'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const GEEN_CACHE = { 'Cache-Control': 'private, no-store', Vary: 'Authorization' }

export async function POST(req: NextRequest) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang

  const verzoek = leesUploadVerzoek(await req.json().catch(() => null))
  if (!verzoek.ok) return NextResponse.json({ fout: verzoek.fout }, { status: 400, headers: GEEN_CACHE })

  const ticket = await maakUploadTicket(toegang.admin, verzoek.waarde.bestandsnaam)
  if (!ticket.ok) {
    return NextResponse.json(
      { fout: 'Kon geen uploadplek maken in de opslag. Staat de bucket pt-documenten er (migratie 355)?' },
      { status: 502, headers: GEEN_CACHE },
    )
  }
  return NextResponse.json(ticket.waarde, { status: 201, headers: GEEN_CACHE })
}
