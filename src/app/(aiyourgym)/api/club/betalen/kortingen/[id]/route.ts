// PATCH  /api/club/betalen/kortingen/[id]  de hele korting opnieuw (zelfde velden als POST).
// DELETE /api/club/betalen/kortingen/[id]  weg, of uitgezet als een contract of gezin hem gebruikt.

import { NextResponse, type NextRequest } from 'next/server'
import { leesJsonOfTeGroot } from '@/lib/club/kern/body'
import { vereisLidgeldBeheer } from '@/lib/club/betalen/plannen/toegang'
import { haalKortingWeg, pasKortingAan } from '@/lib/club/betalen/plannen/acties'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface Context {
  params: Promise<{ id: string }>
}

export async function PATCH(req: NextRequest, ctx: Context) {
  const t = await vereisLidgeldBeheer(req)
  if (t instanceof NextResponse) return t
  const gelezen = await leesJsonOfTeGroot(req, 2_000)
  if (gelezen instanceof NextResponse) return gelezen
  return pasKortingAan(t, (await ctx.params).id, gelezen.body)
}

export async function DELETE(req: NextRequest, ctx: Context) {
  const t = await vereisLidgeldBeheer(req)
  if (t instanceof NextResponse) return t
  return haalKortingWeg(t, (await ctx.params).id)
}
