// ─── Fit Factory Club, illustraties: hulp bij het schrijven van houdingen ───
// Korte schrijfwijzen zodat elke houding leesbaar blijft als data.

import type { ArmHouding, BeenHouding, Doel, MateriaalHouding, ZijHouding } from '../typen'
import { v, type Vec } from '../vec'

/** Vloer op y = 0; de enkel staat 7,5 cm boven de vloer als de voet plat staat. */
export const ENKEL_Y = -7.5

export function arm(schouder: number, elleboog = 0): ArmHouding {
  return { hoeken: { schouder, elleboog } }
}

export function armNaar(doel: Doel, buig: 1 | -1, lengte?: readonly [number, number]): ArmHouding {
  return lengte ? { doel, buig, lengte } : { doel, buig }
}

export function been(heup: number, knie: number, voet = 90): BeenHouding {
  return { hoeken: { heup, knie, voet } }
}

export function beenNaar(doel: Doel, buig: 1 | -1, voet = 90, bal = false): BeenHouding {
  return bal ? { doel, buig, voet, bal } : { doel, buig, voet }
}

export function wereld(x: number, y: number): Doel {
  return { wereld: v(x, y) }
}

export function aan(materiaal: string, punt = 'greep', verschuif?: Vec): Doel {
  return verschuif ? { materiaal, punt, verschuif } : { materiaal, punt }
}

/** Een zijhouding met neutrale wervelkolom; geef alleen wat afwijkt. */
export function zij(h: Partial<ZijHouding> & Pick<ZijHouding, 'armNabij' | 'beenNabij' | 'anker'> & { materiaal?: readonly MateriaalHouding[] }): ZijHouding {
  return {
    aanzicht: 'zij',
    bekken: 0,
    lumbaal: 0,
    thoracaal: 0,
    hoofd: 0,
    schouderblad: 0,
    armVer: h.armNabij,
    beenVer: h.beenNabij,
    materiaal: [],
    ...h,
  }
}
