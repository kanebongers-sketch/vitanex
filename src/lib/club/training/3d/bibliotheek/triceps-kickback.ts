// 3D-oefening: Triceps kickback. Naam exact zoals in de oefenbibliotheek.
// Staand met de knieen licht gebogen, voorover vanuit de heupen tot de rug vlak
// en bijna horizontaal staat, een dumbbell in elke hand (neutrale greep). De
// ellebogen zijn omhoog getrokken: de bovenarmen liggen langs de romp en
// blijven daar. Begin met de onderarmen recht onder de ellebogen, strek in 1
// tel naar achteren tot de armen recht zijn, houd een tel vast en laat in 2
// tellen terugzakken.

import { armOefening } from '../bouw/boven'
import { BLIK } from '../bouw/basis'
/** De onderarm hangt omlaag als de elleboog gebogen is. */
const OMLAAG = { x: 0, y: -1, z: 0 } as const
import type { Oefening3d } from '../typen'

/** Handvat in het vlak van de arm, haaks op de onderarm (palmen naar elkaar). */
const GREEP = { x: 0, y: 0.66, z: -0.75 } as const

export const TRICEPS_KICKBACK: Oefening3d = armOefening({
  naam: 'Triceps kickback',
  lichaam: { bekkenY: 0.87, bekkenZ: -0.15, kantel: 66, lende: 0, borst: 4, nek: -20, schouders: 0.005 },
  van: { heffen: -84, opzij: 12, elleboog: 88, buig: OMLAAG },
  naar: { heffen: -84, opzij: 8, elleboog: 4, buig: OMLAAG },
  enkel: { x: 0.11, y: 0.08, z: 0 },
  knieRichting: { x: 0.2, y: 0, z: 1 },
  elleboogRichting: { x: 0.06, y: 1, z: -0.3 },
  greepRichting: GREEP,
  blik: BLIK.vloer,
  materiaal: [{ soort: 'halters' }],
  spieren: ['bovenarm'],
  camera: { hoek: 78, hoogte: 12, afstand: 4.1, doel: { x: 0, y: 0.88, z: 0.05 } },
  tempo: { begin: 0.4, heen: 1.0, eind: 1.0, terug: 2.0 },
  tussen: 3,
})
