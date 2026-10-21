// 3D-oefening: Curl met EZ-stang. Naam exact zoals in de oefenbibliotheek.
// Rechtop met de voeten op heupbreedte en ontspannen knieen, de EZ-stang op de
// buitenste schuine grepen (handen iets naar binnen gedraaid, handpalmen naar
// voren), schouders laag. De bovenarmen blijven stil langs de romp: de stang
// komt van voor de bovenbenen naar de borst zonder dat de ellebogen naar voren
// schuiven, en zakt in 2 tot 3 tellen terug tot de armen bijna gestrekt zijn.

import { armOefening, CAMERA, LICHAAM } from '../bouw/boven'
import { VOOR } from './gedeeld'
import type { Oefening3d } from '../typen'

export const CURL_EZ_STANG: Oefening3d = armOefening({
  naam: 'Curl met EZ-stang',
  lichaam: LICHAAM.staand,
  van: { heffen: 4, opzij: 2, elleboog: 12, buig: VOOR },
  naar: { heffen: 11, opzij: 4, elleboog: 134, buig: VOOR },
  balans: 0.03,
  elleboogRichting: { x: 0.03, y: -0.4, z: -1 },
  materiaal: [{ soort: 'ezStang' }],
  spieren: ['bovenarm'],
  spierenSecundair: ['onderarm'],
  camera: CAMERA.schuin,
  tempo: { begin: 0.4, heen: 1.1, eind: 0.4, terug: 2.4 },
  tussen: 3,
})
