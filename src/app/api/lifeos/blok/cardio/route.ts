// POST /api/lifeos/blok/cardio — bewaart de details van een Zone 2- of Hyrox-sessie.
// De trainingId komt van de client en is NIET automatisch van Kane; bewaarCardio
// doet daarom zelf de eigenaarschap-check voordat het onder die sessie schrijft.

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { bewaarCardio } from '@/lib/lifeos/blok/opslag'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function statusVoor(reden: string): number {
  if (reden === 'ongeldig') return 400
  if (reden === 'niet_gevonden') return 404
  return 502
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
  if (b.soort !== 'zone2' && b.soort !== 'hyrox') {
    return NextResponse.json({ fout: 'Onbekende cardio-soort.' }, { status: 400 })
  }
  // De losse meetvelden; leesCardioDetails (in bewaarCardio) is de laatste sluis.
  const details = typeof b.details === 'object' && b.details !== null ? (b.details as Record<string, unknown>) : {}

  const uit = await bewaarCardio(toegang.admin, toegang.userId, b.trainingId, b.soort, details)
  if (!uit.ok) return NextResponse.json({ fout: 'Kon de cardio niet opslaan.' }, { status: statusVoor(uit.reden) })

  return NextResponse.json({ ok: true })
}
