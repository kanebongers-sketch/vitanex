// ─── Club, challenges: de stand kort onthouden voor de ledenapp (PUUR) ──────
// De stand van een challenge rekent met alle deelnemers en hun momenten. In de
// ledenapp opent elk lid de Voortgang-tab; zonder geheugen rekent de server de
// hele stand per lid opnieuw uit. Hier wordt de stand per challenge een minuut
// onthouden (in het geheugen van de server, per sportschool), zodat honderd
// leden samen een keer de database lezen. Een leesfout wordt niet onthouden.
// Elke wijziging aan de challenge (doel, periode, vestigingen) geeft een
// nieuwe sleutel, dus nooit een stand van een oude instelling.

import type { Challenge } from './model'
import type { Stand } from './voortgang'

/** Zo lang blijft een stand bruikbaar. */
export const STAND_TTL_MS = 60_000
/** Zoveel challenges hoogstens tegelijk in het geheugen. */
export const STAND_MAX = 300
/** Zoveel plekken van de stand gaan naar de ledenapp (plus het lid zelf). */
export const STAND_TOP = 10

/** De sleutel: sportschool, challenge en alles wat de stand verandert. */
export function standSleutel(userId: string, c: Challenge): string {
  return [userId, c.id, c.soort, c.doel, c.start, c.eind, c.gestoptOp ?? '', c.deelname, [...c.vestigingen].sort().join(',')].join('|')
}

interface Item<T> {
  tot: number
  waarde: Promise<T | null>
}

export interface StandCache<T> {
  /** Geeft de onthouden waarde, of laadt hem (gelijktijdige vragen delen een keer laden). */
  haal: (sleutel: string, laad: () => Promise<T | null>) => Promise<T | null>
  grootte: () => number
}

export function maakStandCache<T>(klok: () => number = Date.now, ttl = STAND_TTL_MS, max = STAND_MAX): StandCache<T> {
  const items = new Map<string, Item<T>>()
  const ruimOp = (nu: number) => {
    for (const [k, v] of items) if (v.tot <= nu) items.delete(k)
    // Nog te vol: de oudste eruit (een Map houdt de volgorde van toevoegen aan).
    while (items.size >= max) {
      const oudste = items.keys().next().value
      if (oudste === undefined) break
      items.delete(oudste)
    }
  }
  return {
    haal: (sleutel, laad) => {
      const nu = klok()
      const oud = items.get(sleutel)
      if (oud && oud.tot > nu) return oud.waarde
      ruimOp(nu)
      const waarde = laad().catch(() => null)
      const item = { tot: nu + ttl, waarde }
      items.set(sleutel, item)
      // Een fout niet onthouden: de volgende vraag probeert het opnieuw.
      void waarde.then((w) => {
        if (w === null && items.get(sleutel) === item) items.delete(sleutel)
      })
      return waarde
    },
    grootte: () => items.size,
  }
}

/** De top van de stand plus de plek van het lid zelf: meer heeft de ledenapp niet nodig. */
export function standVoorLid(stand: readonly Stand[], lidId: string, top = STAND_TOP): Stand[] {
  const bovenaan = stand.slice(0, top)
  if (bovenaan.some((s) => s.lidId === lidId)) return bovenaan
  const ik = stand.find((s) => s.lidId === lidId)
  return ik ? [...bovenaan, ik] : bovenaan
}
