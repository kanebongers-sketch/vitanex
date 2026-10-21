// ─── Fit Factory Club, 3D-oefenbeelden: waar een werkende spier ligt ────────
// Per lichaamsdeel op arm of been: hoe sterk een punt bij de spier hoort (0 tot
// 1), op fractie t langs het bot en hoek rond het bot (0 voor, 90 binnen, -90
// buiten, 180 achter). De vormen volgen de spierbuik en lopen aan de randen
// zacht af, zodat een markering leest als een spier en niet als een mouw of
// een gekleurde legging.

import type { Lichaamsdeel } from '@/lib/club/training/3d/typen'
import { hoekVerschil, klok } from './bouwer'

export type Masker = (t: number, hoek: number) => number

const rond = (h: number, midden: number, breedte: number) => klok(hoekVerschil(h, midden) / breedte)

export const MASKERS: Partial<Record<Lichaamsdeel, Masker>> = {
  // Quadriceps: voorkant, iets naar buiten, met de binnenste kop laag bij de knie.
  dij: (t, h) =>
    Math.max(klok((t - 0.5) / 0.44) * rond(h, -14, 105), 0.85 * klok((t - 0.8) / 0.16) * rond(h, 48, 40)),
  // Hamstrings: achterkant, van de bilplooi tot net boven de knieholte.
  hamstring: (t, h) => klok((t - 0.48) / 0.42) * rond(h, 178, 92),
  // Onderste deel van de bilspier, dat over de bovenkant van de dij valt.
  bil: (t, h) => klok(t / 0.2) * rond(h, 168, 85),
  // Kuit: dikste deel aan de achterkant.
  kuit: (t, h) => klok((t - 0.32) / 0.28) * rond(h, 180, 105),
  // Biceps (voor) en triceps (achter); de zijkanten blijven vrij.
  bovenarm: (t, h) => klok((t - 0.6) / 0.36) * Math.max(rond(h, 4, 92), rond(h, 176, 98)),
  // Deltaspier: de schouderkop, naar de aanhechting halverwege de bovenarm
  // uitlopend. De kop draait niet mee met het bovenarmbot, dus rondom; aan de
  // okselkant zwakker.
  schouder: (t, h) => klok((t + 0.02) / 0.38) * (1 - 0.5 * rond(h, 90, 70)),
  // Onderarm: spierbuiken vlak onder de elleboog.
  onderarm: (t, h) => klok((t - 0.3) / 0.34) * (0.6 + 0.4 * rond(h, 0, 120)),
}
