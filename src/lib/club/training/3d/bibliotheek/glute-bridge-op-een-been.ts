// 3D-oefening: Glute bridge op een been. Naam exact zoals in de oefenbibliotheek.
// Op de rug op een mat, de linkervoet plat met de hiel dicht bij de bil, het
// rechterbeen gestrekt in het verlengde van het linkerbovenbeen. Armen naast
// het lichaam, handpalmen op de grond. Duw via de hiel de heupen omhoog met het
// bekken waterpas, minder hoog dan bij de gewone bridge (geen holle rug), twee
// tellen vasthouden en rustig zakken. Het vrije been zweeft stil mee: het blijft
// in elke stand in lijn met het bovenbeen van het standbeen, de voet ontspannen.
// Camera van rechts en wat hoger, zodat beide benen los van elkaar te zien zijn.

import { Vector3 } from 'three'
import { heupstrek } from '../bouw/benen'
import { lus, metMoment, steunOp, houding } from '../bouw/basis'
import { figuurIn } from '../kinematica'
import { BEEN } from '../maten'
import type { Houding, Oefening3d } from '../typen'

const GRAAD = Math.PI / 180
/** Bovenrug op de mat; dit punt van de borst ligt op de steun. */
const STEUN = { x: 0, y: 0.02, z: -0.25 } as const
const RUG_PUNT = { x: 0, y: 0.14, z: -0.1 } as const
/** Bekkenkanteling onderin (plat) en bovenin (minder hoog dan op twee benen). */
const ONDER = -90
const BOVEN = -108
/** Het vrije been: gestrekt maar niet op slot (reik van het been). */
const REIK_VRIJ = 0.997
/** Voet van het vrije been ontspannen: tenen half gestrekt (graden voorbij haaks op het been). */
const VOET_ONTSPANNEN = 38

const BASIS: Oefening3d = {
  ...heupstrek({ naam: 'Glute bridge op een been', steun: 'vloer', last: 'geen' }),
  // Standvoet zo dat de knie onderin ongeveer 125 en bovenin 110 graden buigt.
  enkel: { x: 0.12, y: 0.08, z: 0.52 },
  spieren: ['bil'],
  spierenSecundair: ['hamstring', 'romp'],
  camera: { hoek: -70, hoogte: 24, afstand: 4.2, doel: { x: 0, y: 0.38, z: 0.12 } },
}

/** Zet de rechterenkel in het verlengde van het linkerbovenbeen. */
function vrijBeen(h: Houding): Houding {
  const f = figuurIn(BASIS, h)
  const links = f.benen[0]
  const dij = links.midden.clone().sub(links.begin).normalize()
  const heup = f.benen[1].begin
  // De rechterenkel blijft op zijn x (gespiegeld van links); y en z volgen de dij.
  const dx = -BASIS.enkel.x - heup.x
  const vlak = Math.sqrt((REIK_VRIJ * BEEN) ** 2 - dx * dx)
  const richting = new Vector3(0, dij.y, dij.z).normalize()
  const enkel = heup.clone().add(richting.multiplyScalar(vlak))
  const hoek = Math.atan2(richting.y, richting.z) / GRAAD
  return {
    ...h,
    stapY: enkel.y - BASIS.enkel.y,
    stapZ: enkel.z - BASIS.enkel.z,
    stapKantel: -(hoek + 90) + VOET_ONTSPANNEN,
  }
}

function maak({ d }: { d: number }): Houding {
  const h = houding({ kantel: ONDER + (BOVEN - ONDER) * d, lende: 0, borst: 0, nek: 6, schouders: -0.01 })
  const opMat = steunOp(h, STEUN, RUG_PUNT)
  return vrijBeen({ ...opMat, lastY: 0.03, lastZ: STEUN.z + 0.36, greep: 0.25 })
}

// 1 tel omhoog, 2 tellen vasthouden, 2 tellen omlaag (coaching).
export const GLUTE_BRIDGE_EEN_BEEN: Oefening3d = metMoment({
  ...BASIS,
  sleutels: lus({ d: 0 }, { d: 1 }, maak, { begin: 0.4, heen: 1.0, eind: 2.0, terug: 2.0 }, 1),
})
