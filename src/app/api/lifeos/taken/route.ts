// GET  /api/lifeos/taken   — je taken. Modi via query:
//                              ?alle=1   → álle taken (voor de TakenLijst)
//                              ?top3=1   → alleen de taken mét een top-3-plek
//                              ?datum=…  → één dag ('ooit' = zonder dag)
//                            geen params → alle taken, ongefilterd
// POST /api/lifeos/taken   — nieuwe taak
//
// Vervangt Todoist. Niet door Todoist na te bouwen, maar door de enige vraag te
// beantwoorden die 's ochtends telt: welke drie dingen doe ik vandaag?
//
// Auth: de founder-gate uit `@/lib/lifeos/admin` (`toegang.admin`/`toegang.userId`).

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { leesNieuweTaak } from '@/lib/lifeos/taken/taken'
import { haalTaken, maakTaak, type Reden } from '@/lib/lifeos/taken/opslag'
import { leesDatumSleutel } from '@/lib/lifeos/datum/datum'

// Geen max-age hier, anders dan bij de agenda: je taken veranderen terwijl je
// kijkt. Een top-3 die na een reload nog de oude stand toont, is erger dan een
// extra round-trip. `Vary` staat er voor de zekerheid alsnog: mocht er ooit iets
// tussen zitten dat wél cachet, dan mag het antwoord van de ene sessie nooit bij
// een andere terechtkomen.
const CACHE_HEADERS = {
  'Cache-Control': 'private, no-store',
  Vary: 'Authorization',
} as const

/** Eén vertaling van opslag-uitkomst naar HTTP, zodat GET en POST niet uit elkaar lopen. */
function foutAntwoord(reden: Reden) {
  if (reden === 'bezet') {
    return NextResponse.json(
      { fout: 'Die plek in je top-3 is al bezet. Haal eerst de andere taak weg.' },
      { status: 409 },
    )
  }
  if (reden === 'ongeldig') {
    return NextResponse.json({ fout: 'Die combinatie kan niet.' }, { status: 400 })
  }
  if (reden === 'niet_gevonden') {
    return NextResponse.json({ fout: 'Taak bestaat niet.' }, { status: 404 })
  }
  return NextResponse.json({ fout: 'Kon je taken niet lezen.' }, { status: 502 })
}

export async function GET(req: NextRequest) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang

  const params = req.nextUrl.searchParams

  // De volledige lijst: álle taken, ongefilterd — vandaag, te laat, later,
  // "ooit" én de positie-loze bot-taken die via Telegram binnenkomen. De
  // TakenLijst-UI groepeert client-side en leidt de top-3 daaruit af; hij haalt
  // die dus NIET apart op. Dat is met opzet: twee vluchten voor dezelfde taken
  // lopen uit elkaar zodra je er in de één één afvinkt.
  //
  // `?top3=1` blijft bestaan als filter voor wie alleen de gekozen drie wil
  // (Vita, een bot, een toekomstig scherm) — niet voor deze lijst.
  if (params.get('alle') === '1') {
    const alle = await haalTaken(toegang.admin, toegang.userId, {})
    if (!alle.ok) return foutAntwoord(alle.reden)
    return NextResponse.json({ taken: alle.waarde }, { headers: CACHE_HEADERS })
  }

  const datum = params.get('datum')
  if (datum !== null && datum !== 'ooit' && leesDatumSleutel(datum) === null) {
    return NextResponse.json({ fout: 'Ongeldige datum; gebruik YYYY-MM-DD of "ooit".' }, { status: 400 })
  }

  const uitkomst = await haalTaken(toegang.admin, toegang.userId, {
    ...(datum !== null ? { datum } : {}),
    alleenTop3: params.get('top3') === '1',
  })

  if (!uitkomst.ok) return foutAntwoord(uitkomst.reden)

  return NextResponse.json({ taken: uitkomst.waarde }, { headers: CACHE_HEADERS })
}

export async function POST(req: NextRequest) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang

  const body: unknown = await req.json().catch(() => null)
  const nieuw = leesNieuweTaak(body)
  if (!nieuw.ok) {
    return NextResponse.json({ fout: nieuw.fout }, { status: 400 })
  }

  const uitkomst = await maakTaak(toegang.admin, toegang.userId, nieuw.waarde)
  if (!uitkomst.ok) return foutAntwoord(uitkomst.reden)

  return NextResponse.json({ taak: uitkomst.waarde }, { status: 201 })
}
