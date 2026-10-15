// ─── Fit Factory Club: getallen netjes in het Nederlands (PUUR) ─────────────

const HEEL = new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 0 })
const EEN = new Intl.NumberFormat('nl-NL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

export function heel(n: number): string {
  return HEEL.format(Math.round(n))
}

export function eenDecimaal(n: number): string {
  return EEN.format(n)
}

/** 0.734 wordt "73%"; null wordt een streepje-vrije "geen data". */
export function procent(deel: number | null): string {
  return deel === null ? 'geen data' : `${HEEL.format(Math.round(deel * 100))}%`
}

/** +3, 0 of -2 (met een echt minteken voor schermlezers en typografie). */
export function metTeken(n: number): string {
  if (n > 0) return `+${heel(n)}`
  if (n < 0) return `−${heel(Math.abs(n))}`
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
export function aantal(n: number, enkel: string, meer: string): string {
  return `${heel(n)} ${Math.round(n) === 1 ? enkel : meer}`
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
export function metTekenDecimaal(n: number): string {
  const afgerond = Math.round(n * 10) / 10
  if (afgerond > 0) return `+${eenDecimaal(afgerond)}`
  if (afgerond < 0) return `−${eenDecimaal(Math.abs(afgerond))}`
  return eenDecimaal(0)
}

/** Een relatief verschil: 0.12 wordt "+12%". */
export function metTekenProcent(deel: number): string {
  return `${metTeken(deel * 100)}%`
}
