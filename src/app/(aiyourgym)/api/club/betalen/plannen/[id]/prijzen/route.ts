// DELETE /api/club/betalen/plannen/[id]/prijzen?vanaf=jjjj-mm-dd
// Een geplande prijswijziging intrekken, alleen zolang hij nog niet is ingegaan.

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLidgeldBeheer } from '@/lib/club/betalen/plannen/toegang'
import { prijsIntrekken } from '@/lib/club/betalen/plannen/acties'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface Context {
  params: Promise<{ id: string }>
}

export async function DELETE(req: NextRequest, ctx: Context) {
  const t = await vereisLidgeldBeheer(req)
  if (t instanceof NextResponse) return t
  return prijsIntrekken(t, (await ctx.params).id, req.nextUrl.searchParams.get('vanaf'))
}
