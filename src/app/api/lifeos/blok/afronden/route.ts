// POST /api/lifeos/blok/afronden — markeert de sessie als klaar, met optioneel de
// RPE en duur. `rondSessieAf` filtert zelf op user_id, dus geen aparte
// eigenaarschap-check nodig: een vreemde trainingId raakt gewoon 0 rijen.

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { rondSessieAf } from '@/lib/lifeos/blok/opslag'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function getalOfNull(v: unknown): number | null | undefined {
  if (v === null || v === undefined) return null
  return typeof v === 'number' ? v : undefined
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ fout: 'Ongeldige invoer.' }, { status: 400 })
  }
  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ fout: 'Ongeldige invoer.' }, { status: 400 })
  }
  const b = body as Record<string, unknown>

  if (typeof b.trainingId !== 'string' || b.trainingId.length === 0) {
    return NextResponse.json({ fout: 'Sessie ontbreekt.' }, { status: 400 })
  }
  const rpe = getalOfNull(b.rpe)
  const duur = getalOfNull(b.duurMinuten)
  if (rpe === undefined || duur === undefined) {
    return NextResponse.json({ fout: 'Ongeldige waarde.' }, { status: 400 })
  }

  const uit = await rondSessieAf(toegang.admin, toegang.userId, b.trainingId, rpe, duur)
  if (!uit.ok) {
    const status = uit.reden === 'ongeldig' ? 400 : uit.reden === 'niet_gevonden' ? 404 : 502
    return NextResponse.json({ fout: 'Kon de sessie niet afronden.' }, { status })
  }

  return NextResponse.json({ ok: true })
}
