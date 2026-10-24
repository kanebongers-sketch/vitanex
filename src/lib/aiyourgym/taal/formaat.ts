// ─── AI Your Gym: datums, getallen en bedragen per taal (PUUR) ──────────────
// Altijd via deze functies, nooit zelf toLocaleString('nl-NL') schrijven: dan
// klopt het Engels vanzelf. Nederlands = nl-NL, Engels = en-GB (dag voor maand,
// 24 uur). Datums in de tijdzone van de sportscholen (Europe/Amsterdam).

import { LOCALE, type Taal } from './taal'

export const TIJDZONE = 'Europe/Amsterdam'

type DatumInvoer = Date | string | number

function alsDatum(waarde: DatumInvoer): Date {
  return waarde instanceof Date ? waarde : new Date(waarde)
}

const STIJLEN = {
  /** 24 okt. 2026 | 24 Oct 2026 */
  kort: { day: 'numeric', month: 'short', year: 'numeric' },
  /** 24 oktober 2026 | 24 October 2026 */
  lang: { day: 'numeric', month: 'long', year: 'numeric' },
  /** zaterdag 24 oktober | Saturday 24 October */
  dag: { weekday: 'long', day: 'numeric', month: 'long' },
  /** 24-10-2026 | 24/10/2026 */
  cijfers: { day: '2-digit', month: '2-digit', year: 'numeric' },
} as const satisfies Record<string, Intl.DateTimeFormatOptions>

export type DatumStijl = keyof typeof STIJLEN

/** Een datum in de taal van de gebruiker. Een ongeldige datum geeft een lege tekst. */
export function formatDatum(waarde: DatumInvoer, taal: Taal, stijl: DatumStijl = 'lang'): string {
  const datum = alsDatum(waarde)
  if (Number.isNaN(datum.getTime())) return ''
  return new Intl.DateTimeFormat(LOCALE[taal], { ...STIJLEN[stijl], timeZone: TIJDZONE }).format(datum)
}

/** Een tijd als 07:30, in beide talen met 24 uur. */
export function formatTijd(waarde: DatumInvoer, taal: Taal): string {
  const datum = alsDatum(waarde)
  if (Number.isNaN(datum.getTime())) return ''
  return new Intl.DateTimeFormat(LOCALE[taal], { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: TIJDZONE }).format(datum)
}

/** Een getal: 1.234,5 | 1,234.5 */
export function formatGetal(waarde: number, taal: Taal, opties: Intl.NumberFormatOptions = {}): string {
  return new Intl.NumberFormat(LOCALE[taal], opties).format(waarde)
}

/** Een percentage uit een fractie: 0.42 wordt 42% (in beide talen zonder spatie). */
export function formatProcent(fractie: number, taal: Taal, decimalen = 0): string {
  return new Intl.NumberFormat(LOCALE[taal], { style: 'percent', maximumFractionDigits: decimalen }).format(fractie)
}

/**
 * Een bedrag in euro's: € 49,95 | €49.95. Hele bedragen zonder centen
 * (€ 49 | €49), tenzij `centenAltijd`.
 */
export function formatEuro(euro: number, taal: Taal, centenAltijd = false): string {
  const heel = Number.isInteger(euro) && !centenAltijd
  return new Intl.NumberFormat(LOCALE[taal], {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: heel ? 0 : 2,
    maximumFractionDigits: heel ? 0 : 2,
  }).format(euro)
}

/** Een bedrag in centen (zo staan bedragen in de database en bij Stripe). Altijd met centen. */
export function formatEuroCenten(centen: number, taal: Taal): string {
  return formatEuro(Math.round(centen) / 100, taal, true)
}
