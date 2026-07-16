// ─── LifeOS — welke staat toont de Vita-kaart? ──────────────────────────────
// Deze keuze is de belangrijkste van de hele kaart, en daarom staat hij hier:
// puur, apart en getest — niet als een reeks ternaries in een render.
//
// Er zijn precies vier uitkomsten, en ze sluiten elkaar uit. Het onderscheid dat
// telt is dat tussen "er is niets" en "ik kon niet kijken". Die twee zien er in
// data identiek uit (allebei: geen rijen) en betekenen het tegenovergestelde.
// In MentaForce liepen ze door elkaar en vertelde een netwerkstoring de
// gebruiker doodleuk dat hij niets gemeten had.
//
// Puur bestand: geen React, geen fetch. Zo is de regel te bewijzen in plaats van
// af te spreken.

import type { Signaal } from './signalen'

/** Wat de server teruggeeft op /api/vita/signalen. */
export interface SignalenAntwoord {
  signalen: Signaal[]
  /** Is er überhaupt iets van deze gebruiker gemeten? */
  gemeten: boolean
  /** Bronnen die door een storing ontbreken. */
  bronnenMetFout: string[]
}

export type Weergave =
  /** Er ging iets mis. Nooit te verwarren met leegte. */
  | { soort: 'fout'; melding: string }
  /** Er is echt niets gemeten, en alles is opgehaald. Dan mag je dat zeggen. */
  | { soort: 'niets-gemeten' }
  /** Wel data, geen signalen. Een antwoord, geen leegte. */
  | { soort: 'rustig'; bronnenMetFout: string[] }
  /** Wel data, wel signalen. */
  | { soort: 'signalen'; signalen: Signaal[]; bronnenMetFout: string[] }

/**
 * Kiest de staat van de kaart.
 *
 * De volgorde van de takken is de hele functie:
 *
 *   1. niets gemeten + een gevallen bron  → FOUT. We weten niet óf er niets is.
 *   2. niets gemeten + alles opgehaald    → niets-gemeten. Nu mag je dat zeggen.
 *   3. wel data, geen signalen            → rustig.
 *   4. wel data, wel signalen             → signalen.
 *
 * Draai 1 en 2 niet om. Dan verkoopt een storing zichzelf als een leeg leven.
 */
export function kiesWeergave(antwoord: SignalenAntwoord): Weergave {
  const { signalen, gemeten, bronnenMetFout } = antwoord

  if (!gemeten && bronnenMetFout.length > 0) {
    return { soort: 'fout', melding: `Ik kon je ${bronnenMetFout.join(' en ')} niet ophalen.` }
  }
  if (!gemeten) return { soort: 'niets-gemeten' }
  if (signalen.length === 0) return { soort: 'rustig', bronnenMetFout }
  return { soort: 'signalen', signalen, bronnenMetFout }
}
