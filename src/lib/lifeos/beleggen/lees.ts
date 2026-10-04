// ─── LifeOS — het beleggingen-antwoord lezen (PUUR, ook client) ─────────────
// Systeemgrens van de kaart: narrowen, nooit casten. Een veld dat niet klopt
// wordt null; een antwoord zonder de kern (regels + totaal) is onbruikbaar → null.

import { getalOfNull, isObject, tekstOfNull } from '@/lib/lifeos/api/http'
import type { PositieRegel, Totaal } from './portefeuille'
import type { HistoriePunt } from './opslag'

export interface OverzichtJson {
  regels: PositieRegel[]
  totaal: Totaal
  cashEur: number
  historie: HistoriePunt[]
  koersenVan: string | null
}

function leesRegel(r: unknown): PositieRegel | null {
  if (!isObject(r)) return null
  const id = tekstOfNull(r.id)
  const symbool = tekstOfNull(r.symbool)
  const naam = tekstOfNull(r.naam)
  const aantal = getalOfNull(r.aantal)
  if (!id || !symbool || !naam || aantal === null) return null
  const valuta = tekstOfNull(r.valuta) ?? 'EUR'
  return {
    id, symbool, naam, aantal, valuta,
    isin: tekstOfNull(r.isin),
    aankoopprijs: getalOfNull(r.aankoopprijs),
    inlegEur: getalOfNull(r.inlegEur),
    koers: getalOfNull(r.koers),
    koersValuta: tekstOfNull(r.koersValuta) ?? valuta,
    dagPct: getalOfNull(r.dagPct),
    waardeEur: getalOfNull(r.waardeEur),
    dagEur: getalOfNull(r.dagEur),
    winstEur: getalOfNull(r.winstEur),
    winstPct: getalOfNull(r.winstPct),
  }
}

function leesTotaal(t: unknown): Totaal | null {
  if (!isObject(t)) return null
  const waardeEur = getalOfNull(t.waardeEur)
  if (waardeEur === null) return null
  return {
    waardeEur,
    dagEur: getalOfNull(t.dagEur) ?? 0,
    dagPct: getalOfNull(t.dagPct),
    inlegEur: getalOfNull(t.inlegEur),
    winstEur: getalOfNull(t.winstEur),
    winstPct: getalOfNull(t.winstPct),
    compleet: t.compleet === true,
    zonderKoers: getalOfNull(t.zonderKoers) ?? 0,
    zonderAankoop: getalOfNull(t.zonderAankoop) ?? 0,
  }
}

export function leesOverzicht(ruw: unknown): OverzichtJson | null {
  if (!isObject(ruw) || !Array.isArray(ruw.regels)) return null
  const totaal = leesTotaal(ruw.totaal)
  if (!totaal) return null
  const historie = Array.isArray(ruw.historie)
    ? ruw.historie.flatMap((h): HistoriePunt[] => {
        if (!isObject(h)) return []
        const dag = tekstOfNull(h.dag)
        const waardeEur = getalOfNull(h.waardeEur)
        return dag && waardeEur !== null ? [{ dag, waardeEur, inlegEur: getalOfNull(h.inlegEur) }] : []
      })
    : []
  return {
    regels: ruw.regels.map(leesRegel).filter((r): r is PositieRegel => r !== null),
    totaal,
    cashEur: getalOfNull(ruw.cashEur) ?? 0,
    historie,
    koersenVan: tekstOfNull(ruw.koersenVan),
  }
}

export interface ZoekJson {
  symbool: string
  naam: string
  beurs: string
  soort: string
}

export function leesZoekResultaten(ruw: unknown): ZoekJson[] | null {
  if (!isObject(ruw) || !Array.isArray(ruw.resultaten)) return null
  return ruw.resultaten.flatMap((r): ZoekJson[] => {
    if (!isObject(r)) return []
    const symbool = tekstOfNull(r.symbool)
    return symbool ? [{ symbool, naam: tekstOfNull(r.naam) ?? symbool, beurs: tekstOfNull(r.beurs) ?? '', soort: tekstOfNull(r.soort) ?? '' }] : []
  })
}
