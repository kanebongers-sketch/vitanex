// PUT /api/pt/[code]/checkin — de PT'er slaat de weekcheck-in op (achter de pincode).
// Altijd de lopende week (NL-tijd), server-side bepaald: de browser kiest geen week.

import { NextResponse, type NextRequest } from 'next/server'
import { huidigeWeek, leesCheckinInvoer } from '@/lib/lifeos/pt-dashboard/checkin'
import { slaCheckinOp } from '@/lib/lifeos/pt-dashboard/checkin-opslag'
import { GEEN_CACHE, eisZelfdeOorsprong, foutAntwoord, ingelogdeLink } from '@/lib/lifeos/leads/toegang'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface Context {
  params: Promise<{ code: string }>
}

export async function PUT(req: NextRequest, ctx: Context) {
  // Mutaties alleen vanaf onze eigen pagina's (CSRF-vangrail naast SameSite=Lax).
  const vreemd = eisZelfdeOorsprong(req)
  if (vreemd) return vreemd
  const { code } = await ctx.params
  const r = await ingelogdeLink(req, code)
  if (r instanceof NextResponse) return r

  const invoer = leesCheckinInvoer(await req.json().catch(() => null))
  if (!invoer.ok) return foutAntwoord(invoer.fout, 400)

  const nu = new Date()
  const uit = await slaCheckinOp(r.admin, r.link, huidigeWeek(nu), invoer.waarde, nu)
  if (!uit.ok) return foutAntwoord('Opslaan mislukt. Probeer het opnieuw.', 502)
  return NextResponse.json(uit.waarde, { headers: GEEN_CACHE })
}
