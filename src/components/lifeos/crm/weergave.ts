// ─── LifeOS — CRM: bord-weergave (zoeken, filteren, sorteren) ───────────────
// Puur, geen React: een lijst personen + een weergavekeuze erin, een gefilterde/
// gesorteerde lijst eruit. Zo blijft `GroepBord` compositie en is de logica
// testbaar zonder DOM.
//
// De filter reduceert de set (zoeken + "alleen opvolgen"); de sortering bepaalt
// de volgorde BINNEN een kolom. `GroepBord` past ze in die volgorde toe: eerst
// bordbreed filteren, dan per statuskolom sorteren.

import type { Persoon } from '@/lib/lifeos/crm/crm'
import { followUpLabel } from './followUp'

export type Sortering = 'handmatig' | 'naam' | 'follow_up' | 'laatst_contact'

export interface SorteringDef {
  key: Sortering
  label: string
}

/** De keuzes voor het sorteer-menu, op volgorde. `handmatig` = je eigen sleepvolgorde. */
export const SORTERINGEN: readonly SorteringDef[] = Object.freeze([
  { key: 'handmatig', label: 'Handmatig (sleepvolgorde)' },
  { key: 'naam', label: 'Naam (A–Z)' },
  { key: 'follow_up', label: 'Follow-up eerst' },
  { key: 'laatst_contact', label: 'Langst geen contact' },
])

export interface WeergaveKeuze {
  /** Vrije tekst — matcht naam, e-mail, telefoon en bijzonderheden. */
  zoek: string
  /** Alleen wie vandaag/te laat opgevolgd moet worden. */
  alleenOpvolgen: boolean
  sortering: Sortering
}

export const LEGE_WEERGAVE: WeergaveKeuze = Object.freeze({
  zoek: '',
  alleenOpvolgen: false,
  sortering: 'handmatig',
})

/** Matcht de zoekterm tegen de doorzoekbare velden van één persoon. */
function komtOvereen(p: Persoon, term: string): boolean {
  const velden = [p.naam, p.email, p.telefoon, p.bijzonderheden]
  return velden.some((v) => v != null && v.toLowerCase().includes(term))
}

/** Heeft deze persoon een follow-up die vandaag of eerder viel? */
function moetOpvolgen(p: Persoon, vandaag: Date | null): boolean {
  if (!p.followUpDatum) return false
  return followUpLabel(p.followUpDatum, vandaag)?.dringend === true
}

/**
 * Bordbrede filter: zoeken + "alleen opvolgen". Behoudt de invoervolgorde; de
 * sortering gebeurt daarna per kolom in `sorteerPersonen`.
 */
export function filterPersonen(
  personen: readonly Persoon[],
  keuze: WeergaveKeuze,
  vandaag: Date | null,
): Persoon[] {
  const term = keuze.zoek.trim().toLowerCase()
  return personen.filter((p) => {
    if (term.length > 0 && !komtOvereen(p, term)) return false
    if (keuze.alleenOpvolgen && !moetOpvolgen(p, vandaag)) return false
    return true
  })
}

/** Een epoch-ms sleutel voor een YYYY-MM-DD dag; null (geen dag) sorteert achteraan. */
function dagWaarde(sleutel: string | null): number {
  if (!sleutel) return Number.POSITIVE_INFINITY
  const t = new Date(sleutel).getTime()
  return Number.isNaN(t) ? Number.POSITIVE_INFINITY : t
}

/** Epoch-ms van een ISO-contactmoment; nooit-gesproken sorteert vooraan (`-∞`). */
function contactWaarde(iso: string | null): number {
  if (!iso) return Number.NEGATIVE_INFINITY
  const t = new Date(iso).getTime()
  return Number.isNaN(t) ? Number.NEGATIVE_INFINITY : t
}

/**
 * Sorteert de personen van ÉÉN kolom volgens de keuze. Puur en stabiel: werkt op
 * een kopie, muteert de invoer niet.
 *   handmatig      — je eigen sleepvolgorde (`sortering`, oplopend)
 *   naam           — alfabetisch (NL-collatie)
 *   follow_up      — vroegste follow-up eerst, geen follow-up achteraan
 *   laatst_contact — langst geen contact eerst (nooit-gesproken bovenaan)
 * Gelijke sleutels vallen terug op `sortering` zodat de volgorde deterministisch blijft.
 */
export function sorteerPersonen(personen: readonly Persoon[], sortering: Sortering): Persoon[] {
  const lijst = [...personen]
  const opSortering = (a: Persoon, b: Persoon) => a.sortering - b.sortering

  switch (sortering) {
    case 'naam':
      return lijst.sort((a, b) => a.naam.localeCompare(b.naam, 'nl') || opSortering(a, b))
    case 'follow_up':
      return lijst.sort((a, b) => dagWaarde(a.followUpDatum) - dagWaarde(b.followUpDatum) || opSortering(a, b))
    case 'laatst_contact':
      return lijst.sort((a, b) => contactWaarde(a.laatsteContactOp) - contactWaarde(b.laatsteContactOp) || opSortering(a, b))
    case 'handmatig':
    default:
      return lijst.sort(opSortering)
  }
}
