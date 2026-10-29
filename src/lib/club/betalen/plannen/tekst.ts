// ─── Club, betalen: bedragen in invoervelden en teksten (PUUR) ──────────────
// Een bedrag in centen als tekst in een veld ("39,95") en terug, altijd via
// cent.ts (nooit parseFloat of een deling buiten cent.ts).

import { cent, formatEuro, leesEuroTekst } from '../geld/cent'
import { type Interval, type Korting } from './model'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { formatEuroCenten } from '@/lib/aiyourgym/taal/formaat'
import { BETALEN } from '@/lib/aiyourgym/taal/woorden/club/betalen'

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
export function euroTekst(n: number, taal: Taal = 'nl'): string {
  return taal === 'nl' ? formatEuro(cent(n)) : formatEuroCenten(n, taal)
}

/** "€ 39,95 per maand". */
export function prijsTekst(n: number, interval: Interval, taal: Taal = 'nl'): string {
  return `${euroTekst(n, taal)} ${BETALEN[taal].intervalKort[interval]}`
}

/** "25% korting" of "€ 5,00 korting per termijn". */
export function kortingWaardeTekst(k: Pick<Korting, 'soort' | 'waarde'>, taal: Taal = 'nl'): string {
  const t = BETALEN[taal].tekst
  return k.soort === 'procent' ? t.procentKorting(k.waarde) : t.bedragKorting(euroTekst(k.waarde, taal))
}
