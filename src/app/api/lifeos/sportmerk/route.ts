// GET /api/lifeos/sportmerk — de strategie van Kane's nieuwe sportmerk.
//
// Waarom een route en geen statische pagina: de FounderPoort in de UI is alleen
// een nette deur. Inhoud die een Server Component rendert, zit óók in de HTML en
// de RSC-payload van wie de URL opent. Het plan mag alleen hier over de lijn,
// achter dezelfde founder-check als `/api/lifeos/toegang`.
//
// `vereisFounder` en niet de volledige data-gate: er is geen database nodig, dus
// een ontbrekende service-role-env mag deze pagina niet breken.

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { vereisFounder } from '@/lib/lifeos/admin'
import { bouwStrategie } from '@/lib/lifeos/sportmerk/strategie'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest): Promise<Response> {
  const toegang = await vereisFounder(req)
  if (toegang instanceof NextResponse) return toegang // 401/403 al klaar
  return NextResponse.json(
    { strategie: bouwStrategie() },
    { headers: { 'Cache-Control': 'private, no-store', Vary: 'Authorization' } },
  )
}
