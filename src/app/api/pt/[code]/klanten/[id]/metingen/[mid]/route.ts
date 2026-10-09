// DELETE /api/pt/[code]/klanten/[id]/metingen/[mid] — een meting verwijderen (verkeerd ingevoerd).
// Achter de pincode; alleen metingen van een klant van díe PT'er.

import { NextResponse, type NextRequest } from 'next/server'
import { verwijderMeting } from '@/lib/lifeos/pt-dashboard/dossier-opslag'
import { GEEN_CACHE, eisZelfdeOorsprong, foutAntwoord, isUuid, klantToegang } from '@/lib/lifeos/leads/toegang'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface Context {
  params: Promise<{ code: string; id: string; mid: string }>
}

export async function DELETE(req: NextRequest, ctx: Context) {
  // Mutaties alleen vanaf onze eigen pagina's (CSRF-vangrail naast SameSite=Lax).
  const vreemd = eisZelfdeOorsprong(req)
  if (vreemd) return vreemd
  const { code, id, mid } = await ctx.params
  if (!isUuid(id) || !isUuid(mid)) return foutAntwoord('Meting bestaat niet.', 404)
  const r = await klantToegang(req, code, id)
  if (r instanceof NextResponse) return r
  const uit = await verwijderMeting(r.admin, r.link, id, mid)
  if (!uit.ok) return uit.reden === 'niet_gevonden' ? foutAntwoord('Meting bestaat niet.', 404) : foutAntwoord('Verwijderen mislukt.', 502)
  return new Response(null, { status: 204, headers: GEEN_CACHE })
}
