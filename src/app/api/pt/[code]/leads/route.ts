// POST /api/pt/[code]/leads — een PT'er voegt een lead toe (achter de pincode).

import { NextResponse, type NextRequest } from 'next/server'
import { dagSleutelNl, leesNieuweLead } from '@/lib/lifeos/leads/leads'
import { voegLeadToe } from '@/lib/lifeos/leads/opslag'
import { GEEN_CACHE, eisZelfdeOorsprong, foutAntwoord, nieuwToegang } from '@/lib/lifeos/leads/toegang'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface Context {
  params: Promise<{ code: string }>
}

export async function POST(req: NextRequest, ctx: Context) {
  // Mutaties alleen vanaf onze eigen pagina's (CSRF-vangrail naast SameSite=Lax).
  const vreemd = eisZelfdeOorsprong(req)
  if (vreemd) return vreemd
  const { code } = await ctx.params
  const body: unknown = await req.json().catch(() => null)
  const trainerId = typeof body === 'object' && body !== null ? (body as Record<string, unknown>).trainerId : undefined
  const r = await nieuwToegang(req, code, trainerId)
  if (r instanceof NextResponse) return r

  const nu = new Date()
  const invoer = leesNieuweLead(body, dagSleutelNl(nu))
  if (!invoer.ok) return foutAntwoord(invoer.fout, 400)

  const uit = await voegLeadToe(r.admin, r.link, invoer.waarde, nu)
  if (!uit.ok) {
    return uit.reden === 'te_veel'
      ? foutAntwoord('Even rustig aan: te veel leads in het afgelopen uur. Probeer het straks opnieuw.', 429)
      : foutAntwoord('Opslaan mislukt. Probeer het opnieuw.', 502)
  }
  return NextResponse.json(uit.waarde, { status: 201, headers: GEEN_CACHE })
}
