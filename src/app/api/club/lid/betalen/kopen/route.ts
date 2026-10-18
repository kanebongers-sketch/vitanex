// POST /api/club/lid/betalen/kopen  { productId }
// Het ingelogde lid rekent een product van de eigen vestiging af via Stripe
// Checkout. Het antwoord is de url van Stripe. Het bedrag komt uit de database.

import { NextResponse, type NextRequest } from 'next/server'
import { leesJsonOfTeGroot } from '@/lib/club/kern/body'
import { vereisLidToegang, zonderLid } from '@/lib/club/ledenlogin/toegang'
import { koopProduct } from '@/lib/club/betalen/lid-acties'
import { oorsprongVanVerzoek } from '@/lib/club/betalen/toegang'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const l = await vereisLidToegang(req)
  if (l instanceof NextResponse) return l
  const gelezen = await leesJsonOfTeGroot(req, 1_000)
  if (gelezen instanceof NextResponse) return gelezen
  return koopProduct(l, zonderLid(gelezen.body).productId, oorsprongVanVerzoek(req))
}
