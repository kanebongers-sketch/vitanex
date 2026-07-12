// ─── Coaching-traject (overlay) — client-veilige types & helpers ────────────
// Spiegelt de opzet van ./relatie.ts: hier staan de gedeelde types, labels en
// PURE (server-loze) helpers. De server-only logica (admin-client) staat in
// ./traject-server.ts. Zo kunnen pagina's, API-routes én server-helpers deze
// definities delen zonder server-code naar de browser te lekken.
//
// Een traject is een 6-maanden (standaard) begeleidingslijn per coach↔klant,
// opgedeeld in fases die elk één pijler (body | mind | performance) centraal
// zetten — zie ./pijlers.ts.

import type { Pijler } from './pijlers'
import { isPijler } from './pijlers'

export type TrajectStatus = 'concept' | 'actief' | 'afgerond' | 'gepauzeerd'

export interface CoachingTraject {
  id: string
  coach_id: string
  klant_id: string
  titel: string
  doel: string | null
  start_datum: string
  duur_maanden: number
  status: TrajectStatus
}

export interface TrajectFase {
  id: string
  traject_id: string
  volgorde: number
  titel: string
  pijler: Pijler
  focus: string | null
  week_van: number | null
  week_tot: number | null
}

/** Traject + fases + server-berekende voortgang (huidige week/fase). */
export interface TrajectMetFases {
  traject: CoachingTraject
  fases: TrajectFase[]
  /** Weeknummer sinds start_datum (1-gebaseerd). ≤ 0 = nog niet gestart. */
  huidige_week: number
  /** Id van de fase die op dit moment loopt, of null. */
  huidige_fase_id: string | null
}

// ─── Invoer (coach stelt traject op / vervangt het) ─────────────────────────
export interface FaseInvoer {
  titel: string
  pijler: Pijler
  focus?: string | null
  week_van?: number | null
  week_tot?: number | null
}

export interface TrajectInvoer {
  titel: string
  doel?: string | null
  start_datum?: string
  duur_maanden?: number
  status?: TrajectStatus
  fases: FaseInvoer[]
}

// ─── Labels & statusstijl (bestaande tokens, nooit hardcoden) ───────────────
export const TRAJECT_STATUS_STIJL: Record<TrajectStatus, { bg: string; color: string; label: string }> = {
  concept:    { bg: 'var(--bg-subtle)',      color: 'var(--text-3)',   label: 'Concept' },
  actief:     { bg: 'var(--mf-green-light)',  color: 'var(--mf-green)', label: 'Actief' },
  afgerond:   { bg: 'var(--mf-purple-light)', color: 'var(--mf-purple)', label: 'Afgerond' },
  gepauzeerd: { bg: 'var(--mf-amber-light)',  color: 'var(--mf-amber)', label: 'Gepauzeerd' },
}

export const TRAJECT_STATUS_VOLGORDE: readonly TrajectStatus[] = ['concept', 'actief', 'gepauzeerd', 'afgerond']

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000

/**
 * Weeknummer (1-gebaseerd) sinds de startdatum. Week 1 = de eerste week na
 * start. Retourneert ≤ 0 wanneer het traject nog niet is begonnen.
 */
export function huidigeWeekVanTraject(startDatum: string, referentie: Date = new Date()): number {
  const start = new Date(`${startDatum}T00:00:00`)
  if (Number.isNaN(start.getTime())) return 0
  const verstreken = referentie.getTime() - start.getTime()
  return Math.floor(verstreken / MS_PER_WEEK) + 1
}

/**
 * De fase die het opgegeven weeknummer bevat, op basis van [week_van, week_tot].
 * Fases zonder volledige week-range tellen niet mee. Null wanneer er geen match
 * is (bijv. vóór de start of ná de laatste fase).
 */
export function berekenHuidigeFaseId(fases: readonly TrajectFase[], huidigeWeek: number): string | null {
  if (huidigeWeek < 1) return null
  for (const fase of fases) {
    if (fase.week_van === null || fase.week_tot === null) continue
    if (huidigeWeek >= fase.week_van && huidigeWeek <= fase.week_tot) return fase.id
  }
  return null
}

/** Narrowing van onbekende JSON naar TrajectStatus, met veilige default. */
export function alsTrajectStatus(waarde: unknown, standaard: TrajectStatus = 'concept'): TrajectStatus {
  return waarde === 'concept' || waarde === 'actief' || waarde === 'afgerond' || waarde === 'gepauzeerd'
    ? waarde
    : standaard
}

/** Herexport zodat callers pijler-narrowing naast traject-narrowing hebben. */
export { isPijler }
