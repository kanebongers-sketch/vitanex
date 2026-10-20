// 3D-oefening: Overhead press. Naam exact zoals in de oefenbibliotheek.

import { armOefening, LICHAAM } from '../bouw/boven'
import type { Oefening3d } from '../typen'

export const OVERHEAD_PRESS: Oefening3d = armOefening({
  naam: 'Overhead press',
  lichaam: LICHAAM.staand,
  van: { heffen: 30, opzij: 24, elleboog: 140, buig: { x: 0, y: 1, z: 0 } },
  naar: { heffen: 172, opzij: 14, elleboog: 6, buig: { x: 0, y: 1, z: 0 } },
  balans: 0.04,
  enkel: { x: 0.14, y: 0.08, z: 0 },
  elleboogRichting: { x: 0.6, y: -1, z: 0.5 },
  materiaal: [{ soort: 'stang', schijven: 1 }],
  spieren: ['schouder', 'bovenarm'],
  camera: { hoek: 34, hoogte: 6, afstand: 5.0, doel: { x: 0, y: 1.2, z: 0.05 } },
  tempo: { begin: 0.4, heen: 1.3, eind: 0.5, terug: 1.8 },
  tussen: 3,
})
