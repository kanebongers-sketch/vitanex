// GET  /api/lifeos/voeding/water?datum=YYYY-MM-DD  — je slokken van die dag + je doel
// POST /api/lifeos/voeding/water                   — een slok erbij
//
// Vervangt de water-tracker. Het hele punt is twee tikken: de UI stuurt hier
// een vast aantal ml (glas of fles), geen formulier.
//
// Bewust geen dagtotaal in het antwoord: dat is een afgeleide, en die berekent
// `totalen.ts` uit de logs. Een totaal dat de server meestuurt kan afwijken van
// de logs ernaast, en dan is de vraag wie er gelijk heeft.
//
// Auth: de founder-gate uit `@/lib/lifeos/admin`. Die levert de service-role
// client op het LifeOS-project (`toegang.admin`) en het vaste eigenaar-id
// (`toegang.userId`) waarop alle queries filteren.

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { leesNieuweWaterLog } from '@/lib/lifeos/voeding/voeding'
import { haalDoelen, haalWaterLogs, maakWaterLog, type Reden } from '@/lib/lifeos/voeding/opslag'
import { leesDatumSleutel } from '@/lib/lifeos/datum/datum'

// Geen max-age: je water verandert terwijl je kijkt — je bent degene die het
// verandert. `Vary: Authorization` staat er voor de zekerheid alsnog: mocht er
// ooit iets tussen zitten dat wél cachet, dan mag het antwoord van de ene
// sessie nooit bij een andere terechtkomen (README §Lessen).
const CACHE_HEADERS = {
  'Cache-Control': 'private, no-store',
  Vary: 'Authorization',
} as const

/** Eén vertaling van opslag-uitkomst naar HTTP, zodat GET en POST niet uit elkaar lopen. */
function foutAntwoord(reden: Reden) {
  if (reden === 'ongeldig') {
    return NextResponse.json({ fout: 'Die waarde kan niet.' }, { status: 400 })
  }
  if (reden === 'niet_gevonden') {
    return NextResponse.json({ fout: 'Die log bestaat niet.' }, { status: 404 })
  }
  return NextResponse.json({ fout: 'Kon je water niet lezen.' }, { status: 502 })
}

export async function GET(req: NextRequest) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang

  const datum = req.nextUrl.searchParams.get('datum')
  // Geen fallback op de servertijd: de server staat in UTC en jij niet. Om
  // 01:00 Nederlandse zomertijd zou dat de dag van gisteren opleveren. De
  // client kent zijn eigen dag en stuurt 'm mee.
  if (datum === null || leesDatumSleutel(datum) === null) {
    return NextResponse.json({ fout: 'Geef een datum mee (YYYY-MM-DD).' }, { status: 400 })
  }

  // Parallel: twee onafhankelijke queries hoeven niet op elkaar te wachten.
  const [logs, doelen] = await Promise.all([
    haalWaterLogs(toegang.admin, toegang.userId, datum),
    haalDoelen(toegang.admin, toegang.userId),
  ])

  if (!logs.ok) return foutAntwoord(logs.reden)
  if (!doelen.ok) return foutAntwoord(doelen.reden)

  return NextResponse.json(
    { logs: logs.waarde, doelMl: doelen.waarde.waterDoelMl },
    { headers: CACHE_HEADERS },
  )
}

export async function POST(req: NextRequest) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang

  const body: unknown = await req.json().catch(() => null)
  const nieuw = leesNieuweWaterLog(body)
  if (!nieuw.ok) {
    return NextResponse.json({ fout: nieuw.fout }, { status: 400 })
  }

  const uitkomst = await maakWaterLog(toegang.admin, toegang.userId, nieuw.waarde)
  if (!uitkomst.ok) return foutAntwoord(uitkomst.reden)

  return NextResponse.json({ log: uitkomst.waarde }, { status: 201 })
}
