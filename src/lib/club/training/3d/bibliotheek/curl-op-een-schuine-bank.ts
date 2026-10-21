// 3D-oefening: Curl op een schuine bank. Naam exact zoals in de oefenbibliotheek.
// Zittend op een bank met de rugleuning op 55 graden, rug, schouders en hoofd
// tegen het kussen, voeten plat op de vloer. De armen hangen recht naar beneden
// naast de bank, dus achter de romp: de biceps staat onderin op rek. De
// bovenarmen blijven verticaal, alleen de onderarmen krullen de dumbbells
// (handpalmen naar voren) omhoog; kort stil en in 3 tellen terug tot gestrekt.

import { armOefening } from '../bouw/boven'
import { VOOR } from './gedeeld'
import type { Oefening3d } from '../typen'

export const CURL_SCHUINE_BANK: Oefening3d = armOefening({
  naam: 'Curl op een schuine bank',
  lichaam: { bekkenY: 0.56, bekkenZ: 0.12, kantel: -35, nek: 8, schouders: -0.01 },
  van: { heffen: 0, opzij: 11, elleboog: 8, buig: VOOR },
  naar: { heffen: 2, opzij: 11, elleboog: 128, buig: VOOR },
  enkel: { x: 0.2, y: 0.08, z: 0.62 },
  voet: { kanteling: 0, uitdraai: 14 },
  knieRichting: { x: 0.3, y: 0.5, z: 1 },
  elleboogRichting: { x: 0.08, y: -0.4, z: -1 },
  materiaal: [{ soort: 'bankSchuin', hoek: 55, plek: { x: 0, y: 0, z: 0.0 } }, { soort: 'halters' }],
  spieren: ['bovenarm'],
  spierenSecundair: ['onderarm'],
  camera: { hoek: 64, hoogte: 12, afstand: 4.3, doel: { x: 0, y: 0.82, z: 0.05 } },
  tempo: { begin: 0.5, heen: 1.1, eind: 0.4, terug: 2.8 },
  tussen: 3,
})
