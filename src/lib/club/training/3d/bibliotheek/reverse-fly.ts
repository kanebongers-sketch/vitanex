// 3D-oefening: Reverse fly. Naam exact zoals in de oefenbibliotheek.
// Voeten op heupbreedte, knieen licht gebogen, vanuit de heupen voorover tot de
// romp bijna horizontaal is, rug vlak en borst open. De dumbbells hangen onder
// de schouders in neutrale greep. Met een kleine, vaste buiging in de ellebogen
// gaan de armen wijd naar opzij tot ze in lijn met de romp zijn; de romp komt
// niet omhoog. Nek lang in het verlengde van de rug, blik op de vloer iets voor
// de voeten. Een tel omhoog, kort vast, twee tellen omlaag.

import { armOefening } from '../bouw/boven'
import { NEUTRAAL } from './gedeeld'
import type { Oefening3d } from '../typen'

/** Onderarm buigt licht naar binnen en naar voren (richting het hoofd): zachte, vaste elleboog. */
const BUIG = { x: -0.6, y: -0.3, z: 0.6 } as const

export const REVERSE_FLY: Oefening3d = armOefening({
  naam: 'Reverse fly',
  lichaam: { bekkenY: 0.912, kantel: 72, lende: -2, borst: 2, nek: -10, schouders: -0.01 },
  van: { heffen: 0, opzij: 10, elleboog: 18, buig: BUIG },
  naar: { heffen: 18, opzij: 84, elleboog: 20, buig: BUIG },
  balans: 0.04,
  enkel: { x: 0.12, y: 0.08, z: 0 },
  voet: { kanteling: 0, uitdraai: 6 },
  knieRichting: { x: 0.12, y: 0, z: 1 },
  elleboogRichting: { x: 0.6, y: 0.4, z: -0.6 },
  greepRichting: NEUTRAAL,
  materiaal: [{ soort: 'halters' }],
  spieren: ['schouder', 'rug'],
  spierenSecundair: ['onderrug'],
  // Schuin van voren en van boven: de armen als vleugels, de vlakke rug en de nek in lijn.
  camera: { hoek: 34, hoogte: 24, afstand: 4.4, doel: { x: 0, y: 0.92, z: 0.1 } },
  // Hoofd in het verlengde van de rug (geen blik vooruit): ogen naar de vloer vlak voor de voeten.
  blik: null,
  tussen: 3,
})
