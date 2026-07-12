// ─── Coaching-content — client-veilige types & labels ───────────────────────
// Gedeeld door pagina's en API-routes. GEEN server-imports hier — de
// server-only helpers (admin-client) staan in ./content-server.ts.
//
// Dit is de LEVER-laag van de menselijke coaching (zie migratie 043, bovenop de
// relatie uit 037): een coach schrijft mindset-/stress-lessen of -opdrachten en
// levert die aan één gekoppelde klant OF aan al zijn klanten. De klant leest ze.
//
// De pijler-definitie is centraal in ./pijlers (bron-van-waarheid); labels en
// kleuren leiden we daaruit af, net als in ./taken, zodat de weergave overal gelijk is.

import { PIJLERS as PIJLER_INFO, PIJLER_VOLGORDE } from './pijlers'
import type { Pijler } from './pijlers'

export type { Pijler }
export { isPijler } from './pijlers'

/** Vorm waarin de coach zijn content aanlevert. */
export type ContentType = 'artikel' | 'opdracht' | 'audio' | 'video'

// Sleutels in vaste volgorde — als array voor selects/iteratie.
export const PIJLERS: readonly Pijler[] = PIJLER_VOLGORDE
export const CONTENT_TYPES: readonly ContentType[] = ['artikel', 'opdracht', 'audio', 'video']

// ─── Rij-type ───────────────────────────────────────────────────────────────
export interface CoachingContent {
  id: string
  coach_id: string
  /** NULL = voor alle klanten van de coach; gevuld = één specifieke klant. */
  klant_id: string | null
  titel: string
  inhoud: string
  pijler: Pijler
  type: ContentType
  media_url: string | null
  gepubliceerd: boolean
  aangemaakt_op: string
  bijgewerkt_op: string
}

// ─── Labels ─────────────────────────────────────────────────────────────────
export const PIJLER_LABELS: Record<Pijler, string> = {
  body:        PIJLER_INFO.body.label,
  mind:        PIJLER_INFO.mind.label,
  performance: PIJLER_INFO.performance.label,
}

export const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  artikel:  'Artikel',
  opdracht: 'Opdracht',
  audio:    'Audio',
  video:    'Video',
}

// Kleuren afgeleid uit de centrale pijler-tokens — nooit hex hardcoden.
export const PIJLER_STIJL: Record<Pijler, { bg: string; color: string }> = {
  body:        { bg: PIJLER_INFO.body.accentBgToken,        color: PIJLER_INFO.body.kleurToken },
  mind:        { bg: PIJLER_INFO.mind.accentBgToken,        color: PIJLER_INFO.mind.kleurToken },
  performance: { bg: PIJLER_INFO.performance.accentBgToken, color: PIJLER_INFO.performance.kleurToken },
}

// ─── Validatie-helpers (gedeeld client + server) ────────────────────────────
// isPijler wordt hierboven ge-re-exporteerd uit ./pijlers.
export function isContentType(waarde: unknown): waarde is ContentType {
  return typeof waarde === 'string' && (CONTENT_TYPES as readonly string[]).includes(waarde)
}

/** Beschrijft voor wie de content bedoeld is (voor badges in de UI). */
export function doelgroepOmschrijving(content: Pick<CoachingContent, 'klant_id'>): string {
  return content.klant_id === null ? 'Alle klanten' : 'Deze klant'
}
