// POST /api/lifeos/beleggen/import — een DEGIRO-portefeuille-export (CSV) inlezen.
// Posities worden toegevoegd of hun aantal bijgewerkt (een eerder ingevulde GAK
// blijft staan); de cash-regel wordt je cash. Regels waarvan we de notering niet
// zeker vinden, komen terug als `nietGekoppeld` — die voeg je zelf toe via zoeken.
// Auth: de founder-gate uit `@/lib/lifeos/admin`.

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { leesDegiroCsv } from '@/lib/lifeos/beleggen/csv'
import { koppelNotering } from '@/lib/lifeos/beleggen/koppel'
import { bewaarPositie, zetCash } from '@/lib/lifeos/beleggen/opslag'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_TEKENS = 200_000

export async function POST(req: NextRequest) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang
  const body = (await req.json().catch(() => null)) as { csv?: unknown } | null
  if (typeof body?.csv !== 'string' || body.csv.length > MAX_TEKENS) return NextResponse.json({ fout: 'Geen geldig CSV-bestand.' }, { status: 400 })
  const export_ = leesDegiroCsv(body.csv)
  if (!export_) return NextResponse.json({ fout: 'Dit lijkt geen DEGIRO-portefeuille-export (Portefeuille → Exporteren → CSV).' }, { status: 400 })

  const geimporteerd: string[] = []
  const nietGekoppeld: { naam: string; isin: string }[] = []
  for (const p of export_.posities) {
    const notering = await koppelNotering(p)
    if (!notering) {
      nietGekoppeld.push({ naam: p.naam, isin: p.isin })
      continue
    }
    const bewaard = await bewaarPositie(toegang.admin, toegang.userId, {
      symbool: notering.symbool, isin: p.isin, naam: notering.naam ?? p.naam, valuta: notering.valuta, aantal: p.aantal, aankoopprijs: null,
    }, true)
    if (bewaard.ok) geimporteerd.push(bewaard.waarde.naam)
    else nietGekoppeld.push({ naam: p.naam, isin: p.isin })
  }
  await zetCash(toegang.admin, toegang.userId, export_.cashEur)
  return NextResponse.json({ geimporteerd, nietGekoppeld, cashEur: export_.cashEur }, { headers: { 'Cache-Control': 'private, no-store' } })
}
