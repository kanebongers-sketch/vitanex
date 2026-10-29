// DELETE /api/club/lid/voeding/producten/[id]  een eigen product weghalen (gelogde regels blijven staan)

import { NextResponse, type NextRequest } from 'next/server'
import { clubFout, clubJson } from '@/lib/club/toegang'
import { isUuid } from '@/lib/club/kern/organisatie'
import { verwijderEigenProduct } from '@/lib/club/voeding/dagboek/opslag'
import { vereisLidVoeding } from '@/lib/club/voeding/dagboek/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Ctx = { params: Promise<{ id: string }> }

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const l = await vereisLidVoeding(req, { schrijft: true })
  if (l instanceof NextResponse) return l
  const { id } = await ctx.params
  if (!isUuid(id)) return clubFout('Niet gevonden.', 404)
  const ok = await verwijderEigenProduct(l.admin, l.userId, l.lid.id, id)
  return ok ? clubJson({ ok: true }) : clubFout('Verwijderen lukt nu niet. Probeer het opnieuw.', 500)
}
