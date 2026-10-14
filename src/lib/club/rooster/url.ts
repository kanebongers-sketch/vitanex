// ─── Fit Factory Club, rooster: de staat in de URL (PUUR) ───────────────────
// Week, filters en de geopende les staan in de zoekparameters, zodat elke
// weergave deelbaar is en terug/vooruit werkt.

import { isUuid } from './invoer'
import type { RoosterFilters } from './raster'

export interface RoosterStaat extends RoosterFilters {
  v: string
  week: string | null
  les: string | null
}

export type RuweParams = Record<string, string | string[] | undefined>

function een(v: string | string[] | undefined): string | null {
  const w = Array.isArray(v) ? v[0] : v
  return typeof w === 'string' && w !== '' ? w : null
}

/** De rooster-staat uit de zoekparameters; ongeldige ids vallen weg. */
export function leesRoosterStaat(p: RuweParams, vestiging: string): RoosterStaat {
  const id = (k: string) => {
    const w = een(p[k])
    return isUuid(w) ? w : null
  }
  const week = een(p.week)
  return {
    v: vestiging,
    week: week && /^\d{4}-W\d{2}$/.test(week) ? week : null,
    les: id('les'),
    zaal: id('zaal'),
    lestype: id('type'),
    instructeur: id('instructeur'),
  }
}

/** Een rooster-URL met wijzigingen; null haalt een parameter weg. */
export function roosterHref(staat: RoosterStaat, wijziging: Partial<RoosterStaat> = {}): string {
  const s = { ...staat, ...wijziging }
  const p = new URLSearchParams({ v: s.v })
  if (s.week) p.set('week', s.week)
  if (s.zaal) p.set('zaal', s.zaal)
  if (s.lestype) p.set('type', s.lestype)
  if (s.instructeur) p.set('instructeur', s.instructeur)
  if (s.les) p.set('les', s.les)
  return `/clubkane/rooster?${p.toString()}`
}
