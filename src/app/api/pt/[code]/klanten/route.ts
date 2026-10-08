// POST /api/pt/[code]/klanten — een PT-klant met abonnement vastleggen (achter de pincode).

import { NextResponse, type NextRequest } from 'next/server'
import { leesKlantInvoer } from '@/lib/lifeos/pt-dashboard/abonnementen'
import { voegKlantToe } from '@/lib/lifeos/pt-dashboard/klanten-opslag'
import { GEEN_CACHE, foutAntwoord, ingelogdeLink } from '@/lib/lifeos/leads/toegang'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface Context {
  params: Promise<{ code: string }>
}

export async function POST(req: NextRequest, ctx: Context) {
  const { code } = await ctx.params
  const r = await ingelogdeLink(req, code)
  if (r instanceof NextResponse) return r
  const invoer = leesKlantInvoer(await req.json().catch(() => null))
  if (!invoer.ok) return foutAntwoord(invoer.fout, 400)
  const uit = await voegKlantToe(r.admin, r.link, invoer.waarde)
  if (!uit.ok) return foutAntwoord('Opslaan mislukt. Probeer het opnieuw.', 502)
  return NextResponse.json(uit.waarde, { status: 201, headers: GEEN_CACHE })
}
