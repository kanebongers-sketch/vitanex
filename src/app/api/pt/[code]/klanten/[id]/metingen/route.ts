// POST /api/pt/[code]/klanten/[id]/metingen — een meting vastleggen (start, tussentijds, eind).
// Achter de pincode; alleen klanten van díe PT'er.

import { NextResponse, type NextRequest } from 'next/server'
import { dagSleutelNl } from '@/lib/lifeos/leads/leads'
import { leesMetingInvoer } from '@/lib/lifeos/pt-dashboard/metingen'
import { voegMetingToe } from '@/lib/lifeos/pt-dashboard/dossier-opslag'
import { GEEN_CACHE, foutAntwoord, ingelogdeLink, isUuid } from '@/lib/lifeos/leads/toegang'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface Context {
  params: Promise<{ code: string; id: string }>
}

export async function POST(req: NextRequest, ctx: Context) {
  const { code, id } = await ctx.params
  if (!isUuid(id)) return foutAntwoord('Klant bestaat niet.', 404)
  const r = await ingelogdeLink(req, code)
  if (r instanceof NextResponse) return r
  const invoer = leesMetingInvoer(await req.json().catch(() => null), dagSleutelNl(new Date()))
  if (!invoer.ok) return foutAntwoord(invoer.fout, 400)
  const uit = await voegMetingToe(r.admin, r.link, id, invoer.waarde)
  if (!uit.ok) return uit.reden === 'niet_gevonden' ? foutAntwoord('Klant bestaat niet.', 404) : foutAntwoord('Opslaan mislukt. Probeer het opnieuw.', 502)
  return NextResponse.json(uit.waarde, { status: 201, headers: GEEN_CACHE })
}
