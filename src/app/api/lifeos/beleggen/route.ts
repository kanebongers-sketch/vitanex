// GET   /api/lifeos/beleggen — je portefeuille: posities, waarde, winst/verlies, verloop.
// POST  /api/lifeos/beleggen — een positie toevoegen (symbool uit de zoekfunctie).
// PATCH /api/lifeos/beleggen — je cash bij de broker bijwerken ({ cashEur }).
//
// Koersen: Yahoo Finance, ± 15 min vertraagd. LifeOS koppelt niet aan je broker
// en handelt niets: dit is een overzicht van wat jij invoert.
// Auth: de founder-gate uit `@/lib/lifeos/admin`.

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { haalOverzicht } from '@/lib/lifeos/beleggen/dienst'
import { bewaarPositie, zetCash } from '@/lib/lifeos/beleggen/opslag'
import { leesBedrag, leesNieuwePositie } from '@/lib/lifeos/beleggen/invoer'
import { haalKoers } from '@/lib/lifeos/beleggen/yahoo'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const KOPPEN = { 'Cache-Control': 'private, no-store', Vary: 'Authorization' } as const

export async function GET(req: NextRequest) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang
  const overzicht = await haalOverzicht(toegang.admin, toegang.userId)
  if (!overzicht) return NextResponse.json({ fout: 'Kon je beleggingen niet lezen.' }, { status: 502 })
  return NextResponse.json(overzicht, { headers: KOPPEN })
}

export async function POST(req: NextRequest) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang
  const invoer = leesNieuwePositie(await req.json().catch(() => null))
  if (!invoer.ok) return NextResponse.json({ fout: invoer.fout }, { status: 400 })

  // Het symbool moet echt een koers hebben; naam en valuta komen van de bron, niet van de client.
  const koers = await haalKoers(invoer.waarde.symbool)
  if (!koers) return NextResponse.json({ fout: 'Geen koers gevonden voor dit symbool. Kies er een uit de zoekresultaten.' }, { status: 400 })

  const bewaard = await bewaarPositie(toegang.admin, toegang.userId, {
    symbool: invoer.waarde.symbool, isin: null, naam: koers.naam ?? invoer.waarde.symbool, valuta: koers.valuta,
    aantal: invoer.waarde.aantal, aankoopprijs: invoer.waarde.aankoopprijs, inlegEur: invoer.waarde.inlegEur,
  })
  if (!bewaard.ok) {
    const melding = bewaard.reden === 'bestaat_al' ? 'Deze positie staat er al — pas het aantal daar aan.' : 'Opslaan mislukt.'
    return NextResponse.json({ fout: melding }, { status: bewaard.reden === 'bestaat_al' ? 409 : 502 })
  }
  return NextResponse.json(bewaard.waarde, { status: 201, headers: KOPPEN })
}

export async function PATCH(req: NextRequest) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang
  const body = (await req.json().catch(() => null)) as { cashEur?: unknown } | null
  const cash = leesBedrag(body?.cashEur, 'Cash', { nulMag: true })
  if (!cash.ok) return NextResponse.json({ fout: cash.fout }, { status: 400 })
  const gelukt = await zetCash(toegang.admin, toegang.userId, cash.waarde as number)
  return gelukt ? NextResponse.json({ cashEur: cash.waarde }, { headers: KOPPEN }) : NextResponse.json({ fout: 'Opslaan mislukt.' }, { status: 502 })
}
