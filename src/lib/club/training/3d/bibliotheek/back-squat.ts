// 3D-oefening: Back squat. Naam exact zoals in de oefenbibliotheek.
// Stang hoog op de bovenrug, voeten iets breder dan de heupen, tenen licht naar
// buiten. Heupen naar achteren en omlaag tot de dij ongeveer horizontaal is,
// knieen in de lijn van de tenen, borst omhoog en blik vooruit.
// Onderin rechte rug (lende en borst 0) en de nek strekt mee, zodat de blik
// schuin vooruit op de vloer ligt. Heupplooi op kniehoogte. Camera meer van
// opzij (58 graden) en hoger (40 graden), zodat de verre schijf boven het hoofd
// staat en romphoek, diepte en stangbaan leesbaar zijn.

import { houding } from '../bouw/basis'
import type { Oefening3d } from '../typen'

const SQUAT_BOVEN = houding({
  bekkenY: 0.946, bekkenZ: 0, kantel: 1, lende: 0, borst: 0, nek: 0,
  schouders: 0.01, lastY: 0.25, lastZ: -0.125, greep: 0.48,
})
const SQUAT_ONDER = houding({
  bekkenY: 0.44, bekkenZ: -0.2, kantel: 44, lende: 0, borst: 0, nek: -30,
  schouders: 0, lastY: 0.25, lastZ: -0.125, greep: 0.48,
})

export const BACK_SQUAT_3D: Oefening3d = {
  naam: 'Back squat',
  sleutels: [
    { houding: SQUAT_BOVEN, vast: 0.7, naarVolgende: 2.0 },
    { houding: SQUAT_ONDER, vast: 0.25, naarVolgende: 1.3 },
  ],
  last: 'romp',
  handen: 'greep',
  enkel: { x: 0.16, y: 0.08, z: 0 },
  voet: { kanteling: 0, uitdraai: 18 },
  knieRichting: { x: 0.5, y: 0, z: 1 },
  elleboogRichting: { x: 0.2, y: -1, z: -0.7 },
  materiaal: [{ soort: 'stang', schijven: 2 }],
  spieren: ['dij', 'bil'],
  camera: { hoek: 58, hoogte: 40, afstand: 4.6, doel: { x: 0, y: 0.88, z: 0 } },
}
