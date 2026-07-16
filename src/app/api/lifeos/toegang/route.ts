// GET /api/lifeos/toegang — bevestigt of de huidige gebruiker LifeOS mag zien.
// Eén bron van waarheid voor de gate: dezelfde `vereisLifeosToegang` als elke
// data-route. De FounderPoort in de UI leunt hierop, zodat de check nooit
// uiteenloopt met wat de data-routes toestaan.

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest): Promise<Response> {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang // 401/403 al klaar
  return NextResponse.json(
    { ok: true },
    { headers: { 'Cache-Control': 'private, no-store', Vary: 'Authorization' } },
  )
}
