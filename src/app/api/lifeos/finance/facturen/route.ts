// GET  /api/lifeos/finance/facturen — je facturen (nieuwste factuurdatum eerst).
//        → { facturen: Factuur[] }
// POST /api/lifeos/finance/facturen — nieuwe factuur (begint 'open') → { factuur } 201
//
// EERLIJK: alleen wat Kane invoert. Geen invoer → een lege lijst, geen fantasie.
// Auth: de founder-gate uit `@/lib/lifeos/admin` (`toegang.admin`/`toegang.userId`).

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { leesNieuweFactuur } from '@/lib/lifeos/finance/finance'
import { haalFacturen, maakFactuur, type Reden } from '@/lib/lifeos/finance/opslag'

export const runtime = 'nodejs'

const CACHE_HEADERS = {
  'Cache-Control': 'private, no-store',
  Vary: 'Authorization',
} as const

function foutAntwoord(reden: Reden) {
  if (reden === 'bezet') {
    return NextResponse.json({ fout: 'Dit botst met een bestaande invoer.' }, { status: 409 })
  }
  if (reden === 'ongeldig') {
    return NextResponse.json({ fout: 'Die combinatie kan niet.' }, { status: 400 })
  }
  if (reden === 'niet_gevonden') {
    return NextResponse.json({ fout: 'Factuur bestaat niet.' }, { status: 404 })
  }
  return NextResponse.json({ fout: 'Kon je facturen niet lezen.' }, { status: 502 })
}

export async function GET(req: NextRequest) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang

  const uitkomst = await haalFacturen(toegang.admin, toegang.userId)
  if (!uitkomst.ok) return foutAntwoord(uitkomst.reden)

  return NextResponse.json({ facturen: uitkomst.waarde }, { headers: CACHE_HEADERS })
}

export async function POST(req: NextRequest) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang

  const body: unknown = await req.json().catch(() => null)
  const nieuw = leesNieuweFactuur(body)
  if (!nieuw.ok) {
    return NextResponse.json({ fout: nieuw.fout }, { status: 400 })
  }

  const uitkomst = await maakFactuur(toegang.admin, toegang.userId, nieuw.waarde)
  if (!uitkomst.ok) return foutAntwoord(uitkomst.reden)

  return NextResponse.json({ factuur: uitkomst.waarde }, { status: 201 })
}
