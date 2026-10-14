// ─── Fit Factory Club, training: welke spieren raakt een schema? (PUUR) ─────
// Per dag het aantal sets per spiergroep, en over het hele schema welke
// kernspieren nergens als hoofdspier terugkomen. Zo ziet de trainer gaten.
// Telregel: de sets van een oefening tellen een keer mee voor elke groep (en
// elke spier) waar hij vooral op werkt. Meewerkende spieren tellen niet mee.
// Een regel zonder ingevuld aantal sets telt als een set.

import { hoofdspieren, KERNSPIEREN, SPIER_GROEPEN, SPIER_INFO, type Spier, type SpierGroep } from './spieren'
import type { Spiergroep } from './typen'

export interface OverzichtRegel {
  dag: number
  oefeningId: string
  sets: string | number | null
}

export interface OverzichtOefening {
  spierenPrimair: readonly Spier[]
  spiergroep: Spiergroep
}

export interface DagOverzicht {
  dag: number
  setsPerGroep: Record<SpierGroep, number>
  totaalSets: number
}

export interface SchemaOverzicht {
  dagen: DagOverzicht[]
  setsPerSpier: Partial<Record<Spier, number>>
  /** Kernspieren die in het hele schema nergens als hoofdspier voorkomen. */
  ontbreekt: Spier[]
}

function aantalSets(v: string | number | null): number {
  const n = typeof v === 'number' ? v : Number(String(v ?? '').trim())
  return Number.isFinite(n) && n >= 1 ? Math.min(Math.round(n), 20) : 1
}

function legeGroepen(): Record<SpierGroep, number> {
  return Object.fromEntries(SPIER_GROEPEN.map((g) => [g, 0])) as Record<SpierGroep, number>
}

export function schemaOverzicht(
  regels: readonly OverzichtRegel[],
  oefeningen: ReadonlyMap<string, OverzichtOefening>,
  aantalDagen: number,
): SchemaOverzicht {
  const perSpier = new Map<Spier, number>()
  const dagen = Array.from({ length: Math.max(aantalDagen, 0) }, (_, i): DagOverzicht => {
    const dag = i + 1
    const groepen = legeGroepen()
    let totaal = 0
    for (const r of regels) {
      const o = r.dag === dag ? oefeningen.get(r.oefeningId) : undefined
      if (!o) continue
      const sets = aantalSets(r.sets)
      const spieren = hoofdspieren(o)
      totaal += sets
      for (const g of new Set(spieren.map((s) => SPIER_INFO[s].groep))) groepen[g] += sets
      for (const s of spieren) perSpier.set(s, (perSpier.get(s) ?? 0) + sets)
    }
    return { dag, setsPerGroep: groepen, totaalSets: totaal }
  })
  return {
    dagen,
    setsPerSpier: Object.fromEntries(perSpier),
    ontbreekt: KERNSPIEREN.filter((s) => !perSpier.has(s)),
  }
}
