// ─── Fit Factory Club, personeel: weergavehulp (PUUR) ───────────────────────
// Labels en posities voor het rooster. Geen React, zodat server- en
// clientcomponenten het allebei gebruiken.

import type { CSSProperties } from 'react'
import { isoWeekdag, tijdNaarMinuten } from '@/lib/club/rooster/tijd'
import { WEEKDAG_KORT, WEEKDAG_LABEL } from '@/lib/club/rooster/openingstijden'

const DAG_MAAND = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', timeZone: 'UTC' })
const LANG = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'long', timeZone: 'UTC' })

function alsDatum(datum: string): Date {
  return new Date(`${datum}T12:00:00Z`)
}

/** "12 okt" */
export function dagMaand(datum: string): string {
  return DAG_MAAND.format(alsDatum(datum))
}

/** "12 oktober" */
export function dagMaandLang(datum: string): string {
  return LANG.format(alsDatum(datum))
}

/** "Ma" */
export function weekdagKort(datum: string): string {
  return WEEKDAG_KORT[isoWeekdag(datum) - 1]
}

/** "Maandag 12 oktober" */
export function dagVolledig(datum: string): string {
  return `${WEEKDAG_LABEL[isoWeekdag(datum) - 1]} ${dagMaandLang(datum)}`
}

/** Minuten als uren met komma: 450 wordt "7,5". */
export function uurTekst(min: number): string {
  const u = Math.round((min / 60) * 10) / 10
  return String(u).replace('.', ',')
}

export interface Bereik {
  van: number
  tot: number
}

/** Positie van een tijdvak binnen het bereik, als CSS-variabelen (procent). */
export function plekStijl(begin: string | number, eind: string | number, b: Bereik): CSSProperties {
  const s = typeof begin === 'number' ? begin : tijdNaarMinuten(begin)
  const e = typeof eind === 'number' ? eind : tijdNaarMinuten(eind)
  const span = Math.max(1, b.tot - b.van)
  const l = Math.max(0, ((s - b.van) / span) * 100)
  const w = Math.max(0, ((Math.min(e, b.tot) - Math.max(s, b.van)) / span) * 100)
  return { '--l': `${l}%`, '--w': `${w}%` } as CSSProperties
}
