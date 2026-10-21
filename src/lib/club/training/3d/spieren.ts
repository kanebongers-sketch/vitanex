// ─── Fit Factory Club, 3D-oefenbeelden: werkende spieren (PUUR) ─────────────
// Per oefening de primaire spieren (volle accentkleur) en de secundaire spieren
// (zachter). Het tekenen vraagt per lichaamsdeel een sterkte op met
// `spierSterkte()`; zo hoeft het tekenen niets van primair of secundair te weten.
//
// Delen die het tekenen (nog) niet als eigen zone kent, lichten op via een
// reservedeel. Inmiddels heeft elk deel een eigen zone (hamstring op de
// achterkant van de dij, onderrug op de rugstrekkers), dus de lijst is leeg; een
// nieuw deel zonder zone komt hier tijdelijk bij.

import type { Lichaamsdeel, Oefening3d } from './typen'

/** Sterkte van de accentkleur: primair vol, secundair zachter. */
export const SPIER_STERKTE = { primair: 1, secundair: 0.45 } as const

/** Delen die het tekenen nog niet los kent, met het deel dat in hun plaats oplicht. */
export const SPIER_RESERVE: Readonly<Partial<Record<Lichaamsdeel, Lichaamsdeel>>> = {}

type SpierBron = Pick<Oefening3d, 'spieren' | 'spierenSecundair'>

/** Sterkte van 0 tot 1 waarmee een lichaamsdeel oplicht (0 = werkt niet). */
export function spierSterkte(o: SpierBron, deel: Lichaamsdeel): number {
  let sterkte = 0
  for (const d of o.spieren) {
    if (d === deel || SPIER_RESERVE[d] === deel) sterkte = Math.max(sterkte, SPIER_STERKTE.primair)
  }
  for (const d of o.spierenSecundair ?? []) {
    if (d === deel || SPIER_RESERVE[d] === deel) sterkte = Math.max(sterkte, SPIER_STERKTE.secundair)
  }
  return sterkte
}

/**
 * De delen die het tekenen vol laat oplichten: de primaire spieren plus hun
 * reservedeel. Secundaire spieren staan hier niet in (die lichten zachter op via
 * `spierSterkte`).
 */
export function getekendeSpieren(o: SpierBron): readonly Lichaamsdeel[] {
  const uit = new Set<Lichaamsdeel>()
  for (const d of o.spieren) {
    uit.add(d)
    const reserve = SPIER_RESERVE[d]
    if (reserve) uit.add(reserve)
  }
  return [...uit]
}

/**
 * Sterkte per getekend deel (primair 1, secundair lager), voor het palet van het
 * tekenen. Delen die niet werken staan er niet in.
 */
export function spierSterktes(o: SpierBron): Partial<Record<Lichaamsdeel, number>> {
  const uit: Partial<Record<Lichaamsdeel, number>> = {}
  for (const d of [...o.spieren, ...(o.spierenSecundair ?? [])]) {
    for (const deel of [d, SPIER_RESERVE[d]]) {
      if (deel) uit[deel] = spierSterkte(o, deel)
    }
  }
  return uit
}
