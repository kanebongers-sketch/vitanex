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

/** Wat we weten over de proactieve dagbriefing. */
export interface Dagbriefing {
  /**
   * ISO-moment van de laatste ÉCHT bezorgde briefing, of `null` = nog nooit
   * bezorgd. Komt uit `vita_briefingen` — het logboek van wat er verstuurd is.
   */
  laatstBezorgdOp: string | null
}

/** Wat de server teruggeeft op /api/vita/signalen. */
export interface SignalenAntwoord {
  signalen: Signaal[]
  /** Is er überhaupt iets van deze gebruiker gemeten? */
  gemeten: boolean
  /** Bronnen die door een storing ontbreken. */
  bronnenMetFout: string[]
  /**
   * `null` of afwezig = we konden het niet nagaan (oude client, gevallen query).
   * Dan beloven we niets — zie `meekijkTekst`.
   */
  dagbriefing?: Dagbriefing | null
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

// ─── De belofte ─────────────────────────────────────────────────────────────
// Hier stond de enige regel in LifeOS die aantoonbaar loog:
//
//   "Ik blijf meekijken en tik je aan zodra er iets verandert."
//
// Er was geen cron, geen polling, geen push. Vita draaide alleen als Kane de
// pagina opende. De zin klonk als een eigenschap van het product en was een wens.
//
// Nu is er wél een dagbriefing (`/api/cron/lifeos-briefing`). Maar een cron die in
// de codebase STAAT is niet hetzelfde als een cron die DRAAIT: hij hangt aan een
// GitHub-secret, een env-var en een workflow die iemand moet aanzetten. Zou deze
// tekst afgaan op het bestaan van dat bestand, dan hadden we de leugen alleen
// verplaatst — van "we gaan het bouwen" naar "we hebben het gebouwd".
//
// Daarom keyt de zin op BEWIJS: `laatstBezorgdOp` komt uit `vita_briefingen`, en
// daar staat alleen in wat écht verstuurd is. Geen bewijs → geen belofte.

/**
 * Hoe lang een bezorgde briefing als bewijs telt dat de dagbriefing loopt.
 *
 * 48 uur, niet 24: GitHub-cron loopt soms uit en kan een run overslaan. Op 24 uur
 * zou één overgeslagen ochtend de kaart laten zeggen dat de briefing niet loopt,
 * terwijl hij morgen gewoon weer komt. Ruimer dan dit mag niet — dan blijft de
 * belofte staan terwijl er al dagen niets komt, en dan liegt hij weer.
 */
const BRIEFING_VERS_MS = 48 * 60 * 60 * 1000

/**
 * Is er bewijs dat de dagbriefing echt loopt?
 *
 * `false` bij twijfel: geen veld, geen datum, onleesbare datum, of te lang
 * geleden. Twijfel levert stilte op, geen belofte.
 */
export function looptDagbriefing(
  dagbriefing: Dagbriefing | null | undefined,
  nu: Date,
): boolean {
  const op = dagbriefing?.laatstBezorgdOp
  if (typeof op !== 'string') return false

  const moment = new Date(op)
  if (Number.isNaN(moment.getTime())) return false

  const geleden = nu.getTime() - moment.getTime()
  // Een tijdstempel uit de toekomst is geen bewijs maar een kapotte klok.
  if (geleden < 0) return false
  return geleden <= BRIEFING_VERS_MS
}

/**
 * Wat de kaart onder "niets dat nu je aandacht vraagt" mag zeggen.
 *
 * Twee zinnen, en het verschil is of Vita je écht heeft aangetikt. De tweede is
 * geen excuus maar de waarheid: zonder briefing kijkt hij pas mee als je opent.
 */
export function meekijkTekst(dagbriefing: Dagbriefing | null | undefined, nu: Date): string {
  return looptDagbriefing(dagbriefing, nu)
    ? "Ik kijk mee als je LifeOS opent, en 's ochtends stuur ik je je dagbriefing."
    : 'Ik kijk mee op het moment dat je LifeOS opent. Uit mezelf tik ik je nu nog niet aan.'
}
