// GET /api/lifeos/beleggen/zoek?q=… — aandelen/ETF's zoeken op ticker, naam of ISIN (Yahoo).
// Auth: de founder-gate uit `@/lib/lifeos/admin`.

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { zoekNotering } from '@/lib/lifeos/beleggen/yahoo'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (q.length < 2 || q.length > 60) return NextResponse.json({ resultaten: [] })
  return NextResponse.json({ resultaten: await zoekNotering(q) }, { headers: { 'Cache-Control': 'private, no-store', Vary: 'Authorization' } })
}
