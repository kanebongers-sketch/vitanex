// 3D-oefening: Barbell curl. Naam exact zoals in de oefenbibliotheek.

import { armOefening, CAMERA, LICHAAM } from '../bouw/boven'
import { VOOR } from './gedeeld'
import type { Oefening3d } from '../typen'

export const BARBELL_CURL: Oefening3d = armOefening({
  naam: 'Barbell curl',
  lichaam: LICHAAM.staand,
  van: { heffen: 4, opzij: 3, elleboog: 12, buig: VOOR },
  naar: { heffen: 12, opzij: 3, elleboog: 136, buig: VOOR },
  balans: 0.03,
  elleboogRichting: { x: 0.1, y: -0.3, z: -1 },
  materiaal: [{ soort: 'curlStang' }],
  spieren: ['bovenarm'],
  camera: CAMERA.schuin,
  tussen: 3,
})
