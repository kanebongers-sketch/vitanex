// 3D-oefening: Lateral raise. Naam exact zoals in de oefenbibliotheek.

import { armOefening, LICHAAM } from '../bouw/boven'
import { VOOR, NEUTRAAL } from './gedeeld'
import type { Oefening3d } from '../typen'

export const LATERAL_RAISE: Oefening3d = armOefening({
  naam: 'Lateral raise',
  lichaam: { ...LICHAAM.staand, kantel: 6 },
  van: { heffen: 8, opzij: 10, elleboog: 16, buig: VOOR },
  naar: { heffen: 12, opzij: 84, elleboog: 18, buig: VOOR },
  balans: 0.03,
  elleboogRichting: { x: 0.3, y: 0.3, z: -1 },
  greepRichting: NEUTRAAL,
  materiaal: [{ soort: 'halters' }],
  spieren: ['schouder'],
  camera: { hoek: 18, hoogte: 8, afstand: 4.4, doel: { x: 0, y: 1.1, z: 0.05 } },
  tempo: { begin: 0.4, heen: 1.2, eind: 0.4, terug: 2.0 },
  tussen: 3,
})
