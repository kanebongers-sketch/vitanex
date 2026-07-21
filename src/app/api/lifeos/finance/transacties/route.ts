// GET  /api/lifeos/finance/transacties?maand=YYYY-MM — de transacties (nieuwste eerst).
//        geen maand → álle transacties.  → { transacties: Transactie[] }
// POST /api/lifeos/finance/transacties — nieuwe omzet/kosten-regel → { transactie } 201
//
// EERLIJK: alleen wat Kane invoert. Geen invoer → een lege lijst, geen fantasie.
// Auth: de founder-gate uit `@/lib/lifeos/admin` (`toegang.admin`/`toegang.userId`).

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { isMaand, leesNieuweTransactie } from '@/lib/lifeos/finance/finance'
import { haalTransacties, maakTransactie, type Reden } from '@/lib/lifeos/finance/opslag'

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
    return NextResponse.json({ fout: 'Transactie bestaat niet.' }, { status: 404 })
  }
  return NextResponse.json({ fout: 'Kon je transacties niet lezen.' }, { status: 502 })
}

export async function GET(req: NextRequest) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang

  const maand = req.nextUrl.searchParams.get('maand')
  if (maand !== null && !isMaand(maand)) {
    return NextResponse.json({ fout: 'Ongeldige maand; gebruik YYYY-MM.' }, { status: 400 })
  }

  const uitkomst = await haalTransacties(toegang.admin, toegang.userId, {
    ...(maand !== null ? { maand } : {}),
  })
  if (!uitkomst.ok) return foutAntwoord(uitkomst.reden)

  return NextResponse.json({ transacties: uitkomst.waarde }, { headers: CACHE_HEADERS })
}

export async function POST(req: NextRequest) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang

  const body: unknown = await req.json().catch(() => null)
  const nieuw = leesNieuweTransactie(body)
  if (!nieuw.ok) {
    return NextResponse.json({ fout: nieuw.fout }, { status: 400 })
  }

  const uitkomst = await maakTransactie(toegang.admin, toegang.userId, nieuw.waarde)
  if (!uitkomst.ok) return foutAntwoord(uitkomst.reden)

  return NextResponse.json({ transactie: uitkomst.waarde }, { status: 201 })
}
