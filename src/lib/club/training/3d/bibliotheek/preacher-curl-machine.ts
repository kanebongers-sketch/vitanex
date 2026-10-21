// 3D-oefening: Preacher curl machine. Naam exact zoals in de oefenbibliotheek.
// Zittend, borst tegen de bovenrand van het steile preacherkussen, de oksels
// net tegen die rand en de bovenarmen plat schuin omlaag op het kussen. De
// ellebogen liggen in lijn met het draaipunt van de hefboom. Handvatten met de
// handpalmen omhoog: vanuit bijna gestrekte armen (niet op slot) in 1 tel
// krullen tot de grepen bij de schouders zijn, kort stil en in 3 tellen rustig
// terug. Bovenarmen en romp blijven liggen.

import { armOefening } from '../bouw/boven'
import { VOOR } from './gedeeld'
import type { Oefening3d } from '../typen'

export const PREACHER_CURL_MACHINE: Oefening3d = armOefening({
  naam: 'Preacher curl machine',
  lichaam: { bekkenY: 0.6, bekkenZ: 0.03, kantel: 20, lende: 1, borst: 4, nek: -1, schouders: -0.01, draai: 180 },
  van: { heffen: 28, opzij: 5, elleboog: 16, buig: VOOR },
  naar: { heffen: 28, opzij: 5, elleboog: 134, buig: VOOR },
  enkel: { x: 0.2, y: 0.08, z: 0.56 },
  voet: { kanteling: 0, uitdraai: 12 },
  knieRichting: { x: 0.3, y: 0.4, z: 1 },
  elleboogRichting: { x: 0.16, y: -1, z: -0.1 },
  // Onderhands (handpalmen omhoog) die meedraait met de onderarm.
  greepAnatomisch: true,
  materiaal: [{ soort: 'curlMachine' }],
  spieren: ['bovenarm'],
  spierenSecundair: ['onderarm'],
  camera: { hoek: -50, hoogte: 14, afstand: 3.2, doel: { x: 0, y: 0.74, z: 0.28 } },
  tempo: { begin: 0.4, heen: 1.0, eind: 0.5, terug: 3.0 },
  tussen: 3,
})
