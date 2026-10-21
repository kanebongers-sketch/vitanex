// 3D-oefening: Biceps curl machine. Naam exact zoals in de oefenbibliotheek.
// Zittend met de borst tegen de bovenkant van het schuine armkussen, de
// bovenarmen plat op het kussen en de ellebogen op een lijn met het draaipunt
// van de hefboom. Handvatten met de handpalmen omhoog: vanuit bijna gestrekte
// armen buigen tot de handvatten bij de schouders zijn, kort aanknijpen en in
// 2 tellen terug zonder de schijven aan te tikken. Bovenarmen blijven liggen.

import { armOefening } from '../bouw/boven'
import { VOOR } from './gedeeld'
import type { Oefening3d } from '../typen'

export const BICEPS_CURL_MACHINE: Oefening3d = armOefening({
  naam: 'Biceps curl machine',
  lichaam: { bekkenY: 0.56, bekkenZ: 0, kantel: 8, lende: 0, nek: 2, schouders: -0.005 },
  van: { heffen: 65, opzij: 4, elleboog: 16, buig: VOOR },
  naar: { heffen: 65, opzij: 4, elleboog: 122, buig: VOOR },
  enkel: { x: 0.17, y: 0.08, z: 0.36 },
  voet: { kanteling: 0, uitdraai: 12 },
  knieRichting: { x: 0.3, y: 0.4, z: 1 },
  elleboogRichting: { x: 0.16, y: -1, z: -0.1 },
  materiaal: [{ soort: 'curlMachine' }],
  spieren: ['bovenarm'],
  spierenSecundair: ['onderarm'],
  camera: { hoek: 62, hoogte: 12, afstand: 4.3, doel: { x: 0, y: 0.85, z: 0.2 } },
  tempo: { begin: 0.4, heen: 1.0, eind: 0.5, terug: 2.0 },
  tussen: 3,
})
