// ─── Club, meldingen: de meldingen in de ledenapp (PUUR) ────────────────────
// Wat de lijst in de app toont. Gedeeld door de server (lezen) en het
// component LedenappMeldingen.

import { isSoort, type Soort } from './soorten'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { COMMUNITY } from '@/lib/aiyourgym/taal/woorden/club/community'

export interface LedenappMelding {
  id: string
  soort: Soort
  onderwerp: string
  inhoud: string
  /** Wanneer de melding in de lijst kwam (ISO). */
  op: string
  gelezen: boolean
}

export const LEDENAPP_KOLOMMEN = 'id, soort, onderwerp, inhoud, verstuurd_op, gelezen_op'

/** Systeemgrens: een databaserij naar een melding, of null. */
export function ledenappMeldingUitRij(rij: unknown): LedenappMelding | null {
  if (typeof rij !== 'object' || rij === null) return null
  const r = rij as Record<string, unknown>
  if (typeof r.id !== 'string' || !isSoort(r.soort) || typeof r.onderwerp !== 'string' || typeof r.inhoud !== 'string') return null
  if (typeof r.verstuurd_op !== 'string' || Number.isNaN(Date.parse(r.verstuurd_op))) return null
  return { id: r.id, soort: r.soort, onderwerp: r.onderwerp, inhoud: r.inhoud, op: r.verstuurd_op, gelezen: typeof r.gelezen_op === 'string' }
}

/** "zojuist", "12 minuten geleden", "3 uur geleden", "gisteren", "4 dagen geleden". */
export function geledenLabel(op: string, nu: Date, taal: Taal = 'nl'): string {
  const t = COMMUNITY[taal].geleden
  const min = Math.max(0, Math.floor((nu.getTime() - Date.parse(op)) / 60_000))
  if (min < 2) return t.zojuist
  if (min < 60) return t.minuten(min)
  const uur = Math.floor(min / 60)
  if (uur < 24) return t.uur(uur)
  const dagen = Math.floor(uur / 24)
  if (dagen === 1) return t.gisteren
  return t.dagen(dagen)
}
