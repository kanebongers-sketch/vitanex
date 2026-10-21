// 3D-oefening: Triceps extension liggend met dumbbell. Naam exact zoals in de oefenbibliotheek.
// Op de rug op een vlakke bank, voeten plat op de grond. Een dumbbell met beide
// handen onder de bovenste kop, armen gestrekt boven de borst. De ellebogen
// wijzen naar het plafond en blijven staan; de dumbbell zakt in 3 tellen in een
// boog achter het hoofd tot een goede rek in de triceps, kort stil, in 1 tel
// terug strekken tot boven de borst.

import { armOefening, LICHAAM } from '../bouw/boven'
/** De onderarm klapt achter het hoofd en iets naar binnen: zo blijven beide handen onder de kop van de dumbbell. */
const BUIG = { x: -0.24, y: 0, z: -1 } as const
import type { Oefening3d } from '../typen'

export const TRICEPS_EXTENSION_LIGGEND: Oefening3d = armOefening({
  naam: 'Triceps extension liggend met dumbbell',
  lichaam: LICHAAM.bankLig,
  van: { heffen: 186, opzij: -9, elleboog: 6, buig: BUIG },
  naar: { heffen: 206, opzij: -9, elleboog: 90, buig: BUIG },
  enkel: { x: 0.24, y: 0.08, z: 0.66 },
  voet: { kanteling: 0, uitdraai: 15 },
  knieRichting: { x: 0.3, y: 1, z: 0.4 },
  elleboogRichting: { x: 0.1, y: 1, z: 0.3 },
  greepRichting: { x: 0, y: 1, z: 0 },
  materiaal: [{ soort: 'bankKaal', plek: { x: 0, y: 0, z: 0.07 } }, { soort: 'halterStaand' }],
  spieren: ['bovenarm'],
  camera: { hoek: 70, hoogte: 20, afstand: 4.0, doel: { x: 0, y: 0.72, z: -0.3 } },
  tempo: { begin: 0.5, heen: 3.0, eind: 0.4, terug: 1.1 },
  tussen: 3,
})
