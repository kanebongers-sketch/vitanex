// ─── Club, sluitingsdagen: Nederlandse feestdagen (PUUR) ────────────────────
// Pasen volgt uit het Computus-algoritme (de anonieme Gregoriaanse methode,
// ook bekend als Meeus/Jones/Butcher). Hemelvaart en Pinksteren rekenen vanaf
// Pasen. Koningsdag is 27 april, of 26 april als de 27e op zondag valt.

import { isoWeekdag, plusDagen } from '@/lib/club/rooster/tijd'

export const FEESTDAG_SLEUTELS = [
  'nieuwjaarsdag',
  'eerste-paasdag',
  'tweede-paasdag',
  'koningsdag',
  'bevrijdingsdag',
  'hemelvaartsdag',
  'eerste-pinksterdag',
  'tweede-pinksterdag',
  'eerste-kerstdag',
  'tweede-kerstdag',
] as const

export type FeestdagSleutel = (typeof FEESTDAG_SLEUTELS)[number]

export interface Feestdag {
  sleutel: FeestdagSleutel
  naam: string
  /** "2026-04-05" */
  datum: string
}

export const FEESTDAG_NAAM: Record<FeestdagSleutel, string> = {
  nieuwjaarsdag: 'Nieuwjaarsdag',
  'eerste-paasdag': 'Eerste Paasdag',
  'tweede-paasdag': 'Tweede Paasdag',
  koningsdag: 'Koningsdag',
  bevrijdingsdag: 'Bevrijdingsdag',
  hemelvaartsdag: 'Hemelvaartsdag',
  'eerste-pinksterdag': 'Eerste Pinksterdag',
  'tweede-pinksterdag': 'Tweede Pinksterdag',
  'eerste-kerstdag': 'Eerste Kerstdag',
  'tweede-kerstdag': 'Tweede Kerstdag',
}

export const MIN_JAAR = 2000
export const MAX_JAAR = 2100

export function isFeestdagSleutel(v: unknown): v is FeestdagSleutel {
  return typeof v === 'string' && (FEESTDAG_SLEUTELS as readonly string[]).includes(v)
}

function datumVan(jaar: number, maand: number, dag: number): string {
  return `${jaar}-${String(maand).padStart(2, '0')}-${String(dag).padStart(2, '0')}`
}

/** Eerste Paasdag (Gregoriaanse kalender) van een jaar. */
export function paaszondag(jaar: number): string {
  const a = jaar % 19
  const b = Math.floor(jaar / 100)
  const c = jaar % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const maand = Math.floor((h + l - 7 * m + 114) / 31)
  const dag = ((h + l - 7 * m + 114) % 31) + 1
  return datumVan(jaar, maand, dag)
}

/** Koningsdag: 27 april, maar 26 april als de 27e op zondag valt. */
export function koningsdag(jaar: number): string {
  const zevenentwintig = datumVan(jaar, 4, 27)
  return isoWeekdag(zevenentwintig) === 7 ? datumVan(jaar, 4, 26) : zevenentwintig
}

/** Alle Nederlandse feestdagen van een jaar, op datum. */
export function nederlandseFeestdagen(jaar: number): Feestdag[] {
  const pasen = paaszondag(jaar)
  const datums: Record<FeestdagSleutel, string> = {
    nieuwjaarsdag: datumVan(jaar, 1, 1),
    'eerste-paasdag': pasen,
    'tweede-paasdag': plusDagen(pasen, 1),
    koningsdag: koningsdag(jaar),
    bevrijdingsdag: datumVan(jaar, 5, 5),
    hemelvaartsdag: plusDagen(pasen, 39),
    'eerste-pinksterdag': plusDagen(pasen, 49),
    'tweede-pinksterdag': plusDagen(pasen, 50),
    'eerste-kerstdag': datumVan(jaar, 12, 25),
    'tweede-kerstdag': datumVan(jaar, 12, 26),
  }
  return FEESTDAG_SLEUTELS.map((sleutel) => ({ sleutel, naam: FEESTDAG_NAAM[sleutel], datum: datums[sleutel] })).sort((x, y) =>
    x.datum < y.datum ? -1 : x.datum > y.datum ? 1 : 0,
  )
}
