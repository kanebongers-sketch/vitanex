// ─── XP-teksten in de taal van de gebruiker ──────────────────────────────────
// De niveaunamen en mijlpalen staan als Nederlandse bron in lib/xp. Wat op de
// voortgangspagina's in beeld komt, vertalen we via het woordenboek `voortgang`.
// Een onbekend mijlpaal-id tonen we zoals het uit de bron komt.

import { ALLE_ACHIEVEMENTS, LEVEL_NAMEN, type Achievement } from '@/lib/xp/xp'
import type { Params } from '@/lib/i18n/vertaal'

type Vertaler = (sleutel: string, params?: Params) => string

const BEKENDE_MIJLPALEN: ReadonlySet<string> = new Set(ALLE_ACHIEVEMENTS.map((a) => a.id))

/** Naam van een niveau (1 t/m 10); leeg voor een niveau buiten de schaal. */
export function levelNaam(level: number, t: Vertaler): string {
  if (!LEVEL_NAMEN[level]) return ''
  return t(`voortgang.levels.${level}`)
}

export function mijlpaalNaam(mijlpaal: Pick<Achievement, 'id' | 'naam'>, t: Vertaler): string {
  return BEKENDE_MIJLPALEN.has(mijlpaal.id) ? t(`voortgang.mijlpaal.${mijlpaal.id}.naam`) : mijlpaal.naam
}

export function mijlpaalBeschrijving(mijlpaal: Pick<Achievement, 'id' | 'beschrijving'>, t: Vertaler): string {
  return BEKENDE_MIJLPALEN.has(mijlpaal.id) ? t(`voortgang.mijlpaal.${mijlpaal.id}.beschrijving`) : mijlpaal.beschrijving
}
