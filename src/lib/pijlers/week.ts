// ─── MentaForce — pijler-week (puur) ────────────────────────────────────────
// Dag- en weekhelpers voor de 7-daagse pijler-strip in de navigatie.
// Puur (geen React, geen DB-import) zodat client én server exact dezelfde
// dagindeling gebruiken en dit testbaar blijft — zelfde principe als `pijlers.ts`.

import type { PijlerKey } from './pijlers'

/** Lengte van de strip: vandaag + de 6 voorgaande dagen. */
export const WEEK_DAGEN = 7

const TIJDZONE = 'Europe/Amsterdam'

/**
 * Datum als 'YYYY-MM-DD' in de tijdzone van de gebruiker.
 * Bewust NIET `toISOString()`: dat rekent in UTC en zet 's avonds de dag een
 * stap vooruit. De `datum`-kolommen in de database bevatten al lokale dagen,
 * dus daar moet dit exact op aansluiten.
 */
export function amsterdamDatum(d: Date): string {
  return d
    .toLocaleDateString('nl-NL', {
      timeZone: TIJDZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    .split('-')
    .reverse()
    .join('-')
}

/**
 * De datum van `dagen` dagen terug, als 'YYYY-MM-DD'.
 * Rekent via een anker op UTC-middag i.p.v. `- n * 86_400_000`: een dag is bij
 * een zomertijdovergang geen 24 uur, waardoor die aftrekking rond middernacht
 * op de verkeerde kalenderdag kan uitkomen.
 */
export function dagenGeleden(dagen: number, nu: Date = new Date()): string {
  const anker = new Date(`${amsterdamDatum(nu)}T12:00:00.000Z`)
  anker.setUTCDate(anker.getUTCDate() - dagen)
  return anker.toISOString().slice(0, 10)
}

/** De 7 dagen van de strip, oud → nieuw (vandaag als laatste). */
export function weekDatums(nu: Date = new Date()): string[] {
  return Array.from({ length: WEEK_DAGEN }, (_, i) => dagenGeleden(WEEK_DAGEN - 1 - i, nu))
}

const WEEKDAG_KORT = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'] as const
const WEEKDAG_LANG = [
  'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag',
] as const

/** Weekdag-index ma=0 … zo=6 voor een 'YYYY-MM-DD'-datum. */
function weekdagIndex(datum: string): number {
  // UTC-middag + getUTCDay: onafhankelijk van de tijdzone van de browser.
  return (new Date(`${datum}T12:00:00.000Z`).getUTCDay() + 6) % 7
}

/** Korte weekdagnaam ('Ma') — voor het zichtbare label onder een ring. */
export function weekdagKort(datum: string): string {
  return WEEKDAG_KORT[weekdagIndex(datum)] ?? ''
}

/** Volledige weekdagnaam ('Maandag') — voor het tekstuele alternatief. */
export function weekdagLang(datum: string): string {
  return WEEKDAG_LANG[weekdagIndex(datum)] ?? ''
}

/**
 * Eén dag uit de strip: voor welke canonieke pijlers is er die dag data gelogd.
 * Eerlijk per definitie: `gelogd` bevat alleen pijlers met échte data. Een
 * ontbrekende pijler staat er simpelweg niet in — nooit een verzonnen waarde.
 */
export interface PijlerWeekDag {
  /** 'YYYY-MM-DD' in Europe/Amsterdam. */
  datum: string
  /** Pijlers met data op die dag, in canonieke volgorde. Leeg = niets gelogd. */
  gelogd: PijlerKey[]
}
