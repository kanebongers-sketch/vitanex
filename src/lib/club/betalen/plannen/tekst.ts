// ─── Club, betalen: bedragen in invoervelden en teksten (PUUR) ──────────────
// Een bedrag in centen als tekst in een veld ("39,95") en terug, altijd via
// cent.ts (nooit parseFloat of een deling buiten cent.ts).

import { cent, formatEuro, leesEuroTekst } from '../geld/cent'
import { INTERVAL_KORT, type Interval, type Korting } from './model'

/** 3995 wordt "39,95" (voor een invoerveld). */
export function centNaarInvoer(n: number): string {
  return formatEuro(cent(n)).replace(/^€\s/, '')
}

/** "39,95" of "€ 39,95" wordt 3995; leeg wordt `leegIs`; onleesbaar wordt null. */
export function invoerNaarCent(tekst: string, leegIs: number | null = null): number | null {
  if (tekst.trim() === '') return leegIs
  const c = leesEuroTekst(tekst)
  return c === null || c < 0 ? null : c
}

/** "€ 39,95". */
export function euroTekst(n: number): string {
  return formatEuro(cent(n))
}

/** "€ 39,95 per maand". */
export function prijsTekst(n: number, interval: Interval): string {
  return `${euroTekst(n)} ${INTERVAL_KORT[interval]}`
}

/** "25% korting" of "€ 5,00 korting per termijn". */
export function kortingWaardeTekst(k: Pick<Korting, 'soort' | 'waarde'>): string {
  return k.soort === 'procent' ? `${k.waarde}% korting` : `${euroTekst(k.waarde)} korting per termijn`
}
