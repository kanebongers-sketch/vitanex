// ─── Fit Factory Club: getallen netjes in de taal van de gebruiker (PUUR) ───
// Standaard Nederlands (1.234 en 0,4); met taal 'en' Brits (1,234 en 0.4).

import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { LOCALE } from '@/lib/aiyourgym/taal/taal'

const HEEL: Record<Taal, Intl.NumberFormat> = {
  nl: new Intl.NumberFormat(LOCALE.nl, { maximumFractionDigits: 0 }),
  en: new Intl.NumberFormat(LOCALE.en, { maximumFractionDigits: 0 }),
}
const EEN: Record<Taal, Intl.NumberFormat> = {
  nl: new Intl.NumberFormat(LOCALE.nl, { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
  en: new Intl.NumberFormat(LOCALE.en, { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
}

/** "Geen data" in beide talen, voor een cijfer zonder bron. */
export const GEEN_DATA: Readonly<Record<Taal, string>> = { nl: 'geen data', en: 'no data' }

export function heel(n: number, taal: Taal = 'nl'): string {
  return HEEL[taal].format(Math.round(n))
}

export function eenDecimaal(n: number, taal: Taal = 'nl'): string {
  return EEN[taal].format(n)
}

/** 0.734 wordt "73%"; null wordt een streepje-vrije "geen data". */
export function procent(deel: number | null, taal: Taal = 'nl'): string {
  return deel === null ? GEEN_DATA[taal] : `${HEEL[taal].format(Math.round(deel * 100))}%`
}

/** +3, 0 of -2 (met een echt minteken voor schermlezers en typografie). */
export function metTeken(n: number, taal: Taal = 'nl'): string {
  if (n > 0) return `+${heel(n, taal)}`
  if (n < 0) return `−${heel(Math.abs(n), taal)}`
  return '0'
}

/** Een mooie bovengrens voor een as: 1, 2, 2.5 of 5 maal een macht van 10. */
export function mooiMaximum(max: number): number {
  if (max <= 0) return 1
  const macht = 10 ** Math.floor(Math.log10(max))
  const stap = [1, 2, 2.5, 5, 10].find((s) => s * macht >= max) ?? 10
  return stap * macht
}

/** "1 lid", "3 leden", "0 leden": enkelvoud alleen bij precies 1. */
export function aantal(n: number, enkel: string, meer: string, taal: Taal = 'nl'): string {
  return `${heel(n, taal)} ${Math.round(n) === 1 ? enkel : meer}`
}

export interface As {
  min: number
  max: number
  /** Van laag naar hoog, gelijke stappen, min en max inbegrepen. */
  streepjes: number[]
}

/**
 * Een as met ronde streepjes rond de waarden laag tot hoog, met wat lucht
 * erboven en eronder. Nooit onder nul als de waarden dat niet zijn.
 */
export function mooieAs(laag: number, hoog: number, stappen = 4): As {
  const lo = Math.min(laag, hoog)
  const hi = Math.max(laag, hoog)
  const ruimte = Math.max(hi - lo, Math.max(Math.abs(hi), 1) * 0.1, 1)
  // Tellingen hebben hele streepjes: nooit een stap kleiner dan 1.
  const stap = Math.max(1, mooiMaximum(ruimte / Math.max(1, stappen - 1)))
  const min = Math.max(lo >= 0 ? 0 : -Infinity, Math.floor((lo - stap * 0.25) / stap) * stap)
  let max = Math.ceil((hi + stap * 0.25) / stap) * stap
  if (max <= min) max = min + stap
  const streepjes: number[] = []
  for (let w = min; w <= max + stap / 2; w += stap) streepjes.push(Math.round(w * 1000) / 1000)
  return { min, max: streepjes[streepjes.length - 1], streepjes }
}

/** +0,4 of −1,2 (een decimaal, echt minteken); 0,0 zonder teken. */
export function metTekenDecimaal(n: number, taal: Taal = 'nl'): string {
  const afgerond = Math.round(n * 10) / 10
  if (afgerond > 0) return `+${eenDecimaal(afgerond, taal)}`
  if (afgerond < 0) return `−${eenDecimaal(Math.abs(afgerond), taal)}`
  return eenDecimaal(0, taal)
}

/** Een relatief verschil: 0.12 wordt "+12%". */
export function metTekenProcent(deel: number, taal: Taal = 'nl'): string {
  return `${metTeken(deel * 100, taal)}%`
}
