// ─── Fit Factory Club, training: beelden bij oefeningen (PUUR) ──────────────
// Sinds 28-10-2026 (besluit Kane) heeft elke kiesbare standaardoefening een
// eigen Blender-render met rep-speler (blender-bibliotheek.ts, render-bron.ts).
// Dit bestand gaat over de oude illustraties, die alleen nog staan bij
// gearchiveerde oefeningen in bestaande schema's en bij eigen oefeningen:
// RepDB (webp-illustraties, zie beelden-repdb.ts) en Everkinetic
// (lijntekeningen, CC BY-SA 4.0, zie public/club/oefeningen/LICENSE.txt).
// Systeemgrens: alleen paden naar onze eigen mappen komen door. Het pad belandt
// in een CSS-masker en een <img>, dus niets anders mag erin.

import { isEnkeleHouding, isRepdbBeeldPad } from './beelden-repdb'
import { isBlenderOefening } from './blender-bibliotheek'

export type BeeldBronSoort = 'everkinetic' | 'repdb'

export interface OefeningBeelden {
  start: string
  eind: string
  /** Welke bron: bepaalt de weergave (masker of afbeelding) en de bronvermelding. */
  bron: BeeldBronSoort
  /** Maar een houding (start en eind hetzelfde beeld): stilstaand tonen, zonder wissel. */
  enkel: boolean
}

const EVERKINETIC_PAD = /^\/club\/oefeningen\/\d{4}-(?:start|eind)\.svg$/

export function isEverkineticPad(v: unknown): v is string {
  return typeof v === 'string' && EVERKINETIC_PAD.test(v)
}

/** Een pad naar een Everkinetic-SVG of een RepDB-webp in onze eigen map. */
export function isBeeldPad(v: unknown): v is string {
  return isEverkineticPad(v) || isRepdbBeeldPad(v)
}

/**
 * Beide houdingen uit een databaserij (beeld_start, beeld_eind, beeld_bron), of null.
 * De bron volgt uit de paden (die zijn gecontroleerd); beide houdingen moeten van dezelfde bron zijn.
 * Zolang migratie 395 niet is toegepast staan hier Everkinetic-paden en werkt alles zoals eerst.
 */
export function beeldenUitRij(rij: { beeld_start?: unknown; beeld_eind?: unknown; beeld_bron?: unknown }): OefeningBeelden | null {
  const { beeld_start: start, beeld_eind: eind } = rij
  if (isRepdbBeeldPad(start) && isRepdbBeeldPad(eind)) {
    return { start, eind, bron: 'repdb', enkel: start === eind || isEnkeleHouding(start) }
  }
  if (isEverkineticPad(start) && isEverkineticPad(eind)) return { start, eind, bron: 'everkinetic', enkel: start === eind }
  return null
}

/** Welke bronnen komen voor in deze beelden (voor de bronvermelding), in vaste volgorde. */
export function bronnenVan(beelden: readonly (OefeningBeelden | null | undefined)[]): BeeldBronSoort[] {
  const aanwezig = new Set(beelden.map((b) => b?.bron).filter((b) => b !== undefined))
  return (['repdb', 'everkinetic'] as const).filter((b) => aanwezig.has(b))
}

export const BEELD_KOLOMMEN = 'beeld_start, beeld_eind, beeld_bron'

/** De bronvermelding die de licentie vraagt. Overal waar de tekeningen staan. */
export const BEELD_BRON = {
  tekst: 'Illustraties: Everkinetic, CC BY-SA 4.0',
  bron: 'https://github.com/everkinetic/data',
  licentie: 'https://creativecommons.org/licenses/by-sa/4.0/deed.nl',
} as const

export interface BeeldTelling {
  met: number
  totaal: number
}

/** Heeft deze oefening een beeld: een eigen Blender-render of een oude illustratie? */
export function heeftOefenbeeld(o: { naam?: string; beeld: OefeningBeelden | null }): boolean {
  return o.beeld !== null || isBlenderOefening(o.naam)
}

export function telBeelden(oefeningen: readonly { naam?: string; beeld: OefeningBeelden | null }[]): BeeldTelling {
  return { met: oefeningen.filter(heeftOefenbeeld).length, totaal: oefeningen.length }
}
