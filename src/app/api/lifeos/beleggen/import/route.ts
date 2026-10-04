// POST /api/lifeos/beleggen/import — een DEGIRO-portefeuille-export (CSV) inlezen.
// Posities worden toegevoegd of hun aantal bijgewerkt (een eerder ingevulde GAK
// blijft staan; de inleg schaalt mee bij verkoop en vervalt bij bijkoop, zie
// `inlegNaWijziging`). De cash-regel wordt je cash — alleen als de export er een
// had. Regels waarvan we de notering niet zeker vinden, komen terug als
// `nietGekoppeld`; posities die je hebt maar die niet meer in de export staan
// (verkocht?) als `nietInExport`. Die verwijderen we niet zelf: dat beslis jij.
// Auth: de founder-gate uit `@/lib/lifeos/admin`.

import { NextResponse, type NextRequest } from 'next/server'
import { vereisLifeosToegang } from '@/lib/lifeos/admin'
import { leesDegiroCsv, type CsvPositie } from '@/lib/lifeos/beleggen/csv'
import { koppelNotering } from '@/lib/lifeos/beleggen/koppel'
import { bewaarPositie, haalPosities, zetCash } from '@/lib/lifeos/beleggen/opslag'
import type { Koers } from '@/lib/lifeos/beleggen/yahoo'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
// Elke regel kost een paar Yahoo-zoekopdrachten; een grote portefeuille heeft tijd nodig.
export const maxDuration = 60

const MAX_TEKENS = 200_000
/** Zoveel regels tegelijk koppelen: snel genoeg, zonder Yahoo te bestoken. */
const GELIJKTIJDIG = 4

/** Koppel alle regels, hooguit GELIJKTIJDIG tegelijk; volgorde blijft die van de export. */
async function koppelAlle(posities: readonly CsvPositie[]): Promise<(Koers | null)[]> {
  const uit: (Koers | null)[] = new Array(posities.length).fill(null)
  let volgende = 0
  const werker = async (): Promise<void> => {
    while (volgende < posities.length) {
      const i = volgende++
      uit[i] = await koppelNotering(posities[i]).catch((fout) => {
        console.error('[beleggen/import] koppelen mislukt', posities[i].isin, fout)
        return null
      })
    }
  }
  await Promise.all(Array.from({ length: Math.min(GELIJKTIJDIG, posities.length) }, werker))
  return uit
}

export async function POST(req: NextRequest) {
  const toegang = await vereisLifeosToegang(req)
  if (toegang instanceof NextResponse) return toegang
  const body = (await req.json().catch(() => null)) as { csv?: unknown } | null
  if (typeof body?.csv !== 'string' || body.csv.length > MAX_TEKENS) return NextResponse.json({ fout: 'Geen geldig CSV-bestand.' }, { status: 400 })
  const export_ = leesDegiroCsv(body.csv)
  if (!export_) return NextResponse.json({ fout: 'Dit lijkt geen DEGIRO-portefeuille-export (Portefeuille → Exporteren → CSV).' }, { status: 400 })

  const bestaand = await haalPosities(toegang.admin, toegang.userId)
  if (!bestaand.ok) return NextResponse.json({ fout: 'Kon je huidige posities niet lezen.' }, { status: 502 })

  const noteringen = await koppelAlle(export_.posities)
  const geimporteerd: string[] = []
  const nietGekoppeld: { naam: string; isin: string }[] = []
  const bijgewerkteSymbolen = new Set<string>()
  for (const [i, p] of export_.posities.entries()) {
    const notering = noteringen[i]
    if (!notering) {
      nietGekoppeld.push({ naam: p.naam, isin: p.isin })
      continue
    }
    const bewaard = await bewaarPositie(toegang.admin, toegang.userId, {
      symbool: notering.symbool, isin: p.isin, naam: notering.naam ?? p.naam, valuta: notering.valuta, aantal: p.aantal, aankoopprijs: null,
    }, true)
    if (bewaard.ok) {
      geimporteerd.push(bewaard.waarde.naam)
      bijgewerkteSymbolen.add(bewaard.waarde.symbool)
    } else nietGekoppeld.push({ naam: p.naam, isin: p.isin })
  }

  // Wat je in LifeOS hebt maar niet (meer) in de export staat: waarschijnlijk verkocht.
  const exportIsins = new Set(export_.posities.map((p) => p.isin))
  const nietInExport = bestaand.waarde
    .filter((p) => !bijgewerkteSymbolen.has(p.symbool) && !(p.isin && exportIsins.has(p.isin)))
    .map((p) => p.naam)

  let cashBijgewerkt = false
  if (export_.cashEur !== null) {
    cashBijgewerkt = await zetCash(toegang.admin, toegang.userId, export_.cashEur)
    if (!cashBijgewerkt) console.error('[beleggen/import] cash bijwerken mislukt')
  }

  return NextResponse.json(
    { geimporteerd, nietGekoppeld, nietInExport, cashEur: export_.cashEur, cashBijgewerkt },
    { headers: { 'Cache-Control': 'private, no-store' } },
  )
}
