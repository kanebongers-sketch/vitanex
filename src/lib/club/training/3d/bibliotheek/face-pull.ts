// 3D-oefening: Face pull. Naam exact zoals in de oefenbibliotheek.

import { armOefening, LICHAAM } from '../bouw/boven'
import type { Oefening3d } from '../typen'

export const FACE_PULL: Oefening3d = armOefening({
  naam: 'Face pull',
  lichaam: { ...LICHAAM.staand, kantel: -3, draai: 180 },
  van: { heffen: 86, opzij: 12, elleboog: 6, buig: { x: 0, y: 1, z: -0.3 } },
  naar: { heffen: 92, opzij: 78, elleboog: 98, buig: { x: 0, y: 1, z: -0.3 } },
  balans: 0.0,
  enkel: { x: 0.14, y: 0.08, z: 0 },
  elleboogRichting: { x: 1, y: -0.2, z: -0.4 },
  // Touw met de handpalmen naar elkaar en aan het eind de duimen naar achteren, meedraaiend met de onderarm.
  greepAnatomisch: true,
  materiaal: [{ soort: 'kabel', greep: 'touw', plek: { x: 0, y: 1.62, z: 1.25 } }],
  spieren: ['schouder', 'rug'],
  camera: { hoek: 40, hoogte: 14, afstand: 4.4, doel: { x: 0, y: 1.15, z: 0.3 } },
  tussen: 2,
})
