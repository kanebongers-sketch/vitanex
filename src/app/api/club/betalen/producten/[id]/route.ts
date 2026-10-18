// PATCH  /api/club/betalen/producten/[id]: een product aanpassen.
// DELETE /api/club/betalen/producten/[id]: weg, of uit de verkoop als er al van verkocht is.
// Alleen Kane en de eigenaar.

import { NextResponse, type NextRequest } from 'next/server'
import { leesJsonOfTeGroot } from '@/lib/club/kern/body'
import { vereisBetalenBeheer } from '@/lib/club/betalen/toegang'
import { haalProductWeg, pasProductAan } from '@/lib/club/betalen/beheer-acties'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface Context {
  params: Promise<{ id: string }>
}

export async function PATCH(req: NextRequest, ctx: Context) {
  const t = await vereisBetalenBeheer(req)
  if (t instanceof NextResponse) return t
  const gelezen = await leesJsonOfTeGroot(req, 4_000)
  if (gelezen instanceof NextResponse) return gelezen
  return pasProductAan(t, (await ctx.params).id, gelezen.body)
}

export async function DELETE(req: NextRequest, ctx: Context) {
  const t = await vereisBetalenBeheer(req)
  if (t instanceof NextResponse) return t
  return haalProductWeg(t, (await ctx.params).id)
}
