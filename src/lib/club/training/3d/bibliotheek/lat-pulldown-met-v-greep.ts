// 3D-oefening: Lat pulldown met V-greep. Naam exact zoals in de oefenbibliotheek.
// Zittend in het latstation, bovenbenen onder het kussen, een klein beetje
// achterover en op die hoek blijven. V-greep met de handpalmen naar elkaar.
// Eerst de schouders omlaag met gestrekte armen, dan de ellebogen omlaag en iets
// naar achteren langs het lichaam tot de greep bij de bovenste borst is; de borst
// komt de greep tegemoet. Rustig terug tot de armen gestrekt zijn (rek in de rug).
// Tempo: 1 tel omlaag, kort stil, 2 tot 3 tellen omhoog.
// Camera schuin van voren en opzij: lichte hoek van de romp, ellebogen langs de
// zij en de greep die voor het gezicht langs naar de borst gaat.

import { houding } from '../bouw/basis'
import { startVoorSleutel } from '../interpolatie'
import { schouderIn } from '../kinematica'
import type { Houding, Oefening3d, Sleutel } from '../typen'

const ZIT = { bekkenY: 0.555, bekkenZ: -0.04 } as const

/** Halve afstand tussen de handen in de V-greep (handvatten ongeveer 12 cm uit elkaar). */
const GREEP_X = 0.06

/** Een houding met de handen op een plek ten opzichte van de linkerschouder (m). */
function stand(lichaam: Partial<Houding>, dy: number, dz: number): Houding {
  const h = houding({ ...ZIT, ...lichaam })
  const s = schouderIn(h)
  return { ...h, lastY: s.y + dy, lastZ: s.z + dz, greep: GREEP_X }
}

/** Armen boven het hoofd: net niet op slot, handen iets voor de schouders. */
const ARM_BOVEN = { dy: 0.628, dz: 0.06 } as const

/** Bovenin: armen lang, schouders omhoog getrokken door de stapel (rek onder de oksels). */
const BOVEN = stand({ kantel: -9, lende: -2, borst: 0, nek: 6, schouders: 0.05 }, ARM_BOVEN.dy, ARM_BOVEN.dz)

/** Schouders eerst omlaag, armen nog gestrekt: de greep zakt alleen mee met de schouders. */
const SCHOUDERS_LAAG = stand({ kantel: -10, lende: -2, borst: -2, nek: 7, schouders: -0.03 }, ARM_BOVEN.dy, ARM_BOVEN.dz)

/** Halverwege: de greep gaat voor het gezicht langs, ellebogen naar de heupen. */
const MIDDEN = stand({ kantel: -10, lende: -3, borst: -4, nek: 8, schouders: -0.035 }, 0.18, 0.29)

/** Onderin: greep bij de bovenste borst, borst omhoog naar de greep, romp op dezelfde kleine hoek. */
const ONDER = stand({ kantel: -10, lende: -3, borst: -7, nek: 10, schouders: -0.035 }, -0.07, 0.236)

const SLEUTELS: readonly Sleutel[] = [
  { houding: BOVEN, vast: 0.5, naarVolgende: 0.3 },
  { houding: SCHOUDERS_LAAG, vast: 0.15, naarVolgende: 0.6 },
  { houding: MIDDEN, vast: 0, naarVolgende: 0.45 },
  { houding: ONDER, vast: 0.5, naarVolgende: 1.3 },
  { houding: MIDDEN, vast: 0, naarVolgende: 1.2 },
]

export const LAT_PULLDOWN_V_GREEP: Oefening3d = {
  naam: 'Lat pulldown met V-greep',
  sleutels: SLEUTELS,
  // Onderin (greep bij de borst) valt op de helft van de lus.
  start: startVoorSleutel(SLEUTELS, 3),
  last: 'wereld',
  handen: 'greep',
  enkel: { x: 0.15, y: 0.08, z: 0.4 },
  voet: { kanteling: 0, uitdraai: 10 },
  knieRichting: { x: 0.2, y: 0.4, z: 1 },
  elleboogRichting: { x: 0.4, y: -1, z: -0.35 },
  // Handvatten van voor naar achter: de handpalmen kijken naar elkaar.
  greepRichting: { x: 0, y: 0, z: 1 },
  materiaal: [{ soort: 'kabelstation', greep: 'vgreep', plek: { x: 0, y: 0, z: 0 } }],
  spieren: ['rug', 'bovenarm'],
  spierenSecundair: ['schouder', 'onderarm'],
  camera: { hoek: 58, hoogte: 8, afstand: 5.0, doel: { x: 0, y: 1.12, z: 0.1 } },
}
