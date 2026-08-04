// POST /api/lifeos/blok/start — start (of hervat) de sessie van vandaag.
// Idempotent (zie startSessie): twee kliks leveren één sessie. Geeft de
// trainingId terug waarmee de logger daarna zijn sets wegschrijft.

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { startSessie } from '@/lib/lifeos/blok/opslag'
import { isSessieCode } from '@/lib/lifeos/blok/programma'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const DATUM_PATROON = /^\d{4}-\d{2}-\d{2}$/

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
  const { sessieCode, blokWeek, datum } = body as Record<string, unknown>

  if (!isSessieCode(sessieCode) || sessieCode === 'rust') {
    return NextResponse.json({ fout: 'Onbekende sessie.' }, { status: 400 })
  }
  if (typeof datum !== 'string' || !DATUM_PATROON.test(datum)) {
    return NextResponse.json({ fout: 'Ongeldige datum.' }, { status: 400 })
  }
  if (typeof blokWeek !== 'number' || !Number.isInteger(blokWeek) || blokWeek < 1 || blokWeek > 4) {
    return NextResponse.json({ fout: 'Ongeldige week.' }, { status: 400 })
  }

  const uit = await startSessie(toegang.admin, toegang.userId, datum, sessieCode, blokWeek)
  if (!uit.ok) return NextResponse.json({ fout: 'Kon de sessie niet starten.' }, { status: statusVoor(uit.reden) })

  return NextResponse.json({ trainingId: uit.waarde.id, voltooidOp: uit.waarde.voltooidOp })
}
