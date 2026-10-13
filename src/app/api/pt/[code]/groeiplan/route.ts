// PUT /api/pt/[code]/groeiplan — het groeiplan opslaan (focus, doelen per club, acties).
// Alleen Kane (beheerder) en de eigenaren; PT'ers en clubmanagers lezen het alleen.

import { NextResponse, type NextRequest } from 'next/server'
import { GEEN_CACHE, eisZelfdeOorsprong, foutAntwoord, ingelogdeLink } from '@/lib/lifeos/leads/toegang'
import { leesGroeiplan } from '@/lib/lifeos/pt-dashboard/groeiplan'
import { slaGroeiplanOp } from '@/lib/lifeos/pt-dashboard/groeiplan-opslag'
import { magGroeiplanAanpassen } from '@/lib/lifeos/leads/links'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface Context {
  params: Promise<{ code: string }>
}

export async function PUT(req: NextRequest, ctx: Context) {
  const vreemd = eisZelfdeOorsprong(req)
  if (vreemd) return vreemd
  const { code } = await ctx.params
  const r = await ingelogdeLink(req, code, { eigenaarMag: true })
  if (r instanceof NextResponse) return r
  if (!magGroeiplanAanpassen(r.link.rol)) return foutAntwoord('Het groeiplan passen Kane en de eigenaren aan.', 403)

  const plan = leesGroeiplan(await req.json().catch(() => null))
  if (!plan.ok) return foutAntwoord(plan.fout, 400)
  if (!(await slaGroeiplanOp(r.admin, r.link.userId, plan.waarde, r.link.naam))) return foutAntwoord('Opslaan mislukt. Probeer het opnieuw.', 502)
  return new NextResponse(null, { status: 204, headers: GEEN_CACHE })
}
