// 3D-oefening: Bankdrukken met smalle greep. Naam exact zoals in de oefenbibliotheek.
// Op de rug op een vlakke bank in het rek, voeten plat op de vloer,
// schouderbladen samen en laag, lichte boog in de onderrug. Handen op
// schouderbreedte, recht boven de schouders (niet tegen elkaar). De stang zakt
// naar de onderste borst met de ellebogen dicht langs de romp, onderarmen
// verticaal, en gaat recht omhoog tot de armen gestrekt zijn: werk voor de
// triceps.
//
// Zelfde romp op de bank als bankdrukken met barbell, alleen de greep, de
// ellebogen en de baan van de stang (rechter, geen J-boog) zijn anders.

import { houding } from '../bouw/basis'
import { romp, schouderIn } from '../kinematica'
import { ARM_GREEP, MATEN } from '../maten'
import type { Houding, Oefening3d } from '../typen'
import { Vector3 } from 'three'

/** Romp met lichte boog: bekken op de bank, lende hol, bovenrug plat, borst omhoog. Handen op schouderbreedte. */
const ROMP = {
  bekkenY: 0.52, bekkenZ: 0.24, kantel: -68, lende: -15, borst: -13, nek: 6,
  schouders: -0.04, greep: 0.19,
} as const

function stand(lastY: number, lastZ: number): Houding {
  return houding({ ...ROMP, lastY, lastZ })
}

/** Gestrekte armen (net niet op slot), de stang boven de borst net voor de schouders. */
function boven(): Houding {
  const s = schouderIn(stand(0, 0))
  const arm = (MATEN.bovenarm + ARM_GREEP) * 0.985
  const z = s.z + 0.05
  const dx = ROMP.greep - s.x
  const dz = z - s.z
  return stand(s.y + Math.sqrt(arm * arm - dx * dx - dz * dz), z)
}

/** De stang licht op de onderste borst (frame van de borst), iets lager dan bij de brede greep. */
function onder(): Houding {
  const b = romp(stand(0, 0)).borst
  const p = new Vector3(0, 0.045, 0.121).applyQuaternion(b.rot).add(b.pos)
  return stand(p.y, p.z)
}

const BOVEN = boven()
const ONDER = onder()

/** Punt op de (bijna rechte) baan van boven naar onder. */
function tussen(f: number, naarHoofd = 0): Houding {
  return stand(BOVEN.lastY + (ONDER.lastY - BOVEN.lastY) * f, BOVEN.lastZ + (ONDER.lastZ - BOVEN.lastZ) * f - naarHoofd)
}

export const BANKDRUKKEN_SMALLE_GREEP: Oefening3d = {
  naam: 'Bankdrukken met smalle greep',
  // 2 s gecontroleerd omlaag, kort stil op de borst, 1 s omhoog, boven even stil met gestrekte armen.
  sleutels: [
    { houding: BOVEN, vast: 0.4, naarVolgende: 0.68 },
    { houding: tussen(0.35), vast: 0, naarVolgende: 0.66 },
    { houding: tussen(0.72), vast: 0, naarVolgende: 0.66 },
    { houding: ONDER, vast: 0.3, naarVolgende: 0.32 },
    { houding: tussen(0.66, 0.01), vast: 0, naarVolgende: 0.32 },
    { houding: tussen(0.3, 0.006), vast: 0, naarVolgende: 0.36 },
  ],
  last: 'wereld',
  handen: 'greep',
  enkel: { x: 0.21, y: 0.08, z: 0.42 },
  voet: { kanteling: 0, uitdraai: 10 },
  knieRichting: { x: 0.08, y: 1, z: 0.3 },
  // Ellebogen dicht langs de romp, richting de heupen.
  elleboogRichting: { x: 0.22, y: -0.5, z: 0.9 },
  materiaal: [{ soort: 'bank', plek: { x: 0, y: 0, z: -0.24 } }, { soort: 'stang', schijven: 2 }],
  spieren: ['bovenarm', 'borst'],
  spierenSecundair: ['schouder'],
  camera: { hoek: 44, hoogte: 12, afstand: 3.5, doel: { x: 0, y: 0.72, z: 0.02 } },
}
