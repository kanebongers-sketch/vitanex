// Presentatie-helpers voor de analyse-feature. Puur, geen zij-effecten.

const MAANDEN_KORT = [
  'jan', 'feb', 'mrt', 'apr', 'mei', 'jun',
  'jul', 'aug', 'sep', 'okt', 'nov', 'dec',
] as const

const EURO = new Intl.NumberFormat('nl-NL', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

/** € zonder centen, NL-notatie: 4994 → "€ 4.994". */
export function formatEuro(bedrag: number): string {
  return EURO.format(bedrag)
}

/** 'YYYY-MM' → "jul 2026" (statische maand-tabel, tijdzone-onafhankelijk). */
export function maandLabel(maand: string): string {
  const [jaar, m] = maand.split('-')
  const naam = MAANDEN_KORT[Number(m) - 1] ?? m
  return `${naam} ${jaar}`
}

export type MaandStatus = 'verleden' | 'deze-maand' | 'komend'

/** Positie van een maand t.o.v. de peilmaand — stuurt het verleng-signaal. */
export function maandStatus(maand: string, peilmaand: string): MaandStatus {
  if (maand === peilmaand) return 'deze-maand'
  return maand < peilmaand ? 'verleden' : 'komend'
}

/** Breedte-percentage van een balk t.o.v. de hoogste waarde in de reeks. */
export function balkBreedte(waarde: number, max: number): string {
  if (max <= 0) return '0%'
  return `${((waarde / max) * 100).toFixed(1)}%`
}
