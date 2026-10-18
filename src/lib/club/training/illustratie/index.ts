// ─── Fit Factory Club, illustraties: publieke ingang (PUUR) ─────────────────
// Eigen oefenillustraties in code (prototype naast de RepDB-beelden).

import { PROTOTYPE_OEFENINGEN } from './oefeningen'
import { animatie, standOp, type Animatie, type Stand } from './scene'
import type { Oefening } from './typen'

export { PROTOTYPE_OEFENINGEN }
export type { Animatie, Oefening, Stand }

const cache = new Map<string, Animatie>()

/** De animatie van een oefening (een keer uitgerekend per oefening). */
export function animatieVan(o: Oefening): Animatie {
  const bekend = cache.get(o.naam)
  if (bekend) return bekend
  const a = animatie(o)
  cache.set(o.naam, a)
  return a
}

/** De stilstaande begin- of eindhouding. */
export function houdingVan(o: Oefening, welke: 'begin' | 'eind'): Stand {
  return standOp(o, welke === 'begin' ? 0 : 1)
}

export function oefeningOpNaam(naam: string): Oefening | undefined {
  return PROTOTYPE_OEFENINGEN.find((o) => o.naam === naam)
}
