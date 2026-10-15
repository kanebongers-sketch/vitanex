// DELETE /api/pt/[code]/leads/[id]/notities/[nid] — een notitie uit het logboek
// van een lead weghalen (bv. een typfout). Zelfde toegang als de lead zelf.

import { NextResponse, type NextRequest } from 'next/server'
import { verwijderLeadNotitie } from '@/lib/lifeos/leads/opslag'
import { GEEN_CACHE, eisZelfdeOorsprong, foutAntwoord, isUuid, leadToegang } from '@/lib/lifeos/leads/toegang'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface Context {
  params: Promise<{ code: string; id: string; nid: string }>
}

export async function DELETE(req: NextRequest, ctx: Context) {
  const vreemd = eisZelfdeOorsprong(req)
  if (vreemd) return vreemd
  const { code, id, nid } = await ctx.params
  if (!isUuid(id) || !isUuid(nid)) return foutAntwoord('Notitie bestaat niet.', 404)
  const r = await leadToegang(req, code, id)
  if (r instanceof NextResponse) return r
  const uit = await verwijderLeadNotitie(r.admin, r.link, id, nid)
  if (!uit.ok) return uit.reden === 'niet_gevonden' ? foutAntwoord('Notitie bestaat niet.', 404) : foutAntwoord('Verwijderen mislukt.', 502)
  return new Response(null, { status: 204, headers: GEEN_CACHE })
}
