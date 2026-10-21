// ─── Fit Factory Club, 3D-oefenbeelden: bouwsteen shoulder press machine (PUUR) ─
// De grepen van een shoulder press machine zitten aan twee hefbomen die draaien
// om een as achter en boven het hoofd. De handen volgen daardoor een boog om die
// as: onderin op schouderhoogte, halverwege iets naar voren, bovenin net niet
// gestrekt en iets naar binnen. Het materiaal (drie/materiaal-schouderpress)
// leest hier dezelfde as, zodat de hefboom altijd even lang is.

import type { HandRelatief } from './boven'

/** Maten van de machine ten opzichte van het linkerschoudergewricht (m); rechts gespiegeld. */
export const SCHOUDERPRESS = {
  /** Draaipunt van de linkerhefboom: buiten de schouder, boven en achter het hoofd. */
  draaipunt: { dx: 0.25, dy: 0.4025, dz: -0.45 },
  /** Greep onderin: op schouderhoogte, iets breder dan de schouders en voor het lichaam. */
  onder: { dx: 0.16, dy: 0.18, dz: 0.12 },
  /** Greep bovenin: armen bijna gestrekt boven de schouders. */
  boven: { dx: 0.09, dy: 0.625, dz: 0.12 },
} as const

/** Hoek van een greep om het draaipunt in het zijvlak (y, z). */
function hoekOm(p: HandRelatief): number {
  return Math.atan2(p.dy - SCHOUDERPRESS.draaipunt.dy, p.dz - SCHOUDERPRESS.draaipunt.dz)
}

const STRAAL = Math.hypot(SCHOUDERPRESS.onder.dy - SCHOUDERPRESS.draaipunt.dy, SCHOUDERPRESS.onder.dz - SCHOUDERPRESS.draaipunt.dz)

/**
 * De greep op fractie `f` van de slag (0 onderin, 1 bovenin): op de boog om het
 * draaipunt, de breedte loopt gelijk mee naar binnen.
 */
export function greepOpBoog(f: number): HandRelatief {
  const { onder, boven, draaipunt } = SCHOUDERPRESS
  const a = hoekOm(onder) + (hoekOm(boven) - hoekOm(onder)) * f
  return {
    dx: onder.dx + (boven.dx - onder.dx) * f,
    dy: draaipunt.dy + STRAAL * Math.sin(a),
    dz: draaipunt.dz + STRAAL * Math.cos(a),
  }
}
