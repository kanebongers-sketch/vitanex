// ─── Fit Factory Club: cijfers vergelijken en middelen (PUUR) ──────────────
// Een vergelijking bestaat alleen als beide kanten een waarde hebben. Is er
// geen data voor de vorige maand of vorig jaar, dan zeggen we dat eerlijk in
// plaats van met nul te vergelijken.

export interface Verschil {
  basis: number
  /** huidig min basis */
  verschil: number
  /** verschil gedeeld door basis; null als de basis nul is. */
  relatief: number | null
}

export function vergelijk(huidig: number | null, basis: number | null): Verschil | null {
  if (huidig === null || basis === null || !Number.isFinite(huidig) || !Number.isFinite(basis)) return null
  const verschil = huidig - basis
  return { basis, verschil, relatief: basis !== 0 ? verschil / basis : null }
}

export type Beter = 'hoger' | 'lager' | null
export type Oordeel = 'beter' | 'slechter' | 'gelijk'

/** Is het verschil goed nieuws? `drempel` voorkomt dat afrondingsruis een kleur krijgt. */
export function oordeel(v: Verschil, beter: Beter, drempel = 1e-9): Oordeel {
  if (beter === null || Math.abs(v.verschil) <= drempel) return 'gelijk'
  return (v.verschil > 0) === (beter === 'hoger') ? 'beter' : 'slechter'
}

/** Een totaal over `dagen` dagen omgerekend naar een gemiddelde week. */
export function perWeek(totaal: number, dagen: number): number {
  return dagen > 0 ? (totaal * 7) / dagen : 0
}

/** Bezoek per lid per week; null zonder leden of zonder dagen. */
export function perLidPerWeek(bezoek: number, dagen: number, leden: number): number | null {
  return leden > 0 && dagen > 0 ? perWeek(bezoek, dagen) / leden : null
}

/** Deel van een geheel; null als er niets te delen valt. */
export function aandeel(deel: number, geheel: number): number | null {
  return geheel > 0 ? deel / geheel : null
}
