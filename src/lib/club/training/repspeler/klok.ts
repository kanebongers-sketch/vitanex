// ─── Club, rep-speler: de klok (PUUR) ───────────────────────────────────────
// Speeltijd los van de echte tijd: pauzeren, verder en een snelheid (0,5x om
// rustig mee te kijken, 1x om mee te trainen). Elke functie geeft een nieuwe
// klok terug; de tijd zelf (nu, in ms) komt van buiten, zodat dit testbaar is.

export interface Klok {
  /** Opgebouwde speeltijd in seconden tot het laatste start- of pauzemoment. */
  looptijd: number
  /** Sinds wanneer de klok loopt (ms), of null als hij stilstaat. */
  sinds: number | null
  snelheid: number
}

export const MIN_SNELHEID = 0.25
export const MAX_SNELHEID = 2

function geldigeSnelheid(s: number): number {
  return Number.isFinite(s) ? Math.min(MAX_SNELHEID, Math.max(MIN_SNELHEID, s)) : 1
}

export function nieuweKlok(snelheid = 1): Klok {
  return { looptijd: 0, sinds: null, snelheid: geldigeSnelheid(snelheid) }
}

export function loopt(k: Klok): boolean {
  return k.sinds !== null
}

/** Speeltijd in seconden op moment nu (ms). */
export function tijdVan(k: Klok, nu: number): number {
  if (k.sinds === null) return k.looptijd
  return k.looptijd + (Math.max(0, nu - k.sinds) / 1000) * k.snelheid
}

export function start(k: Klok, nu: number): Klok {
  return k.sinds === null ? { ...k, sinds: nu } : k
}

export function pauzeer(k: Klok, nu: number): Klok {
  return k.sinds === null ? k : { ...k, looptijd: tijdVan(k, nu), sinds: null }
}

/** Andere snelheid; de tijd tot nu blijft staan, alleen het vervolg gaat sneller of trager. */
export function metSnelheid(k: Klok, snelheid: number, nu: number): Klok {
  const s = geldigeSnelheid(snelheid)
  return k.sinds === null ? { ...k, snelheid: s } : { looptijd: tijdVan(k, nu), sinds: nu, snelheid: s }
}

/** Terug naar het begin, stil, met dezelfde snelheid. */
export function herstart(k: Klok): Klok {
  return { looptijd: 0, sinds: null, snelheid: k.snelheid }
}
