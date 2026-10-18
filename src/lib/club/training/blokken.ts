// ─── Fit Factory Club, training: supersets en circuits (PUUR) ───────────────
// Oefeningen die direct na elkaar staan op dezelfde dag en hetzelfde
// groepnummer hebben, vormen een blok: twee is een superset, drie of meer een
// circuit. Een groep van een oefening bestaat niet: die wordt weer los.
// Groepnummers zijn uniek in het hele schema (1, 2, 3...).

export interface MetGroep {
  dag: number
  groep: number | null
}

export type BlokSoort = 'los' | 'superset' | 'circuit'

export const BLOK_LABEL: Record<BlokSoort, string> = { los: 'Los', superset: 'Superset', circuit: 'Circuit' }

export interface Blok<T> {
  soort: BlokSoort
  items: T[]
}

export function blokSoort(aantal: number): BlokSoort {
  if (aantal >= 3) return 'circuit'
  return aantal === 2 ? 'superset' : 'los'
}

/** Blokken van een reeks (een dag) in de gegeven volgorde. */
export function blokken<T extends MetGroep>(regels: readonly T[]): Blok<T>[] {
  const uit: Blok<T>[] = []
  let huidig: T[] = []
  const sluit = () => {
    if (huidig.length > 0) uit.push({ soort: blokSoort(huidig.length), items: huidig })
    huidig = []
  }
  for (const r of regels) {
    const vorige = huidig[huidig.length - 1]
    if (vorige && typeof r.groep === 'number' && r.groep === vorige.groep && r.dag === vorige.dag) {
      huidig.push(r)
    } else {
      sluit()
      huidig = [r]
    }
  }
  sluit()
  return uit
}

/** De dagen in volgorde, met per dag de regels zoals ze in de lijst staan. */
function perDag<T extends MetGroep>(regels: readonly T[]): Map<number, T[]> {
  const m = new Map<number, T[]>()
  for (const r of regels) m.set(r.dag, [...(m.get(r.dag) ?? []), r])
  return new Map([...m.entries()].sort((a, b) => a[0] - b[0]))
}

/**
 * Groepen opnieuw nummeren: aaneengesloten blokken van twee of meer krijgen
 * 1, 2, 3... (per schema uniek), een losse oefening krijgt null. De volgorde
 * van de lijst verandert niet.
 */
export function normaliseerGroepen<T extends MetGroep>(regels: readonly T[]): T[] {
  const nieuw = new Map<T, number | null>()
  let teller = 0
  for (const dagRegels of perDag(regels).values()) {
    for (const blok of blokken(dagRegels)) {
      const nummer = blok.items.length >= 2 ? ++teller : null
      for (const r of blok.items) nieuw.set(r, nummer)
    }
  }
  return regels.map((r) => {
    const groep = nieuw.get(r) ?? null
    return groep === r.groep ? r : { ...r, groep }
  })
}

/** Labels zoals op de vloer: "1", "2", "3a", "3b", per dag geteld. */
export function regelLabels<T extends MetGroep & { sleutel: string }>(dagRegels: readonly T[]): Map<string, string> {
  const uit = new Map<string, string>()
  blokken(dagRegels).forEach((blok, i) => {
    blok.items.forEach((r, j) => uit.set(r.sleutel, blok.items.length === 1 ? String(i + 1) : `${i + 1}${String.fromCharCode(97 + j)}`))
  })
  return uit
}

export interface Stap<T> {
  item: T
  /** 1, 2, 3... */
  set: number
  /** Rust na deze set in seconden (0 = meteen door naar de volgende oefening). */
  rustNa: number
}

/**
 * De volgorde waarin het lid de sets doet. Los: alle sets achter elkaar.
 * Superset en circuit: per ronde elke oefening een set, pas rust na de
 * laatste oefening van de ronde (de langste rust van het blok).
 */
export function uitvoerVolgorde<T extends { sets: number | null; rustSec: number | null }>(blok: Blok<T>): Stap<T>[] {
  const sets = (t: T) => Math.max(1, t.sets ?? 1)
  if (blok.items.length === 1) {
    const item = blok.items[0]
    return Array.from({ length: sets(item) }, (_, i) => ({ item, set: i + 1, rustNa: item.rustSec ?? 0 }))
  }
  const rondes = Math.max(...blok.items.map(sets))
  const blokRust = Math.max(0, ...blok.items.map((t) => t.rustSec ?? 0))
  const uit: Stap<T>[] = []
  for (let ronde = 1; ronde <= rondes; ronde++) {
    const inRonde = blok.items.filter((t) => sets(t) >= ronde)
    inRonde.forEach((item, i) => uit.push({ item, set: ronde, rustNa: i === inRonde.length - 1 ? blokRust : 0 }))
  }
  return uit
}
