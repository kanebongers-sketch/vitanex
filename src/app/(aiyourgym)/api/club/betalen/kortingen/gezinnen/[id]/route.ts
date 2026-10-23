// PATCH  /api/club/betalen/kortingen/gezinnen/[id]  { naam, vanaf, kortingId }
// DELETE /api/club/betalen/kortingen/gezinnen/[id]  weg (niet als er contracten aan hangen).

import { NextResponse, type NextRequest } from 'next/server'
import { leesJsonOfTeGroot } from '@/lib/club/kern/body'
import { vereisLidgeldBeheer } from '@/lib/club/betalen/plannen/toegang'
import { haalGezinWeg, pasGezinAan } from '@/lib/club/betalen/plannen/acties'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface Context {
  params: Promise<{ id: string }>
}

export async function PATCH(req: NextRequest, ctx: Context) {
  const t = await vereisLidgeldBeheer(req)
  if (t instanceof NextResponse) return t
  const gelezen = await leesJsonOfTeGroot(req, 1_000)
  if (gelezen instanceof NextResponse) return gelezen
  return pasGezinAan(t, (await ctx.params).id, gelezen.body)
}

export async function DELETE(req: NextRequest, ctx: Context) {
  const t = await vereisLidgeldBeheer(req)
  if (t instanceof NextResponse) return t
  return haalGezinWeg(t, (await ctx.params).id)
}
