// PATCH  /api/club/betalen/plannen/[id]  het hele plan opnieuw (zelfde velden als POST, zonder vormId),
//   plus prijsVanaf (jjjj-mm-dd) als het plan al contracten heeft en de prijs verandert.
// DELETE /api/club/betalen/plannen/[id]  weg, of uit de verkoop als er contracten zijn.

import { NextResponse, type NextRequest } from 'next/server'
import { leesJsonOfTeGroot } from '@/lib/club/kern/body'
import { vereisLidgeldBeheer } from '@/lib/club/betalen/plannen/toegang'
import { haalPlanWeg, pasPlanAan } from '@/lib/club/betalen/plannen/acties'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface Context {
  params: Promise<{ id: string }>
}

export async function PATCH(req: NextRequest, ctx: Context) {
  const t = await vereisLidgeldBeheer(req)
  if (t instanceof NextResponse) return t
  const gelezen = await leesJsonOfTeGroot(req, 4_000)
  if (gelezen instanceof NextResponse) return gelezen
  return pasPlanAan(t, (await ctx.params).id, gelezen.body)
}

export async function DELETE(req: NextRequest, ctx: Context) {
  const t = await vereisLidgeldBeheer(req)
  if (t instanceof NextResponse) return t
  return haalPlanWeg(t, (await ctx.params).id)
}
