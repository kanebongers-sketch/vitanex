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
