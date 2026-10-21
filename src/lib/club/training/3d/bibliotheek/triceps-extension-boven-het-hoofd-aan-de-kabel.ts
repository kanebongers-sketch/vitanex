// 3D-oefening: Triceps extension boven het hoofd aan de kabel. Naam exact zoals in de oefenbibliotheek.
// Rug naar een lage kabel met een touw, een voet naar voren in spreidstand en de
// romp licht voorover met de buik aan. De ellebogen staan naast de oren en
// wijzen vooruit; het touw begint ver achter het hoofd (rek in de triceps). In
// 1 tel strekken de armen schuin omhoog naar voren, kort vast, in 2 tellen
// zakt het touw terug achter het hoofd. Alleen de ellebogen bewegen.

import { armOefening } from '../bouw/boven'
import type { Oefening3d } from '../typen'

/** De onderarm klapt achter het hoofd en iets naar binnen, naar het touw. */
const BUIG = { x: -0.2, y: 0, z: -1 } as const

/** Katrol van de lage kabel, ver genoeg achter de sporter dat de kabel vrij langs het hoofd loopt. */
const KATROL = { x: 0, y: 0.35, z: -1.35 } as const

const OEFENING = armOefening({
  naam: 'Triceps extension boven het hoofd aan de kabel',
  lichaam: { bekkenY: 0.87, bekkenZ: -0.04, kantel: 26, lende: 0, borst: 6, nek: -8, schouders: 0.01 },
  van: { heffen: 156, opzij: -4, elleboog: 122, buig: BUIG },
  naar: { heffen: 150, opzij: -4, elleboog: 5, buig: BUIG },
  enkel: { x: 0.12, y: 0.08, z: 0.3 },
  voet: { kanteling: 0, uitdraai: 6 },
  knieRichting: { x: 0.15, y: 0, z: 1 },
  elleboogRichting: { x: 0.1, y: 0.2, z: 1 },
  greepRichting: { x: 0, y: 0.5, z: 0.87 },
  blik: { hoek: 10 },
  materiaal: [{ soort: 'kabelAchter', greep: 'touw', plek: KATROL }],
  spieren: ['bovenarm'],
  camera: { hoek: 72, hoogte: 10, afstand: 5.3, doel: { x: 0, y: 1.0, z: -0.7 } },
  tempo: { begin: 0.4, heen: 1.0, eind: 0.4, terug: 2.0 },
  tussen: 3,
})

/** Spreidstand: de linkervoet voor, de rechtervoet een flinke stap naar achteren op de bal van de voet. */
export const TRICEPS_EXTENSION_KABEL: Oefening3d = {
  ...OEFENING,
  enkelRechts: { x: -0.13, y: 0.134, z: -0.43 },
  voetRechts: { kanteling: 30, uitdraai: 12 },
}
