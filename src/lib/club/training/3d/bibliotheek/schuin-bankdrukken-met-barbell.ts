// 3D-oefening: Schuin bankdrukken met barbell. Naam exact zoals in de oefenbibliotheek.
// Bank op 35 graden, billen in de hoek van zitting en rugleuning, bovenrug plat
// tegen de leuning met de schouderbladen samen en laag, lichte boog in de
// onderrug. Voeten plat en iets breder dan de heupen op de vloer. Stang iets
// breder dan schouderbreedte, met gestrekte armen recht boven de schouders.
// Gecontroleerd zakken (2 tot 3 tellen) tot net onder de sleutelbeenderen,
// onderarmen verticaal, en recht terug omhoog tot boven de schouders.
//
// De romp is uitgerekend op de bank: bil op de zitting en de bovenrug op het
// vlak van de rugleuning (zie `schuineBank` in materiaal-banken).

import { houding } from '../bouw/basis'
import { romp, schouderIn } from '../kinematica'
import { ARM_GREEP, MATEN } from '../maten'
import type { Houding, Oefening3d } from '../typen'
import { Vector3 } from 'three'

/** Hoek van de rugleuning boven horizontaal. */
const HOEK = 35

/** Romp op de schuine bank: bil op de zitting, bovenrug tegen de leuning, lichte boog. */
const ROMP = {
  bekkenY: 0.519, bekkenZ: 0.089, kantel: -45, lende: -10, borst: -6, nek: 8,
  schouders: -0.035, greep: 0.33,
} as const

function stand(lastY: number, lastZ: number): Houding {
  return houding({ ...ROMP, lastY, lastZ })
}

/** Gestrekte armen (net niet op slot), de stang recht boven de schouders. */
function boven(): Houding {
  const s = schouderIn(stand(0, 0))
  const arm = (MATEN.bovenarm + ARM_GREEP) * 0.985
  const dx = ROMP.greep - s.x
  return stand(s.y + Math.sqrt(arm * arm - dx * dx), s.z)
}

/** De stang licht op de bovenste borst, net onder de sleutelbeenderen (frame van de borst). */
function onder(): Houding {
  const b = romp(stand(0, 0)).borst
  const p = new Vector3(0, 0.19, 0.132).applyQuaternion(b.rot).add(b.pos)
  return stand(p.y, p.z)
}

const BOVEN = boven()
const ONDER = onder()

/** Punt op de baan van boven naar onder; `naarHoofd` duwt de stang een fractie richting de schouders. */
function tussen(f: number, naarHoofd = 0): Houding {
  return stand(BOVEN.lastY + (ONDER.lastY - BOVEN.lastY) * f, BOVEN.lastZ + (ONDER.lastZ - BOVEN.lastZ) * f - naarHoofd)
}

export const SCHUIN_BANKDRUKKEN_BARBELL: Oefening3d = {
  naam: 'Schuin bankdrukken met barbell',
  // 2,4 s gecontroleerd omlaag, kort stil op de borst, 1,1 s krachtig omhoog, even stil boven.
  sleutels: [
    { houding: BOVEN, vast: 0.35, naarVolgende: 0.8 },
    { houding: tussen(0.35), vast: 0, naarVolgende: 0.8 },
    { houding: tussen(0.72), vast: 0, naarVolgende: 0.8 },
    { houding: ONDER, vast: 0.35, naarVolgende: 0.35 },
    { houding: tussen(0.68, 0.012), vast: 0, naarVolgende: 0.35 },
    { houding: tussen(0.3, 0.008), vast: 0, naarVolgende: 0.4 },
  ],
  last: 'wereld',
  handen: 'greep',
  enkel: { x: 0.22, y: 0.08, z: 0.55 },
  voet: { kanteling: 0, uitdraai: 14 },
  knieRichting: { x: 0.3, y: 0.8, z: 0.5 },
  elleboogRichting: { x: 0.6, y: -0.55, z: 0.45 },
  materiaal: [{ soort: 'bankSchuin', hoek: HOEK, plek: { x: 0, y: 0, z: 0 } }, { soort: 'stang', schijven: 2 }],
  spieren: ['borst', 'schouder', 'bovenarm'],
  camera: { hoek: 42, hoogte: 12, afstand: 3.7, doel: { x: 0, y: 0.86, z: -0.05 } },
}
