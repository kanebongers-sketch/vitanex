// 3D-oefening: Curl aan de kabel. Naam exact zoals in de oefenbibliotheek.
// Rechtop een kleine stap voor een kabelkolom met de katrol helemaal laag, rechte
// stang op schouderbreedte met de handpalmen naar voren. De ellebogen blijven
// tegen de zij: alleen de onderarmen krullen de stang van voor de bovenbenen naar
// de borst, kort aanknijpen en in 2 tellen afremmen tot de armen bijna gestrekt
// zijn. De kabel trekt licht naar voren, dus de romp staat stil met de buik vast.

import { armOefening, CAMERA, LICHAAM } from '../bouw/boven'
import { VOOR } from './gedeeld'
import type { Oefening3d } from '../typen'

export const CURL_AAN_DE_KABEL: Oefening3d = armOefening({
  naam: 'Curl aan de kabel',
  lichaam: LICHAAM.staand,
  van: { heffen: 4, opzij: 2, elleboog: 14, buig: VOOR },
  naar: { heffen: 11, opzij: 4, elleboog: 134, buig: VOOR },
  balans: 0.02,
  elleboogRichting: { x: 0.03, y: -0.4, z: -1 },
  materiaal: [{ soort: 'kabelLaag', greep: 'stang', plek: { x: 0, y: 0.14, z: 0.62 } }],
  spieren: ['bovenarm'],
  spierenSecundair: ['onderarm'],
  camera: { ...CAMERA.schuin, hoek: 42, doel: { x: 0, y: 0.95, z: 0.2 } },
  tempo: { begin: 0.4, heen: 1.1, eind: 0.4, terug: 2.2 },
  tussen: 3,
})
