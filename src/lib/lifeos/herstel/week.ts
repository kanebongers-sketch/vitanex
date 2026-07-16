// ─── LifeOS — een week herstel, per dag samengevoegd ───────────────────────
// Puur bestand: geen fetch, geen DB. Groepeert de opgeslagen metingen per dag
// en laat `voegSamen()` uit `herstel.ts` het werk doen.

import {
  leverancierScoreVergelijkbaar,
  voegSamen,
  type HerstelBron,
  type HerstelMeting,
} from './herstel'
import type { IsoDatum } from './tijd'

/** De meetvelden waarvan we de herkomst kunnen tonen. */
export type MeetVeld =
  | 'hrvMs'
  | 'rustHartslag'
  | 'slaapMinuten'
  | 'slaapEfficientie'
  | 'leverancierScore'

/** Welke bron elk cijfer draagt. Null = dat veld is niet gemeten. */
export type Herkomst = Record<MeetVeld, HerstelBron | null>

export interface HerstelDag {
  datum: IsoDatum
  /** Null als geen enkele bron deze dag iets stuurde. */
  samen: HerstelMeting | null
  herkomst: Herkomst
  /** Welke bronnen deze dag data leverden. Leeg = niets gemeten. */
  bronnen: HerstelBron[]
}

const VELDEN: readonly MeetVeld[] = [
  'hrvMs',
  'rustHartslag',
  'slaapMinuten',
  'slaapEfficientie',
  'leverancierScore',
]

const GEEN_HERKOMST: Herkomst = {
  hrvMs: null,
  rustHartslag: null,
  slaapMinuten: null,
  slaapEfficientie: null,
  leverancierScore: null,
}

/**
 * Bepaalt welke bron een samengevoegd cijfer levert.
 *
 * We leiden dit af via de publieke API van `herstel.ts` in plaats van de
 * rangorde (`BRON_RANG`) hier over te typen. Die is intern en niet
 * geëxporteerd; 'm dupliceren zou betekenen dat een wijziging daar deze module
 * stilletjes laat liegen over de herkomst.
 *
 * De truc: filter de kandidaten op wie exact deze waarde levert, en laat
 * `voegSamen()` uit díé kandidaten de leidende bron aanwijzen. Zijn meerdere
 * bronnen het eens over een waarde, dan is het antwoord sowieso waar — en het
 * is precies dezelfde bron die `voegSamen` voor dat veld koos.
 */
export function bronVanVeld(
  metingen: readonly HerstelMeting[],
  veld: MeetVeld,
  waarde: number | null,
): HerstelBron | null {
  if (waarde === null) return null

  let kandidaten = metingen.filter((m) => m[veld] === waarde)

  // De leverancier-score mag alleen van een bron komen die er een vergelijkbare
  // geeft. Zonder deze filter zou een Garmin met toevallig hetzelfde getal als
  // herkomst van Whoop's recovery worden aangewezen.
  if (veld === 'leverancierScore') {
    kandidaten = kandidaten.filter((m) => leverancierScoreVergelijkbaar(m.bron))
  }

  if (kandidaten.length === 0) return null

  const eerste = kandidaten[0]
  if (kandidaten.length === 1 && eerste !== undefined) return eerste.bron

  return voegSamen(kandidaten)?.bron ?? null
}

/** De herkomst van elk veld van een samengevoegde meting. */
export function herkomstVan(
  metingen: readonly HerstelMeting[],
  samen: HerstelMeting | null,
): Herkomst {
  if (samen === null) return { ...GEEN_HERKOMST }

  const uit = { ...GEEN_HERKOMST }
  for (const veld of VELDEN) {
    uit[veld] = bronVanVeld(metingen, veld, samen[veld])
  }
  return uit
}

/**
 * Eén `HerstelDag` per gevraagde dag — óók voor dagen zonder metingen.
 *
 * Een dag zonder data valt bewust niet weg: "je hebt donderdag niets gemeten"
 * is informatie, en een lijst die stilzwijgend korter wordt, laat een gat
 * lijken op iets dat er nooit was.
 */
export function groepeerPerDag(
  metingen: readonly HerstelMeting[],
  dagen: readonly IsoDatum[],
): HerstelDag[] {
  const perDag = new Map<IsoDatum, HerstelMeting[]>()
  for (const m of metingen) {
    const bestaand = perDag.get(m.datum)
    if (bestaand === undefined) perDag.set(m.datum, [m])
    else bestaand.push(m)
  }

  return dagen.map((datum) => {
    const vanDag = perDag.get(datum) ?? []
    const samen = voegSamen(vanDag)
    return {
      datum,
      samen,
      herkomst: herkomstVan(vanDag, samen),
      bronnen: vanDag.map((m) => m.bron),
    }
  })
}

/** De meest recente dag met een échte meting, of null. */
export function laatsteGemeten(dagen: readonly HerstelDag[]): HerstelDag | null {
  for (let i = dagen.length - 1; i >= 0; i--) {
    const dag = dagen[i]
    if (dag !== undefined && dag.samen !== null && heeftMeting(dag.samen)) return dag
  }
  return null
}

/** Heeft deze meting ook maar één ingevuld veld? Anders is het een lege huls. */
export function heeftMeting(m: HerstelMeting): boolean {
  return VELDEN.some((veld) => m[veld] !== null)
}
