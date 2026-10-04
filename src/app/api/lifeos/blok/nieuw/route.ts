// POST /api/lifeos/blok/nieuw — begin een nieuw 4-weken blok vanaf `datum`.
// Na week 4 gaf /blok/vandaag alleen nog "blok afgerond", zonder weg terug: de
// startdatum werd nergens opnieuw gezet. Dit zet hem op de dag die de client
// meestuurt (je eigen kalenderdag), en het schema begint weer bij week 1.
// Je sets en sessies blijven gewoon staan: alleen de startdatum verschuift.

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { zetBlokStart } from '@/lib/lifeos/blok/instellingen'
import { leesDatumSleutel } from '@/lib/lifeos/datum/datum'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest): Promise<NextResponse> {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang

  const body: unknown = await req.json().catch(() => null)
  const datum = typeof body === 'object' && body !== null ? (body as { datum?: unknown }).datum : undefined
  // Vorm én kalender: 2026-02-31 is geen dag, en moet een 400 zijn, geen 502.
  if (typeof datum !== 'string' || leesDatumSleutel(datum) === null) {
    return NextResponse.json({ fout: 'Geef een geldige startdatum mee.' }, { status: 400 })
  }

  const gezet = await zetBlokStart(toegang.admin, toegang.userId, datum)
  if (!gezet.ok) {
    const status = gezet.reden === 'ongeldig' ? 400 : 502
    return NextResponse.json({ fout: 'Kon het nieuwe blok niet starten.' }, { status })
  }
  return NextResponse.json({ startDatum: gezet.waarde })
}
