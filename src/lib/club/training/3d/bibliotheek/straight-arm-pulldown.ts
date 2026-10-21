// 3D-oefening: Straight arm pulldown. Naam exact zoals in de oefenbibliotheek.
// Staand een stap voor de hoge katrol, licht voorover vanuit de heupen met een
// rechte rug en zachte knieen. Rechte stang op schouderbreedte, armen bijna
// gestrekt op hoofdhoogte. De ellebogen houden dezelfde lichte buiging; alleen de
// schouders bewegen: de stang gaat in een halve cirkel naar de bovenbenen en
// gecontroleerd terug tot de rek onder de oksels. Romp blijft op dezelfde hoek.
// Tempo: 1 tel omlaag, kort stil, 2 tellen omhoog.
// Camera van opzij: de boog van de armen en de vaste hoek van de romp.

import { armOefening } from '../bouw/boven'
import { HEUP_STAAND } from '../bouw/basis'
import type { Oefening3d } from '../typen'

/** Licht voorover vanuit de heupen, rug recht, knieen zacht, schouders laag. */
const ROMP = { bekkenY: HEUP_STAAND - 0.03, kantel: 24, lende: 0, borst: 2, schouders: -0.02 } as const

/** De onderarm buigt licht naar de kabel toe: ellebogen wijzen omlaag en iets naar buiten. */
const BUIG = { x: 0, y: 1, z: 0.6 } as const

export const STRAIGHT_ARM_PULLDOWN: Oefening3d = armOefening({
  naam: 'Straight arm pulldown',
  lichaam: ROMP,
  // Bovenin: stang op hoofdhoogte voor je, armen bijna gestrekt.
  van: { heffen: 112, opzij: 2, elleboog: 12, buig: BUIG },
  // Onderin: stang tegen de voorkant van de bovenbenen.
  naar: { heffen: -3, opzij: 2, elleboog: 12, buig: BUIG },
  balans: 0.02,
  enkel: { x: 0.14, y: 0.08, z: 0 },
  elleboogRichting: { x: 0.35, y: -1, z: -0.1 },
  materiaal: [{ soort: 'kabel', greep: 'stang', plek: { x: 0, y: 2.0, z: 0.95 } }],
  spieren: ['rug'],
  spierenSecundair: ['bovenarm', 'romp'],
  camera: { hoek: 74, hoogte: 9, afstand: 4.6, doel: { x: 0, y: 1.05, z: 0.4 } },
  blik: { hoek: 16 },
  tempo: { begin: 0.4, heen: 1.4, eind: 0.4, terug: 2.0 },
  tussen: 7,
})
