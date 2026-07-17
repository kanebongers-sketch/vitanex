// GET  /api/lifeos/projecten   — je projecten. `?actief=1` = alleen de lopende.
// POST /api/lifeos/projecten   — nieuw project
//
// Een taak zonder context is een taak die je niet plaatst. Projecten zijn de
// lichtste vorm van context die werkt: een naam, een omschrijving, actief of
// niet (zie migratie 100).
//
// Auth: de founder-gate uit `@/lib/lifeos/admin` (`toegang.admin`/`toegang.userId`).

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { leesNieuwProject } from '@/lib/lifeos/projecten/projecten'
import { haalProjecten, maakProject, type Reden } from '@/lib/lifeos/projecten/opslag'

// Geen max-age: je projecten veranderen terwijl je kijkt, en een keuzelijst die
// je net aangemaakte project niet toont is kapot. `Vary` staat er voor de
// zekerheid alsnog — mocht er ooit iets tussen zitten dat wél cachet, dan mag
// het antwoord van de ene sessie nooit bij een andere terechtkomen.
const CACHE_HEADERS = {
  'Cache-Control': 'private, no-store',
  Vary: 'Authorization',
} as const

/** Eén vertaling van opslag-uitkomst naar HTTP, zodat GET en POST niet uit elkaar lopen. */
function foutAntwoord(reden: Reden) {
  if (reden === 'bestaat_al') {
    return NextResponse.json(
      { fout: 'Je hebt al een project met die naam.' },
      { status: 409 },
    )
  }
  if (reden === 'ongeldig') {
    return NextResponse.json({ fout: 'Die combinatie kan niet.' }, { status: 400 })
  }
  if (reden === 'niet_gevonden') {
    return NextResponse.json({ fout: 'Project bestaat niet.' }, { status: 404 })
  }
  return NextResponse.json({ fout: 'Kon je projecten niet lezen.' }, { status: 502 })
}

export async function GET(req: NextRequest) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang

  const uitkomst = await haalProjecten(toegang.admin, toegang.userId, {
    alleenActief: req.nextUrl.searchParams.get('actief') === '1',
  })
  if (!uitkomst.ok) return foutAntwoord(uitkomst.reden)

  return NextResponse.json({ projecten: uitkomst.waarde }, { headers: CACHE_HEADERS })
}

export async function POST(req: NextRequest) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang

  const body: unknown = await req.json().catch(() => null)
  const nieuw = leesNieuwProject(body)
  if (!nieuw.ok) {
    return NextResponse.json({ fout: nieuw.fout }, { status: 400 })
  }

  const uitkomst = await maakProject(toegang.admin, toegang.userId, nieuw.waarde)
  if (!uitkomst.ok) return foutAntwoord(uitkomst.reden)

  return NextResponse.json({ project: uitkomst.waarde }, { status: 201 })
}
