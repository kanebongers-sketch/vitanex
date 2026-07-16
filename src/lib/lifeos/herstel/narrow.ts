// ─── LifeOS — narrowing op de systeemgrens ─────────────────────────────────
// Whoop en Oura zijn externe API's. Wat daar binnenkomt is `unknown` tot we het
// gecontroleerd hebben — geen `as`-cast, want een cast is een belofte die de
// compiler gelooft en de leverancier niet nakomt.
//
// De regel: een veld dat er niet is, of het verkeerde type heeft, wordt `null`.
// Nooit NaN, nooit 0. Een veldwijziging bij de leverancier levert dan een lege
// waarde op die de UI eerlijk als "niet gemeten" toont, in plaats van een NaN
// die door de hele app lekt.
//
// Puur bestand: geen fetch, geen DB.

/** Is dit een gewoon object (en geen array of null)? */
export function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/** Een eindig getal, of null. Verwerpt NaN, Infinity, strings en null. */
export function getal(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}

/** Een niet-lege string, of null. */
export function tekst(v: unknown): string | null {
  return typeof v === 'string' && v.length > 0 ? v : null
}

/** Een array van onbekende items, of een lege lijst. */
export function lijst(v: unknown): readonly unknown[] {
  return Array.isArray(v) ? v : []
}

/** Een geneste property lezen zonder te casten. */
export function veld(v: unknown, sleutel: string): unknown {
  return isObject(v) ? v[sleutel] : undefined
}
