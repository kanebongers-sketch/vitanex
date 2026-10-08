// PUT    /api/pt/[code]/leads/[id] — een lead bijwerken (hele lead).
// DELETE /api/pt/[code]/leads/[id] — een lead verwijderen (bv. dubbel ingevoerd).
// Achter de pincode; alleen leads van díe PT'er.

import { NextResponse, type NextRequest } from 'next/server'
import { dagSleutelNl, leesNieuweLead } from '@/lib/lifeos/leads/leads'
import { verwijderLead, wijzigLead } from '@/lib/lifeos/leads/opslag'
import { GEEN_CACHE, foutAntwoord, ingelogdeLink, isUuid } from '@/lib/lifeos/leads/toegang'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface Context {
  params: Promise<{ code: string; id: string }>
}

export async function PUT(req: NextRequest, ctx: Context) {
  const { code, id } = await ctx.params
  if (!isUuid(id)) return foutAntwoord('Lead bestaat niet.', 404)
  const r = await ingelogdeLink(req, code)
  if (r instanceof NextResponse) return r
  const invoer = leesNieuweLead(await req.json().catch(() => null), dagSleutelNl(new Date()))
  if (!invoer.ok) return foutAntwoord(invoer.fout, 400)
  const uit = await wijzigLead(r.admin, r.link, id, invoer.waarde)
  if (!uit.ok) return uit.reden === 'niet_gevonden' ? foutAntwoord('Lead bestaat niet.', 404) : foutAntwoord('Opslaan mislukt.', 502)
  return NextResponse.json(uit.waarde, { headers: GEEN_CACHE })
}

export async function DELETE(req: NextRequest, ctx: Context) {
  const { code, id } = await ctx.params
  if (!isUuid(id)) return foutAntwoord('Lead bestaat niet.', 404)
  const r = await ingelogdeLink(req, code)
  if (r instanceof NextResponse) return r
  const uit = await verwijderLead(r.admin, r.link, id)
  if (!uit.ok) return uit.reden === 'niet_gevonden' ? foutAntwoord('Lead bestaat niet.', 404) : foutAntwoord('Verwijderen mislukt.', 502)
  return new Response(null, { status: 204, headers: GEEN_CACHE })
}
