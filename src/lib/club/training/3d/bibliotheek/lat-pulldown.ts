// 3D-oefening: Lat pulldown. Naam exact zoals in de oefenbibliotheek.
// Zittend, dijen vlak boven de knieen onder het kussen, hooguit licht achterover.
// Stang iets breder dan schouderbreedte. Eerst de schouders omlaag met gestrekte
// armen, daarna de ellebogen naar de broekzakken tot de stang voor het gezicht
// langs net onder de sleutelbeenderen is. Romp blijft stil, borst omhoog.
// Tempo: schouders laag, 1 tel omlaag, kort stil, ruim 2 tellen gecontroleerd terug.
// Camera schuin van achteren: rug, ellebogen langs de romp en de stang bij de borst.

import { houding } from '../bouw/basis'
import type { Houding } from '../typen'
import type { Oefening3d } from '../typen'

const ZIT = { bekkenY: 0.555, bekkenZ: -0.04, lende: 0 } as const
const GREEP = 0.35

/** Bovenin: armen gestrekt, schouders zo hoog als de grens toestaat voor de rek onder de oksels. */
const LAT_BOVEN: Houding = houding({
  ...ZIT, kantel: -6, lende: -2, borst: 0, nek: 3,
  schouders: 0.05, lastY: 1.688, lastZ: -0.035, greep: GREEP,
})

/** Schouders eerst omlaag, armen nog gestrekt: de stang zakt alleen mee met de schouders. */
const LAT_SCHOUDERS_LAAG: Houding = houding({
  ...ZIT, kantel: -6, lende: -3, borst: -3, nek: 4,
  schouders: -0.04, lastY: 1.594, lastZ: -0.039, greep: GREEP,
})

/** Halverwege: de stang gaat in een kleine boog voor het gezicht langs. */
const LAT_MIDDEN: Houding = houding({
  ...ZIT, kantel: -6, lende: -4, borst: -6, nek: 4,
  schouders: -0.04, lastY: 1.22, lastZ: 0.03, greep: GREEP,
})

/** Onderin: stang net onder de sleutelbeenderen, borst naar de stang, romp vrijwel stil. */
const LAT_ONDER: Houding = houding({
  ...ZIT, kantel: -6, lende: -5, borst: -8, nek: 4,
  schouders: -0.04, lastY: 0.965, lastZ: -0.005, greep: GREEP,
})

export const LAT_PULLDOWN_3D: Oefening3d = {
  naam: 'Lat pulldown',
  sleutels: [
    { houding: LAT_BOVEN, vast: 0.5, naarVolgende: 0.3 },
    { houding: LAT_SCHOUDERS_LAAG, vast: 0.3, naarVolgende: 0.45 },
    { houding: LAT_MIDDEN, vast: 0, naarVolgende: 0.4 },
    { houding: LAT_ONDER, vast: 0.5, naarVolgende: 1.3 },
    { houding: LAT_MIDDEN, vast: 0, naarVolgende: 1.2 },
  ],
  last: 'wereld',
  handen: 'greep',
  enkel: { x: 0.15, y: 0.08, z: 0.4 },
  voet: { kanteling: 0, uitdraai: 10 },
  knieRichting: { x: 0.2, y: 0.4, z: 1 },
  elleboogRichting: { x: 1, y: -0.9, z: -0.9 },
  materiaal: [{ soort: 'kabelstation', plek: { x: 0, y: 0, z: 0 } }],
  spieren: ['rug', 'bovenarm'],
  camera: { hoek: 110, hoogte: 15, afstand: 5.0, doel: { x: 0, y: 1.12, z: 0 } },
}
