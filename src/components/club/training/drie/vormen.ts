// ─── Fit Factory Club, 3D-oefenbeelden: basisvormen ─────────────────────────
// Ledematen zijn gladde draaivormen (lathe) met afgeronde uiteinden, zodat ze
// bij de gewrichten naadloos in elkaar overlopen. Geen externe modellen.

import { LatheGeometry, SphereGeometry, Vector2, type BufferGeometry } from 'three'

/** Profiel: punten [fractie van de lengte, straal]. */
export type Profiel = readonly (readonly [number, number])[]

function straalOp(profiel: Profiel, t: number): number {
  for (let i = 1; i < profiel.length; i++) {
    const [t0, r0] = profiel[i - 1]
    const [t1, r1] = profiel[i]
    if (t <= t1) {
      const s = (t - t0) / (t1 - t0 || 1)
      const glad = s * s * (3 - 2 * s)
      return r0 + (r1 - r0) * glad
    }
  }
  return profiel[profiel.length - 1][1]
}

/**
 * Een spoelvorm langs +y van 0 tot `lengte`, met halve bollen aan beide kanten
 * (die steken over het gewricht heen en vullen de naad).
 */
export function spoel(profiel: Profiel, lengte: number, rondingen = 28): BufferGeometry {
  const punten: Vector2[] = []
  const r0 = profiel[0][1]
  const r1 = profiel[profiel.length - 1][1]
  const kap = 8
  for (let i = 0; i <= kap; i++) {
    const a = (i / kap) * (Math.PI / 2)
    punten.push(new Vector2(Math.sin(a) * r0 + 1e-4, -Math.cos(a) * r0 * 0.7))
  }
  const stappen = 18
  for (let i = 1; i < stappen; i++) {
    const t = i / stappen
    punten.push(new Vector2(straalOp(profiel, t), t * lengte))
  }
  for (let i = 0; i <= kap; i++) {
    const a = (i / kap) * (Math.PI / 2)
    punten.push(new Vector2(Math.cos(a) * r1 + 1e-4, lengte + Math.sin(a) * r1 * 0.7))
  }
  return new LatheGeometry(punten, rondingen)
}

/**
 * Alle geometrie van een scene, zodat die bij het opruimen in een keer weg kan.
 * Elke scene heeft een eigen bak (meerdere canvassen op een pagina delen niets).
 */
export class GeoBak {
  private readonly alles: BufferGeometry[] = []
  private readonly bollen = new Map<number, BufferGeometry>()

  houd<T extends BufferGeometry>(g: T): T {
    this.alles.push(g)
    return g
  }

  /** Een eenheidsbol (straal 1), te schalen tot ellipsoide. */
  bol(detail = 32): BufferGeometry {
    const bekend = this.bollen.get(detail)
    if (bekend) return bekend
    const g = this.houd(new SphereGeometry(1, detail, Math.round(detail * 0.75)))
    this.bollen.set(detail, g)
    return g
  }

  spoel(profiel: Profiel, lengte: number): BufferGeometry {
    return this.houd(spoel(profiel, lengte))
  }

  ruimOp(): void {
    for (const g of this.alles) g.dispose()
    this.alles.length = 0
    this.bollen.clear()
  }
}
