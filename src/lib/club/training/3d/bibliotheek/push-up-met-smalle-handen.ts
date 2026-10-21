// 3D-oefening: Push-up met smalle handen. Naam exact zoals in de oefenbibliotheek.
// Handen recht onder de schouders (niet tegen elkaar), vingers naar voren,
// lichaam een rechte lijn van hielen tot hoofd. Zakken door de ellebogen langs
// de ribben naar achteren te buigen tot de borst vlak boven de mat is, dan
// omhoog tot de armen gestrekt zijn. De triceps doen het meeste werk.

import { pushUp } from '../bouw/push-up'
import type { Oefening3d } from '../typen'

export const PUSH_UP_SMALLE_HANDEN: Oefening3d = pushUp({
  naam: 'Push-up met smalle handen',
  steun: { soort: 'tenen', teen: { x: 0.1, y: 0.006, z: -1.02 } },
  // Polsen recht onder de schoudergewrichten.
  hand: { vlak: 0.012, x: 0.165 },
  // Ellebogen dicht langs de romp, naar achteren richting de heupen.
  elleboogRichting: { x: 0.12, y: 0.5, z: -1.5 },
  materiaal: [{ soort: 'mat', plek: { x: 0, y: 0, z: -0.35 } }],
  spieren: ['bovenarm', 'borst'],
  spierenSecundair: ['schouder', 'romp'],
  // Iets meer van opzij dan de gewone push-up: de ellebogen langs de ribben zijn het verschil.
  camera: { hoek: 64, hoogte: 11, afstand: 3.6, doel: { x: 0, y: 0.3, z: -0.12 } },
})
