// 3D-oefening: Bankdrukken met barbell. Naam exact zoals in de oefenbibliotheek.
// Op de rug op een vlakke bank, voeten plat en iets naar achteren op de vloer,
// schouderbladen samen en laag. Lichte boog in de onderrug (bekken gekanteld,
// lende hol, bovenrug plat op de bank), billen blijven liggen. De stang zakt
// gecontroleerd en schuin naar de onderste borst en raakt die licht, onderarmen
// verticaal, ellebogen ongeveer 45 graden van de romp. Omhoog gaat de stang eerst
// terug richting de schouders en dan recht omhoog: de J-boog.

import { houding, metMoment } from '../bouw/basis'
import { schouderIn } from '../kinematica'
import { ARM_GREEP, MATEN } from '../maten'
import type { Houding, Oefening3d } from '../typen'

/** Romp met lichte boog: bekken op de bank, lende hol, bovenrug plat, borst omhoog. */
const ROMP = {
  bekkenY: 0.52, bekkenZ: 0.24, kantel: -68, lende: -15, borst: -13, nek: 0,
  schouders: -0.04, greep: 0.37,
} as const

function stand(lastY: number, lastZ: number): Houding {
  return houding({ ...ROMP, lastY, lastZ })
}

/** Gestrekte armen (net niet op slot) met de stang recht boven de schouders. */
function boven(): Houding {
  const s = schouderIn(stand(0, 0))
  const arm = (MATEN.bovenarm + ARM_GREEP) * 0.975
  const z = s.z + 0.03
  const dx = ROMP.greep - s.x
  const dz = z - s.z
  return stand(s.y + Math.sqrt(arm * arm - dx * dx - dz * dz), z)
}

const BOVEN = boven()
/** Stang licht op de onderste borst, net onder de lijn van de tepels. */
const ONDER = stand(0.672, 0.06)

/** Een punt op de rechte lijn tussen twee standen van de stang. */
function langs(a: Houding, b: Houding, f: number, extraZ = 0): Houding {
  return stand(a.lastY + (b.lastY - a.lastY) * f, a.lastZ + (b.lastZ - a.lastZ) * f + extraZ)
}

/** Omlaag in een rechte, schuine lijn naar de onderste borst. */
const ZAKKEN_1 = langs(BOVEN, ONDER, 0.35)
const ZAKKEN_2 = langs(BOVEN, ONDER, 0.72)
/** Omhoog eerst terug richting de schouders, dan recht omhoog: de J-boog. */
const DUWEN_1 = stand(ONDER.lastY + 0.1, ONDER.lastZ - 0.07)
const DUWEN_2 = stand(ONDER.lastY + (BOVEN.lastY - ONDER.lastY) * 0.62, BOVEN.lastZ - 0.01)

export const BANKDRUKKEN_3D: Oefening3d = metMoment({
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
  // Voeten plat, iets breder dan de heupen, knieen recht boven de voeten en het
  // scheenbeen licht naar achteren (enkel net achter de knie): stevige leg drive.
  enkel: { x: 0.21, y: 0.08, z: 0.56 },
  voet: { kanteling: 0, uitdraai: 10 },
  knieRichting: { x: 0.25, y: 0.3, z: 1 },
  // Onderin bovenarmen ongeveer 45 graden van de romp, onderarmen bijna verticaal.
  elleboogRichting: { x: 0.85, y: -0.2, z: 1 },
  materiaal: [{ soort: 'bank', plek: { x: 0, y: 0, z: -0.24 } }, { soort: 'stang', schijven: 2 }],
  spieren: ['borst'],
  spierenSecundair: ['bovenarm', 'schouder'],
  // Hoofd plat op de bank, ogen recht naar het plafond.
  blik: { hoek: -84 },
  // Schuin zijaanzicht vanaf de kant van heup en knieen, op borsthoogte: de J-boog,
  // de verticale onderarm en het raakpunt op de borst zijn te zien. Puur van opzij
  // staat de schijf voor de hand en de staander van het rek voor het hoofd.
  camera: { hoek: 66, hoogte: 11, afstand: 3.6, doel: { x: 0, y: 0.68, z: 0.04 } },
})
