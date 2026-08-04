// POST /api/lifeos/blok/set — logt één set (idempotent per training+oefening+set).
// De trainingId komt van de client; die is NIET automatisch van Kane, dus we
// controleren eerst het eigenaarschap voordat we onder die sessie schrijven.

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { hoortTrainingBijGebruiker, logSet, type SetRij } from '@/lib/lifeos/blok/opslag'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function statusVoor(reden: string): number {
  if (reden === 'ongeldig') return 400
  if (reden === 'niet_gevonden') return 404
  return 502
}

/** Een getal of null; alles anders (string, NaN via JSON) → 'ongeldig' verderop. */
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

  const trainingId = b.trainingId
  const oefening = b.oefening
  const setNummer = b.setNummer
  if (typeof trainingId !== 'string' || trainingId.length === 0) {
    return NextResponse.json({ fout: 'Sessie ontbreekt.' }, { status: 400 })
  }
  if (typeof oefening !== 'string' || typeof setNummer !== 'number') {
    return NextResponse.json({ fout: 'Ongeldige set.' }, { status: 400 })
  }

  const herhalingen = getalOfNull(b.herhalingen)
  const gewichtKg = getalOfNull(b.gewichtKg)
  const rir = getalOfNull(b.rir)
  if (herhalingen === undefined || gewichtKg === undefined || rir === undefined) {
    return NextResponse.json({ fout: 'Ongeldige set.' }, { status: 400 })
  }

  const eigenaar = await hoortTrainingBijGebruiker(toegang.admin, toegang.userId, trainingId)
  if (!eigenaar.ok) {
    return NextResponse.json({ fout: 'Sessie niet gevonden.' }, { status: statusVoor(eigenaar.reden) })
  }

  const set: SetRij = {
    oefening,
    setNummer,
    herhalingen,
    gewichtKg,
    rir,
    notitie: typeof b.notitie === 'string' && b.notitie.trim().length > 0 ? b.notitie : null,
  }
  const uit = await logSet(toegang.admin, trainingId, set)
  if (!uit.ok) return NextResponse.json({ fout: 'Kon de set niet opslaan.' }, { status: statusVoor(uit.reden) })

  return NextResponse.json({ ok: true })
}
