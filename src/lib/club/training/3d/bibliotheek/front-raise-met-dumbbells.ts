// 3D-oefening: Front raise met dumbbells. Naam exact zoals in de oefenbibliotheek.

import { armOefening, CAMERA, LICHAAM } from '../bouw/boven'
import type { Oefening3d } from '../typen'

export const FRONT_RAISE: Oefening3d = armOefening({
  naam: 'Front raise met dumbbells',
  lichaam: LICHAAM.staand,
  van: { heffen: 6, opzij: 10, elleboog: 10, buig: { x: 0, y: 1, z: 0 } },
  naar: { heffen: 90, opzij: 10, elleboog: 12, buig: { x: 0, y: 1, z: 0 } },
  balans: 0.03,
  elleboogRichting: { x: 0.4, y: 0.2, z: -1 },
  materiaal: [{ soort: 'halters' }],
  spieren: ['schouder'],
  camera: { ...CAMERA.opzij, doel: { x: 0, y: 1.0, z: 0.25 } },
  tempo: { begin: 0.4, heen: 1.2, eind: 0.4, terug: 2.0 },
  tussen: 3,
})
