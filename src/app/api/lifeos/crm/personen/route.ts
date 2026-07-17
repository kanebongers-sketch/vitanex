// GET  /api/lifeos/crm/personen            — álle personen (elke groep), vlakke lijst
//      /api/lifeos/crm/personen?groep=…    — alleen die groep
//        → { personen: Persoon[] }  (camelCase, zoals de Persoon-interface in crm.ts)
// POST /api/lifeos/crm/personen            — nieuwe persoon → { persoon: Persoon } 201
//
// Kane's mensen-bord: PT-klanten en teams als kanban. De UI groepeert de vlakke
// lijst client-side per statuskolom (die kent de kolomvolgorde uit crm.ts), dus
// de server geeft één ongegroepeerde lijst terug — dezelfde vorm met of zonder
// ?groep. Aanmaken schrijft meteen een begin-regel in de historie (zie opslag.ts).
//
// Auth: de founder-gate uit `@/lib/lifeos/admin` (`toegang.admin`/`toegang.userId`).

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { isGroep, leesNieuwePersoon } from '@/lib/lifeos/crm/crm'
import { haalPersonen, maakPersoon } from '@/lib/lifeos/crm/opslag'
import type { Reden } from '@/lib/lifeos/crm/fout'

export const runtime = 'nodejs'

// Geen max-age: je bord verandert terwijl je kijkt. Een tegel die na een reload
// nog op de oude plek staat, is erger dan een extra round-trip. `Vary` staat er
// alsnog — mocht er ooit iets tussen zitten dat wél cachet, dan mag het antwoord
// van de ene sessie nooit bij een andere terechtkomen.
const CACHE_HEADERS = {
  'Cache-Control': 'private, no-store',
  Vary: 'Authorization',
} as const

/** Eén vertaling van opslag-uitkomst naar HTTP, zodat GET en POST niet uit elkaar lopen. */
function foutAntwoord(reden: Reden) {
  if (reden === 'bezet') {
    return NextResponse.json({ fout: 'Dit botst met een bestaande invoer.' }, { status: 409 })
  }
  if (reden === 'ongeldig') {
    return NextResponse.json({ fout: 'Die combinatie kan niet.' }, { status: 400 })
  }
  if (reden === 'niet_gevonden') {
    return NextResponse.json({ fout: 'Persoon bestaat niet.' }, { status: 404 })
  }
  return NextResponse.json({ fout: 'Kon je mensen niet lezen.' }, { status: 502 })
}

export async function GET(req: NextRequest) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang

  const groep = req.nextUrl.searchParams.get('groep')
  if (groep !== null && !isGroep(groep)) {
    return NextResponse.json({ fout: 'Onbekende groep.' }, { status: 400 })
  }

  const uitkomst = await haalPersonen(toegang.admin, toegang.userId, groep ?? undefined)
  if (!uitkomst.ok) return foutAntwoord(uitkomst.reden)

  return NextResponse.json({ personen: uitkomst.waarde }, { headers: CACHE_HEADERS })
}

export async function POST(req: NextRequest) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang

  const body: unknown = await req.json().catch(() => null)
  const nieuw = leesNieuwePersoon(body)
  if (!nieuw.ok) {
    return NextResponse.json({ fout: nieuw.fout }, { status: 400 })
  }

  const uitkomst = await maakPersoon(toegang.admin, toegang.userId, nieuw.waarde)
  if (!uitkomst.ok) return foutAntwoord(uitkomst.reden)

  return NextResponse.json({ persoon: uitkomst.waarde }, { status: 201 })
}
