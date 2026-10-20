// 3D-oefening: Dumbbell curl. Naam exact zoals in de oefenbibliotheek.

import { armOefening, CAMERA, LICHAAM } from '../bouw/boven'
import { CURL_ARM } from './gedeeld'
import type { Oefening3d } from '../typen'

export const DUMBBELL_CURL: Oefening3d = armOefening({
  naam: 'Dumbbell curl',
  lichaam: LICHAAM.staand,
  van: { ...CURL_ARM, elleboog: 12 },
  naar: { ...CURL_ARM, heffen: 12, elleboog: 138 },
  balans: 0.03,
  elleboogRichting: { x: 0.15, y: -0.3, z: -1 },
  materiaal: [{ soort: 'halters' }],
  spieren: ['bovenarm'],
  camera: CAMERA.schuin,
  tussen: 3,
})
