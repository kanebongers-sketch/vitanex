// ─── Coaching-taken — client-veilige types & labels ─────────────────────────
// Gedeeld door pagina's en API-routes. GEEN server-imports hier — de
// server-only helpers (admin-client) staan in ./taken-server.ts.
//
// Dit is de MENSELIJKE coaching-laag: een coach wijst terugkerende taken toe
// aan een gekoppelde klant (zie migratie 038, bovenop de relatie uit 037).
//
// De pijler-definitie is centraal in ./pijlers (bron-van-waarheid); labels en
// kleuren leiden we daaruit af zodat taken- en trajectweergave nooit verschillen.

import { PIJLERS as PIJLER_INFO, PIJLER_VOLGORDE } from './pijlers'
import type { Pijler } from './pijlers'

export type { Pijler }
export { isPijler } from './pijlers'

export type Frequentie = 'dagelijks' | 'wekelijks'

// Pijler-sleutels in vaste volgorde — als array voor selects/iteratie.
export const PIJLERS: readonly Pijler[] = PIJLER_VOLGORDE
export const FREQUENTIES: readonly Frequentie[] = ['dagelijks', 'wekelijks']

// ─── Rij-types ──────────────────────────────────────────────────────────────
export interface CoachingTaak {
  id: string
  coach_id: string
  klant_id: string
  titel: string
  beschrijving: string | null
  pijler: Pijler
  frequentie: Frequentie
  target_per_week: number
  actief: boolean
  aangemaakt_op: string
  bijgewerkt_op: string
}

export interface TaakLog {
  id: string
  taak_id: string
  klant_id: string
  datum: string
  gehaald: boolean
  notitie: string | null
  aangemaakt_op: string
}

/** Taak verrijkt met voortgang van de huidige (NL-)week. */
export interface TaakMetVoortgang extends CoachingTaak {
  /** Aantal dagen met een 'gehaald'-log sinds maandag van deze week. */
  deze_week_gehaald: number
  /** Is de taak vandaag afgevinkt? */
  vandaag_gehaald: boolean
}

// ─── Labels ─────────────────────────────────────────────────────────────────
export const PIJLER_LABELS: Record<Pijler, string> = {
  body:        PIJLER_INFO.body.label,
  mind:        PIJLER_INFO.mind.label,
  performance: PIJLER_INFO.performance.label,
}

export const FREQUENTIE_LABELS: Record<Frequentie, string> = {
  dagelijks: 'Dagelijks',
  wekelijks: 'Wekelijks',
}

// Kleuren afgeleid uit de centrale pijler-tokens — nooit hex hardcoden.
export const PIJLER_STIJL: Record<Pijler, { bg: string; color: string }> = {
  body:        { bg: PIJLER_INFO.body.accentBgToken,        color: PIJLER_INFO.body.kleurToken },
  mind:        { bg: PIJLER_INFO.mind.accentBgToken,        color: PIJLER_INFO.mind.kleurToken },
  performance: { bg: PIJLER_INFO.performance.accentBgToken, color: PIJLER_INFO.performance.kleurToken },
}

// ─── Validatie-helpers (gedeeld client + server) ────────────────────────────
// isPijler wordt hierboven ge-re-exporteerd uit ./pijlers.
export function isFrequentie(waarde: unknown): waarde is Frequentie {
  return typeof waarde === 'string' && (FREQUENTIES as readonly string[]).includes(waarde)
}

/** Beschrijft de weekdoelstelling voor de UI, bv. "3× per week" of "Elke dag". */
export function targetOmschrijving(taak: Pick<CoachingTaak, 'frequentie' | 'target_per_week'>): string {
  if (taak.frequentie === 'dagelijks') return 'Elke dag'
  return `${taak.target_per_week}× per week`
}
