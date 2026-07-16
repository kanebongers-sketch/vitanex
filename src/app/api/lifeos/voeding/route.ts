// GET  /api/lifeos/voeding?datum=YYYY-MM-DD  — wat je die dag at + je doelen
// POST /api/lifeos/voeding                   — een log erbij
//
// Vervangt MyFitnessPal. Niet door MyFitnessPal na te bouwen: er is hier geen
// voedingsdatabase en geen barcode-scanner, en die komen er ook niet. Dat is
// maanden werk en levert een slechtere MyFitnessPal.
//
// Het antwoord bevat de LOGS, geen dagtotalen. Optellen doet `totalen.ts` —
// puur en getest, en de enige plek die weet dat een ontbrekende macro geen 0
// is. Zou de server een `sum()` meesturen, dan verdween die kennis onderweg.
//
// Auth: de founder-gate uit `@/lib/lifeos/admin`. Die levert de service-role
// client op het LifeOS-project (`toegang.admin`) en het vaste eigenaar-id
// (`toegang.userId`) waarop alle queries filteren.

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { leesNieuweVoedingLog } from '@/lib/lifeos/voeding/voeding'
import { haalDoelen, haalVoedingLogs, maakVoedingLog, type Reden } from '@/lib/lifeos/voeding/opslag'
import { leesDatumSleutel } from '@/lib/lifeos/datum/datum'

const CACHE_HEADERS = {
  'Cache-Control': 'private, no-store',
  Vary: 'Authorization',
} as const

function foutAntwoord(reden: Reden) {
  if (reden === 'ongeldig') {
    return NextResponse.json({ fout: 'Die waarde kan niet.' }, { status: 400 })
  }
  if (reden === 'niet_gevonden') {
    return NextResponse.json({ fout: 'Die log bestaat niet.' }, { status: 404 })
  }
  return NextResponse.json({ fout: 'Kon je voeding niet lezen.' }, { status: 502 })
}

export async function GET(req: NextRequest) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang

  const datum = req.nextUrl.searchParams.get('datum')
  // Geen fallback op de servertijd — zie de water-route: de server staat in UTC
  // en jij niet.
  if (datum === null || leesDatumSleutel(datum) === null) {
    return NextResponse.json({ fout: 'Geef een datum mee (YYYY-MM-DD).' }, { status: 400 })
  }

  const [logs, doelen] = await Promise.all([
    haalVoedingLogs(toegang.admin, toegang.userId, datum),
    haalDoelen(toegang.admin, toegang.userId),
  ])

  if (!logs.ok) return foutAntwoord(logs.reden)
  if (!doelen.ok) return foutAntwoord(doelen.reden)

  return NextResponse.json({ logs: logs.waarde, doelen: doelen.waarde }, { headers: CACHE_HEADERS })
}

export async function POST(req: NextRequest) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang

  const body: unknown = await req.json().catch(() => null)
  const nieuw = leesNieuweVoedingLog(body)
  if (!nieuw.ok) {
    return NextResponse.json({ fout: nieuw.fout }, { status: 400 })
  }

  const uitkomst = await maakVoedingLog(toegang.admin, toegang.userId, nieuw.waarde)
  if (!uitkomst.ok) return foutAntwoord(uitkomst.reden)

  return NextResponse.json({ log: uitkomst.waarde }, { status: 201 })
}
