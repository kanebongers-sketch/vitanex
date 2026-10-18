// POST /api/club/betalen/verkopen/[id]/terugbetalen: het hele bedrag terug naar
// het lid (alleen Kane en de eigenaar). De webhook verwerkt de uitkomst.

import { NextResponse, type NextRequest } from 'next/server'
import { vereisBetalenBeheer } from '@/lib/club/betalen/toegang'
import { betaalTerug } from '@/lib/club/betalen/beheer-acties'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const t = await vereisBetalenBeheer(req)
  if (t instanceof NextResponse) return t
  return betaalTerug(t, (await ctx.params).id)
}
