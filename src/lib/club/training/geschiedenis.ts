// ─── Fit Factory Club, training: ongedaan maken in de editor (PUUR) ─────────
// Een stapel van eerdere staten. Typen in hetzelfde veld telt als een stap
// (anders zou elke letter een stap zijn): geef dan dezelfde `samenvoeg` mee.

export interface Geschiedenis<T> {
  verleden: readonly T[]
  heden: T
  toekomst: readonly T[]
  /** Sleutel van de laatste wijziging, om typen samen te voegen. */
  samenvoeg: string | null
}

export const MAX_STAPPEN = 60

export function begin<T>(heden: T): Geschiedenis<T> {
  return { verleden: [], heden, toekomst: [], samenvoeg: null }
}

export function zet<T>(g: Geschiedenis<T>, nieuw: T, samenvoeg: string | null = null): Geschiedenis<T> {
  if (Object.is(nieuw, g.heden)) return g
  if (samenvoeg !== null && samenvoeg === g.samenvoeg) return { ...g, heden: nieuw, toekomst: [] }
  return { verleden: [...g.verleden, g.heden].slice(-MAX_STAPPEN), heden: nieuw, toekomst: [], samenvoeg }
}

export function ongedaan<T>(g: Geschiedenis<T>): Geschiedenis<T> {
  const vorige = g.verleden[g.verleden.length - 1]
  if (vorige === undefined) return g
  return { verleden: g.verleden.slice(0, -1), heden: vorige, toekomst: [g.heden, ...g.toekomst], samenvoeg: null }
}

export function opnieuw<T>(g: Geschiedenis<T>): Geschiedenis<T> {
  const volgende = g.toekomst[0]
  if (volgende === undefined) return g
  return { verleden: [...g.verleden, g.heden], heden: volgende, toekomst: g.toekomst.slice(1), samenvoeg: null }
}

export const kanOngedaan = <T>(g: Geschiedenis<T>): boolean => g.verleden.length > 0
export const kanOpnieuw = <T>(g: Geschiedenis<T>): boolean => g.toekomst.length > 0
