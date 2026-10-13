// Verhouding voor de vergelijkingsstaven bij een highlight: afgelopen week naast
// je normaal. Puur, zodat het zonder browser te testen is.

import type { MetriekSleutel } from './types'

/** Kloktijden (minuten vanaf een vast punt) zijn geen hoeveelheid: daar geen staven. */
const KLOKTIJDEN: ReadonlySet<MetriekSleutel> = new Set(['bedtijd', 'wektijd'])

export function heeftStaven(sleutel: MetriekSleutel): boolean {
  return !KLOKTIJDEN.has(sleutel)
}

/** Kleinste zichtbare staaf, zodat een lage waarde niet als "niets" leest. */
const MIN_AANDEEL = 0.04

/**
 * Breedte van beide staven als aandeel (0 tot 1) van de grootste van de twee.
 * Ongeldige of negatieve waarden geven geen staven (null).
 */
export function staafAandelen(recent: number, normaal: number): { recent: number; normaal: number } | null {
  if (!Number.isFinite(recent) || !Number.isFinite(normaal) || recent < 0 || normaal < 0) return null
  const max = Math.max(recent, normaal)
  if (max === 0) return null
  return {
    recent: Math.max(MIN_AANDEEL, recent / max),
    normaal: Math.max(MIN_AANDEEL, normaal / max),
  }
}
