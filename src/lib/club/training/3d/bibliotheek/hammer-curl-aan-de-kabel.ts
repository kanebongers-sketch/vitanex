// 3D-oefening: Hammer curl aan de kabel. Naam exact zoals in de oefenbibliotheek.
// Rechtop dicht bij een kabelkolom met de katrol laag en een touw, de uiteinden
// in de vuisten met de duimen omhoog (handpalmen naar elkaar). De ellebogen
// blijven naast het lichaam, de handen komen tot bij de schouders, kort vast en
// in 2 tellen gecontroleerd terug tot de armen gestrekt zijn. Romp stil, knieen
// licht gebogen, polsen recht in het verlengde van de onderarmen.

import { armOefening, CAMERA, LICHAAM } from '../bouw/boven'
import { VOOR } from './gedeeld'
import type { Oefening3d } from '../typen'

export const HAMMER_CURL_KABEL: Oefening3d = armOefening({
  naam: 'Hammer curl aan de kabel',
  lichaam: { ...LICHAAM.staand, draai: 90 },
  van: { heffen: 3, opzij: 3, elleboog: 10, buig: VOOR },
  naar: { heffen: 12, opzij: 3, elleboog: 132, buig: VOOR },
  balans: 0.02,
  elleboogRichting: { x: 0.05, y: -0.4, z: -1 },
  // Neutraal (duim boven) die met de onderarm meedraait, de hele baan door.
  greepAnatomisch: true,
  materiaal: [{ soort: 'kabelLaag', greep: 'touw', plek: { x: 0, y: 0.14, z: 0.56 } }],
  spieren: ['bovenarm', 'onderarm'],
  camera: { ...CAMERA.schuin, hoek: 42, doel: { x: 0, y: 0.95, z: 0.2 } },
  tempo: { begin: 0.4, heen: 1.0, eind: 0.5, terug: 2.0 },
  tussen: 3,
})
