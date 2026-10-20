// 3D-oefening: Triceps pushdown. Naam exact zoals in de oefenbibliotheek.

import { armOefening, LICHAAM } from '../bouw/boven'
import { VOOR } from './gedeeld'
import type { Oefening3d } from '../typen'

export const TRICEPS_PUSHDOWN: Oefening3d = armOefening({
  naam: 'Triceps pushdown',
  lichaam: LICHAAM.staandLicht,
  van: { heffen: 8, opzij: 5, elleboog: 92, buig: VOOR },
  naar: { heffen: 6, opzij: 5, elleboog: 6, buig: VOOR },
  balans: 0.03,
  enkel: { x: 0.13, y: 0.08, z: 0 },
  elleboogRichting: { x: 0.1, y: -0.2, z: -1 },
  materiaal: [{ soort: 'kabel', greep: 'stang', plek: { x: 0, y: 2.05, z: 0.5 } }],
  spieren: ['bovenarm'],
  camera: { hoek: 56, hoogte: 10, afstand: 4.3, doel: { x: 0, y: 1.1, z: 0.15 } },
  tempo: { begin: 0.4, heen: 1.1, eind: 0.5, terug: 1.8 },
  tussen: 2,
})
