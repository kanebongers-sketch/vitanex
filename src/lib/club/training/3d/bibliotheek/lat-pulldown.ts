// 3D-oefening: Lat pulldown. Naam exact zoals in de oefenbibliotheek.
// Zittend, dijen vlak boven de knieen onder het kussen, hooguit licht achterover.
// Stang iets breder dan schouderbreedte (handen op de handvatten). Eerst de
// schouders omlaag met gestrekte armen en de borst omhoog, daarna de ellebogen
// naar de broekzakken tot de stang voor het gezicht langs net onder de
// sleutelbeenderen is. Romp blijft stil, borst gaat iets naar de stang.
// Tempo: schouders laag, 1 tel omlaag, kort stil, ruim 2 tellen gecontroleerd terug.
// Camera 3/4 van voren en opzij op borsthoogte: borst, stang en ellebogen tegelijk.

import { houding } from '../bouw/basis'
import { startVoorSleutel } from '../interpolatie'
import type { Houding, Oefening3d, Sleutel } from '../typen'

const ZIT = { bekkenY: 0.555, bekkenZ: -0.04 } as const
/** Handen midden op de rubberen handvatten van de stang. */
const GREEP = 0.36

/** Bovenin: armen gestrekt, schouders hoog (rek onder de oksels), borst nog rustig. */
const LAT_BOVEN: Houding = houding({
  ...ZIT, kantel: -4, lende: 0, borst: 3, nek: 0,
  schouders: 0.05, lastY: 1.68, lastZ: -0.02, greep: GREEP,
})

/** Schouders eerst omlaag en borst omhoog, armen nog gestrekt: de stang zakt alleen mee. */
const LAT_SCHOUDERS_LAAG: Houding = houding({
  ...ZIT, kantel: -6, lende: -4, borst: -6, nek: 0,
  schouders: -0.04, lastY: 1.55, lastZ: -0.03, greep: GREEP,
})

/** Halverwege: de stang gaat in een kleine boog voor het gezicht langs. */
const LAT_MIDDEN: Houding = houding({
  ...ZIT, kantel: -7, lende: -6, borst: -10, nek: 0,
  schouders: -0.04, lastY: 1.22, lastZ: 0.05, greep: GREEP,
})

/** Onderin: stang net onder de sleutelbeenderen, borst naar de stang, ellebogen langs de zij. */
const LAT_ONDER: Houding = houding({
  ...ZIT, kantel: -8, lende: -7, borst: -14, nek: 0,
  schouders: -0.04, lastY: 1.02, lastZ: 0.01, greep: GREEP,
})

const SLEUTELS: readonly Sleutel[] = [
  { houding: LAT_BOVEN, vast: 0.5, naarVolgende: 0.45 },
  { houding: LAT_SCHOUDERS_LAAG, vast: 0.4, naarVolgende: 0.45 },
  { houding: LAT_MIDDEN, vast: 0, naarVolgende: 0.45 },
  { houding: LAT_ONDER, vast: 0.5, naarVolgende: 1.3 },
  { houding: LAT_MIDDEN, vast: 0, naarVolgende: 1.2 },
]

export const LAT_PULLDOWN_3D: Oefening3d = {
  naam: 'Lat pulldown',
  sleutels: SLEUTELS,
  /** Stang onderin bij de borst valt op de helft van de lus. */
  start: startVoorSleutel(SLEUTELS, 3, 0.5),
  last: 'wereld',
  handen: 'greep',
  enkel: { x: 0.15, y: 0.08, z: 0.4 },
  voet: { kanteling: 0, uitdraai: 10 },
  knieRichting: { x: 0.2, y: 0.4, z: 1 },
  /** Ellebogen omlaag naar de broekzakken en iets naar achter: onder de stang, langs de zij. */
  elleboogRichting: { x: 0.7, y: -1.4, z: -0.45 },
  materiaal: [{ soort: 'kabelstation', plek: { x: 0, y: 0, z: 0 } }],
  spieren: ['rug'],
  spierenSecundair: ['bovenarm', 'schouder', 'onderarm'],
  /** Blik recht vooruit, licht omhoog naar de stang: de nek blijft neutraal. */
  blik: { hoek: -4, sterkte: 0.6 },
  camera: { hoek: 58, hoogte: 12, afstand: 4.0, doel: { x: 0, y: 1.0, z: -0.12 } },
}
