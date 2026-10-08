// PUT    /api/pt/[code]/klanten/[id] — klant/abonnement bijwerken (bv. opzeggen, bevriezen).
// DELETE /api/pt/[code]/klanten/[id] — verwijderen (verkeerd ingevoerd).
// Achter de pincode; alleen klanten van díe PT'er — of, voor de beheerder, van het
// hele team (met `trainerId` in de body verplaatst hij de klant naar een andere trainer).

import { NextResponse, type NextRequest } from 'next/server'
import { leesKlantInvoer } from '@/lib/lifeos/pt-dashboard/abonnementen'
import { verplaatsKlant, verwijderKlant, wijzigKlant } from '@/lib/lifeos/pt-dashboard/klanten-opslag'
import { GEEN_CACHE, foutAntwoord, isUuid, klantToegang, verplaatsNaar } from '@/lib/lifeos/leads/toegang'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface Context {
  params: Promise<{ code: string; id: string }>
}

export async function PUT(req: NextRequest, ctx: Context) {
  const { code, id } = await ctx.params
  if (!isUuid(id)) return foutAntwoord('Klant bestaat niet.', 404)
  const r = await klantToegang(req, code, id)
  if (r instanceof NextResponse) return r
  const body: unknown = await req.json().catch(() => null)
  const invoer = leesKlantInvoer(body)
  if (!invoer.ok) return foutAntwoord(invoer.fout, 400)
  const uit = await wijzigKlant(r.admin, r.link, id, invoer.waarde)
  if (!uit.ok) return uit.reden === 'niet_gevonden' ? foutAntwoord('Klant bestaat niet.', 404) : foutAntwoord('Opslaan mislukt.', 502)
  const naar = await verplaatsNaar(r, typeof body === 'object' && body !== null ? (body as Record<string, unknown>).trainerId : undefined)
  if (naar) {
    const verplaatst = await verplaatsKlant(r.admin, r.link, id, naar)
    if (!verplaatst.ok) return foutAntwoord('Opgeslagen, maar verplaatsen naar de andere trainer mislukte.', 502)
  }
  return NextResponse.json(uit.waarde, { headers: GEEN_CACHE })
}

export async function DELETE(req: NextRequest, ctx: Context) {
  const { code, id } = await ctx.params
  if (!isUuid(id)) return foutAntwoord('Klant bestaat niet.', 404)
  const r = await klantToegang(req, code, id)
  if (r instanceof NextResponse) return r
  const uit = await verwijderKlant(r.admin, r.link, id)
  if (!uit.ok) return uit.reden === 'niet_gevonden' ? foutAntwoord('Klant bestaat niet.', 404) : foutAntwoord('Verwijderen mislukt.', 502)
  return new Response(null, { status: 204, headers: GEEN_CACHE })
}
