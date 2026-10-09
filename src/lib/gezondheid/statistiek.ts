// ─── Kleine, pure statistiek- en datumhulpen ──────────────────────────────────
// Datums zijn kalenderdagen als 'YYYY-MM-DD'. We rekenen in UTC zodat
// zomer-/wintertijd nooit een dag laat verspringen.

const DAG_MS = 86_400_000

export function gemiddelde(waarden: readonly number[]): number | null {
  if (waarden.length === 0) return null
  return waarden.reduce((som, w) => som + w, 0) / waarden.length
}

/** Kwantiel met lineaire interpolatie (q tussen 0 en 1). */
export function kwantiel(waarden: readonly number[], q: number): number | null {
  if (waarden.length === 0) return null
  const gesorteerd = [...waarden].sort((a, b) => a - b)
  const positie = (gesorteerd.length - 1) * Math.min(Math.max(q, 0), 1)
  const onder = Math.floor(positie)
  const boven = Math.ceil(positie)
  const fractie = positie - onder
  return gesorteerd[onder] + (gesorteerd[boven] - gesorteerd[onder]) * fractie
}

export function mediaan(waarden: readonly number[]): number | null {
  return kwantiel(waarden, 0.5)
}

function naarUtc(datum: string): Date {
  return new Date(`${datum}T00:00:00Z`)
}

function naarDatum(d: Date): string {
  return d.toISOString().slice(0, 10)
}

/** Schuift een datum `aantal` dagen op (negatief = terug). */
export function verschuifDatum(datum: string, aantal: number): string {
  return naarDatum(new Date(naarUtc(datum).getTime() + aantal * DAG_MS))
}

/** Aantal hele dagen van `van` tot `tot` (tot − van). */
export function dagenTussen(van: string, tot: string): number {
  return Math.round((naarUtc(tot).getTime() - naarUtc(van).getTime()) / DAG_MS)
}

/** Maandag van de week waarin `datum` valt. */
export function weekStart(datum: string): string {
  const weekdag = (naarUtc(datum).getUTCDay() + 6) % 7 // ma = 0
  return verschuifDatum(datum, -weekdag)
}

/** Eerste dag van de maand van `datum`. */
export function maandStart(datum: string): string {
  return `${datum.slice(0, 7)}-01`
}

/** Eerste dag van de maand `aantal` maanden vóór/na `datum`. */
export function verschuifMaand(datum: string, aantal: number): string {
  const d = naarUtc(maandStart(datum))
  d.setUTCMonth(d.getUTCMonth() + aantal)
  return naarDatum(d)
}

const LOCALE = 'nl-NL'

function datumFormaat(datum: string, opties: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(LOCALE, { timeZone: 'UTC', ...opties }).format(naarUtc(datum))
}

/** "ma 6" */
export function dagLabelKort(datum: string): string {
  return datumFormaat(datum, { weekday: 'short', day: 'numeric' }).replace('.', '')
}

/** "6 okt" */
export function datumKort(datum: string): string {
  return datumFormaat(datum, { day: 'numeric', month: 'short' }).replace('.', '')
}

/** "maandag 6 oktober" */
export function datumLang(datum: string): string {
  return datumFormaat(datum, { weekday: 'long', day: 'numeric', month: 'long' })
}

/** "okt" */
export function maandKort(datum: string): string {
  return datumFormaat(datum, { month: 'short' }).replace('.', '')
}

/** "oktober 2026" */
export function maandLang(datum: string): string {
  return datumFormaat(datum, { month: 'long', year: 'numeric' })
}

/** "Vandaag", "Gisteren" of "ma 6 okt" — relatief aan `vandaag`. */
export function relatieveDatum(datum: string, vandaag: string): string {
  const verschil = dagenTussen(datum, vandaag)
  if (verschil === 0) return 'Vandaag'
  if (verschil === 1) return 'Gisteren'
  return datumFormaat(datum, { weekday: 'short', day: 'numeric', month: 'short' }).replace(/\./g, '')
}
