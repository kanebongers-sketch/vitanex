// PATCH /api/lead/[code]/[id] — een PT'er werkt de status van zijn eigen lead bij.
// Achter de pincode (zie ../route.ts); alleen leads van díe PT'er zijn te wijzigen.

import { NextResponse, type NextRequest } from 'next/server'
import { isStatus } from '@/lib/lifeos/leads/leads'
import { wijzigLeadStatus } from '@/lib/lifeos/leads/opslag'
import { GEEN_CACHE, foutAntwoord, ingelogdeLink } from '@/lib/lifeos/leads/toegang'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

interface Context {
  params: Promise<{ code: string; id: string }>
}

export async function PATCH(req: NextRequest, ctx: Context) {
  const { code, id } = await ctx.params
  if (!UUID.test(id)) return foutAntwoord('Lead bestaat niet.', 404)
  const r = await ingelogdeLink(req, code)
  if (r instanceof NextResponse) return r

  const body: unknown = await req.json().catch(() => null)
  const status = typeof body === 'object' && body !== null ? (body as Record<string, unknown>).status : undefined
  if (!isStatus(status)) return foutAntwoord('Kies een geldige status.', 400)

  const uit = await wijzigLeadStatus(r.admin, r.link, id, status)
  if (!uit.ok) return uit.reden === 'niet_gevonden' ? foutAntwoord('Lead bestaat niet.', 404) : foutAntwoord('Opslaan mislukt.', 502)
  return NextResponse.json(uit.waarde, { headers: GEEN_CACHE })
}
