// ─── Fit Factory Club, illustraties: vectoren en assenstelsels (PUUR) ───────
// Alles in SVG-coordinaten: x naar rechts, y naar beneden, 1 eenheid = 1 cm
// (een figuur is ongeveer 178 hoog). Hoeken in graden, absoluut gemeten vanaf
// "recht omhoog", met de klok mee positief: 0 = omhoog, 90 = naar rechts
// (de kijkrichting van het figuur in zijaanzicht), 180 = omlaag.

export interface Vec {
  readonly x: number
  readonly y: number
}

/** Een assenstelsel langs een lichaamsdeel: oorsprong, richting (u) en normaal (n). */
export interface Assen {
  readonly o: Vec
  /** Eenheidsvector langs het deel. */
  readonly u: Vec
  /** Eenheidsvector dwars: u een kwartslag tegen de klok in gedraaid (op het scherm). */
  readonly n: Vec
  /** Absolute hoek van u in graden. */
  readonly hoek: number
}

export const RAD = Math.PI / 180

export function v(x: number, y: number): Vec {
  return { x, y }
}

export function plus(a: Vec, b: Vec): Vec {
  return { x: a.x + b.x, y: a.y + b.y }
}

export function min(a: Vec, b: Vec): Vec {
  return { x: a.x - b.x, y: a.y - b.y }
}

export function maal(a: Vec, f: number): Vec {
  return { x: a.x * f, y: a.y * f }
}

export function lengte(a: Vec): number {
  return Math.hypot(a.x, a.y)
}

export function afstand(a: Vec, b: Vec): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

export function mengV(a: Vec, b: Vec, t: number): Vec {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }
}

/** Eenheidsvector bij een absolute hoek (0 = omhoog, 90 = rechts). */
export function richting(hoek: number): Vec {
  return { x: Math.sin(hoek * RAD), y: -Math.cos(hoek * RAD) }
}

/** Absolute hoek van een vector (inverse van richting). */
export function hoekVan(a: Vec): number {
  return Math.atan2(a.x, -a.y) / RAD
}

export function assen(o: Vec, hoek: number): Assen {
  const u = richting(hoek)
  return { o, u, n: { x: -u.y, y: u.x }, hoek }
}

/** Een punt in een assenstelsel: `langs` in de richting u, `dwars` in de richting n. */
export function punt(a: Assen, langs: number, dwars: number): Vec {
  return { x: a.o.x + a.u.x * langs + a.n.x * dwars, y: a.o.y + a.u.y * langs + a.n.y * dwars }
}

/** Het eindpunt van een deel met deze lengte. */
export function eind(a: Assen, l: number): Vec {
  return punt(a, l, 0)
}
