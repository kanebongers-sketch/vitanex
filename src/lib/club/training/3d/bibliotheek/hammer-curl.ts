// 3D-oefening: Hammer curl. Naam exact zoals in de oefenbibliotheek.

import { armOefening, CAMERA, LICHAAM } from '../bouw/boven'
import { CURL_ARM } from './gedeeld'
import type { Oefening3d } from '../typen'

export const HAMMER_CURL: Oefening3d = armOefening({
  naam: 'Hammer curl',
  lichaam: { ...LICHAAM.staand, draai: 90 },
  van: { ...CURL_ARM, elleboog: 12 },
  naar: { ...CURL_ARM, heffen: 12, elleboog: 136 },
  balans: 0.03,
  elleboogRichting: { x: 0.15, y: -0.3, z: -1 },
  // Neutraal (duim boven) die met de onderarm meedraait, de hele baan door.
  greepAnatomisch: true,
  materiaal: [{ soort: 'halters' }],
  spieren: ['bovenarm', 'onderarm'],
  camera: CAMERA.schuin,
  tussen: 3,
})
