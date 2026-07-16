// GET  /api/lifeos/notities?soort=brain_dump&datum=YYYY-MM-DD — je notities van een dag
// POST /api/lifeos/notities                                    — nieuwe notitie
//
// Vervangt Apple Notes / Google Keep. Niet door Notes na te bouwen — door de
// wrijving weg te halen: één tik, idee uit je hoofd. Geen categorieën, geen
// tags, geen mappen. Dat is precies de wrijving waardoor mensen het niet doen.
//
// LifeOS binnen MentaForce: de founder-gate + de vaste LIFEOS_USER_ID komen uit
// `vereisLifeosToegang`. De DB-laag krijgt de service-role-client van de gate
// als parameter — niets in dit bestand weet nog van een aparte database.

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { isSoort, leesNieuweNotitie } from '@/lib/lifeos/notities/notities'
import { haalNotities, maakNotitie, type Reden } from '@/lib/lifeos/notities/opslag'
import { leesDatumSleutel } from '@/lib/lifeos/datum/datum'

// Geen max-age: je notities veranderen terwijl je kijkt. Een brain dump die na
// een reload een idee mist, is erger dan een extra round-trip. `Vary` staat er
// voor de zekerheid alsnog — mocht er ooit iets tussen zitten dat wél cachet,
// dan mag het antwoord van de ene sessie nooit bij een andere terechtkomen.
const CACHE_HEADERS = {
  'Cache-Control': 'private, no-store',
  Vary: 'Authorization',
} as const

/** Eén vertaling van opslag-uitkomst naar HTTP, zodat GET en POST niet uit elkaar lopen. */
function foutAntwoord(reden: Reden) {
  if (reden === 'bezet') {
    // Kan alleen bij soort=journal: daar staat de partiële unieke index uit 050.
    return NextResponse.json(
      { fout: 'Voor die dag staat er al een journal. Werk die bij via /api/lifeos/journal.' },
      { status: 409 },
    )
  }
  if (reden === 'ongeldig') {
    return NextResponse.json({ fout: 'Die notitie kan niet.' }, { status: 400 })
  }
  if (reden === 'niet_gevonden') {
    return NextResponse.json({ fout: 'Notitie bestaat niet.' }, { status: 404 })
  }
  return NextResponse.json({ fout: 'Kon je notities niet lezen.' }, { status: 502 })
}

export async function GET(req: NextRequest) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang

  const params = req.nextUrl.searchParams

  const soort = params.get('soort')
  if (!isSoort(soort)) {
    return NextResponse.json({ fout: 'Geef soort=brain_dump of soort=journal mee.' }, { status: 400 })
  }

  const datum = params.get('datum')
  if (datum !== null && leesDatumSleutel(datum) === null) {
    return NextResponse.json({ fout: 'Ongeldige datum; gebruik YYYY-MM-DD.' }, { status: 400 })
  }

  const uitkomst = await haalNotities(toegang.admin, toegang.userId, {
    soort,
    ...(datum !== null ? { datum } : {}),
  })

  if (!uitkomst.ok) return foutAntwoord(uitkomst.reden)

  return NextResponse.json({ notities: uitkomst.waarde }, { headers: CACHE_HEADERS })
}

export async function POST(req: NextRequest) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang

  const body: unknown = await req.json().catch(() => null)
  const nieuw = leesNieuweNotitie(body)
  if (!nieuw.ok) {
    return NextResponse.json({ fout: nieuw.fout }, { status: 400 })
  }

  const uitkomst = await maakNotitie(toegang.admin, toegang.userId, nieuw.waarde)
  if (!uitkomst.ok) return foutAntwoord(uitkomst.reden)

  return NextResponse.json({ notitie: uitkomst.waarde }, { status: 201 })
}
