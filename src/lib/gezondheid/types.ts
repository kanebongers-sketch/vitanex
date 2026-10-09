// ─── Gezondheid — gedeelde types ──────────────────────────────────────────────
// Eén samengevoegde dag per datum (native bronnen + handmatige invoer), plus
// losse trainingen. Puur data: geen React, geen Supabase.

export const METRIEK_SLEUTELS = [
  'stappen', 'afstand', 'actieve-kcal', 'beweegminuten', 'verdiepingen', 'workouts',
  'slaap', 'bedtijd', 'wektijd',
  'rusthartslag', 'hrv', 'vo2max',
  'gewicht',
  'ademhaling', 'zuurstof',
] as const

export type MetriekSleutel = (typeof METRIEK_SLEUTELS)[number]

export function isMetriekSleutel(waarde: unknown): waarde is MetriekSleutel {
  return typeof waarde === 'string' && (METRIEK_SLEUTELS as readonly string[]).includes(waarde)
}

export interface SlaapFases {
  diep: number | null
  licht: number | null
  rem: number | null
  wakker: number | null
}

/**
 * Eén kalenderdag (Europe/Amsterdam). `waarden` bevat alleen échte metingen:
 * ontbreekt een sleutel, dan is er die dag niets gemeten (nooit 0 invullen).
 *
 * Kloktijden zijn minuten: `bedtijd` telt vanaf 12:00 's middags (zodat 23:30
 * en 00:30 netjes naast elkaar liggen), `wektijd` vanaf middernacht.
 */
export interface GezondheidsDag {
  datum: string
  waarden: Partial<Record<MetriekSleutel, number>>
  fases: SlaapFases | null
  /** Welke bron elke waarde leverde (bv. { stappen: 'health_connect', slaap: 'handmatig' }). */
  herkomst: Partial<Record<MetriekSleutel, string>>
}

export interface Workout {
  id: string
  bron: string
  soort: string
  start: string
  eind: string
  datum: string
  minuten: number
  kcal: number | null
  afstandM: number | null
  gemHartslag: number | null
}

export interface BronStatus {
  bron: string
  laatsteSync: string | null
}

/** Antwoord van GET /api/gezondheid. */
export interface GezondheidAntwoord {
  vandaag: string
  dagen: GezondheidsDag[]
  workouts: Workout[]
  bronnen: BronStatus[]
}
