// POST /api/club/betalen/producten: een product toevoegen (alleen Kane en de eigenaar).

import { NextResponse, type NextRequest } from 'next/server'
import { leesJsonOfTeGroot } from '@/lib/club/kern/body'
import { vereisBetalenBeheer } from '@/lib/club/betalen/toegang'
import { nieuwProduct } from '@/lib/club/betalen/beheer-acties'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const t = await vereisBetalenBeheer(req)
  if (t instanceof NextResponse) return t
  const gelezen = await leesJsonOfTeGroot(req, 4_000)
  if (gelezen instanceof NextResponse) return gelezen
  return nieuwProduct(t, gelezen.body)
}
