// ─── Fit Factory Club, taken: teksten voor op het scherm (PUUR) ─────────────
// Datums zijn kalenderdagen; we formatteren ze in UTC zodat de dag nooit
// verschuift door de tijdzone van de server of het apparaat.

import { plusDagen } from '@/lib/club/rooster/tijd'
import type { Taak } from './typen'

const KORT = new Intl.DateTimeFormat('nl-NL', { weekday: 'short', timeZone: 'UTC' })
const LANG = new Intl.DateTimeFormat('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })
const DAG_MAAND = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'long', timeZone: 'UTC' })

function alsDatum(datum: string): Date {
  return new Date(`${datum}T12:00:00Z`)
}

/** "ma", "di", ... */
export function dagKort(datum: string): string {
  return KORT.format(alsDatum(datum)).replace('.', '')
}

/** De dag van de maand: 14. */
export function dagNummer(datum: string): number {
  return Number(datum.slice(8, 10))
}

/** "dinsdag 14 oktober". */
export function dagLang(datum: string): string {
  return LANG.format(alsDatum(datum))
}

/** "12 oktober tot 18 oktober 2026". */
export function weekLabel(maandag: string): string {
  const zondag = plusDagen(maandag, 6)
  return `${DAG_MAAND.format(alsDatum(maandag))} tot ${DAG_MAAND.format(alsDatum(zondag))} ${zondag.slice(0, 4)}`
}

export interface Groep<T> {
  groep: string | null
  taken: T[]
}

/** Opeenvolgende taken met hetzelfde kopje bij elkaar, in de volgorde van de lijst. */
export function perGroep<T extends Pick<Taak, 'groep'>>(taken: readonly T[]): Groep<T>[] {
  const uit: Groep<T>[] = []
  for (const taak of taken) {
    const laatste = uit[uit.length - 1]
    if (laatste && laatste.groep === taak.groep) laatste.taken.push(taak)
    else uit.push({ groep: taak.groep, taken: [taak] })
  }
  return uit
}
