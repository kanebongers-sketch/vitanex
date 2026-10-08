// GET /api/lifeos/pt-app/eigenaren — de eigenaren met hun PT-app-link en de
// stand van hun pincode (Beheer in de PT-app). Auth: de founder-gate.

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { haalEigenaren } from '@/lib/lifeos/leads/links'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang
  const eigenaren = await haalEigenaren(toegang.admin, toegang.userId)
  if (!eigenaren) return NextResponse.json({ fout: 'De eigenaren konden niet geladen worden.' }, { status: 502 })
  return NextResponse.json({ eigenaren }, { headers: { 'Cache-Control': 'private, no-store', Vary: 'Authorization' } })
}
