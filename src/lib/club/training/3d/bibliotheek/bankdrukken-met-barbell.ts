// 3D-oefening: Bankdrukken met barbell. Naam exact zoals in de oefenbibliotheek.
// Op de rug op een vlakke bank, voeten plat en iets naar achteren op de vloer,
// schouderbladen samen en laag. Lichte boog in de onderrug (bekken gekanteld,
// lende hol, bovenrug plat op de bank), billen blijven liggen. De stang zakt
// gecontroleerd en schuin naar de onderste borst en raakt die licht, onderarmen
// verticaal, ellebogen ongeveer 45 graden van de romp. Omhoog gaat de stang eerst
// terug richting de schouders en dan recht omhoog: de J-boog.

import { houding } from '../bouw/basis'
import { schouderIn } from '../kinematica'
import { ARM_GREEP, MATEN } from '../maten'
import type { Houding, Oefening3d } from '../typen'

/** Romp met lichte boog: bekken op de bank, lende hol, bovenrug plat, borst omhoog. */
const ROMP = {
  bekkenY: 0.52, bekkenZ: 0.24, kantel: -68, lende: -15, borst: -13, nek: 6,
  schouders: -0.04, greep: 0.33,
} as const

function stand(lastY: number, lastZ: number): Houding {
  return houding({ ...ROMP, lastY, lastZ })
}

/** Gestrekte armen (net niet op slot) met de stang recht boven de schouders. */
function boven(): Houding {
  const s = schouderIn(stand(0, 0))
  const arm = (MATEN.bovenarm + ARM_GREEP) * 0.985
  const z = s.z + 0.03
  const dx = ROMP.greep - s.x
  const dz = z - s.z
  return stand(s.y + Math.sqrt(arm * arm - dx * dx - dz * dz), z)
}

const BOVEN = boven()
/** Stang licht op de onderste borst, op de lijn van de tepels. */
const ONDER = stand(0.672, -0.06)
/** Omlaag in een rechte, schuine lijn naar de onderste borst. */
const ZAKKEN_1 = stand(0.97, -0.13)
const ZAKKEN_2 = stand(0.8, -0.09)
/** Omhoog eerst terug richting de schouders, dan recht omhoog. */
const DUWEN_1 = stand(0.79, -0.11)
const DUWEN_2 = stand(0.96, -0.16)

export const BANKDRUKKEN_3D: Oefening3d = {
  naam: 'Bankdrukken met barbell',
  // 2 s gecontroleerd omlaag, kort stil op de borst, 1,1 s krachtig omhoog, even
  // stil boven. Het moment dat de stang de borst raakt valt midden in de lus.
  sleutels: [
    { houding: BOVEN, vast: 0.1, naarVolgende: 0.7 },
    { houding: ZAKKEN_1, vast: 0, naarVolgende: 0.65 },
    { houding: ZAKKEN_2, vast: 0, naarVolgende: 0.65 },
    { houding: ONDER, vast: 0.35, naarVolgende: 0.3 },
    { houding: DUWEN_1, vast: 0, naarVolgende: 0.35 },
    { houding: DUWEN_2, vast: 0, naarVolgende: 0.45 },
    { houding: BOVEN, vast: 0.45, naarVolgende: 0.01 },
  ],
  last: 'wereld',
  handen: 'greep',
  enkel: { x: 0.21, y: 0.08, z: 0.42 },
  voet: { kanteling: 0, uitdraai: 10 },
  knieRichting: { x: 0.08, y: 1, z: 0.3 },
  elleboogRichting: { x: 0.5, y: -0.5, z: 0.62 },
  materiaal: [{ soort: 'bank', plek: { x: 0, y: 0, z: -0.24 } }, { soort: 'stang', schijven: 2 }],
  spieren: ['borst', 'bovenarm', 'schouder'],
  camera: { hoek: 40, hoogte: 10, afstand: 3.5, doel: { x: 0, y: 0.72, z: 0.02 } },
}
