// 3D-oefening: Voorovergebogen row met dumbbells. Naam exact zoals in de oefenbibliotheek.

import { armOefening, LICHAAM } from '../bouw/boven'
import { NEUTRAAL } from './gedeeld'
import type { Oefening3d } from '../typen'

export const ROW_DUMBBELLS: Oefening3d = armOefening({
  naam: 'Voorovergebogen row met dumbbells',
  lichaam: LICHAAM.voorover,
  van: { dx: 0.02, dy: -0.6, dz: 0.03 },
  naar: { dx: 0.04, dy: -0.29, dz: -0.17 },
  balans: 0.04,
  enkel: { x: 0.12, y: 0.08, z: 0 },
  elleboogRichting: { x: 0.25, y: 0.6, z: -0.8 },
  greepRichting: NEUTRAAL,
  materiaal: [{ soort: 'halters' }],
  spieren: ['rug', 'bovenarm'],
  camera: { hoek: 62, hoogte: 10, afstand: 4.2, doel: { x: 0, y: 0.82, z: 0.05 } },
  tussen: 1,
})
