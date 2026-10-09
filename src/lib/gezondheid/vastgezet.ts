// ─── Vastgezette metrieken ────────────────────────────────────────────────────
// Welke metrieken bovenaan de samenvatting staan. Per apparaat bewaard
// (localStorage) — puur een weergavevoorkeur, geen gezondheidsdata.

import { isMetriekSleutel, type MetriekSleutel } from './types'

export const STANDAARD_VASTGEZET: readonly MetriekSleutel[] = [
  'stappen', 'slaap', 'rusthartslag', 'hrv', 'actieve-kcal', 'gewicht',
]

export const MAX_VASTGEZET = 8

/** Leest een opgeslagen lijst; null als hij ontbreekt of ongeldig is. */
export function leesVastgezet(ruw: string | null): MetriekSleutel[] | null {
  if (ruw === null) return null
  try {
    const waarde: unknown = JSON.parse(ruw)
    if (!Array.isArray(waarde)) return null
    const geldig = waarde.filter(isMetriekSleutel)
    return [...new Set(geldig)].slice(0, MAX_VASTGEZET)
  } catch {
    return null
  }
}

/** Zet vast of maakt los (onveranderlijk). */
export function wisselVastgezet(
  lijst: readonly MetriekSleutel[], sleutel: MetriekSleutel,
): MetriekSleutel[] {
  if (lijst.includes(sleutel)) return lijst.filter((s) => s !== sleutel)
  return [...lijst, sleutel].slice(-MAX_VASTGEZET)
}

/**
 * Splitst metrieken mét data in vastgezet (in jouw volgorde) en de rest.
 * Heb je niets vastgezet dat data heeft, dan tonen we de eerste vier met data,
 * zodat de samenvatting nooit leeg is terwijl er wel metingen zijn.
 */
export function verdeelSamenvatting(
  vastgezet: readonly MetriekSleutel[], metData: readonly MetriekSleutel[],
): { boven: MetriekSleutel[]; overig: MetriekSleutel[] } {
  const beschikbaar = new Set(metData)
  const gekozen = vastgezet.filter((s) => beschikbaar.has(s))
  const boven = gekozen.length > 0 ? gekozen : metData.slice(0, 4)
  return { boven, overig: metData.filter((s) => !boven.includes(s)) }
}
