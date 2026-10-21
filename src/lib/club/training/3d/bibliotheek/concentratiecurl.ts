// 3D-oefening: Concentratiecurl. Naam exact zoals in de oefenbibliotheek.
// Eenarmig: zittend dwars op een bank, voeten breed, romp vanuit de heupen licht
// voorover. De achterkant van de linker bovenarm rust tegen de binnenkant van de
// linkerdij, vlak voor de knie. Alleen de onderarm beweegt: de halter komt in
// 1 tel omhoog naar de schouder (handpalm naar je toe), kort knijpen en in 2
// tellen terug tot de arm bijna gestrekt is. De rechterhand steunt plat op de
// rechterknie. Polsen recht, romp en bovenarm stil.

import { Vector3 } from 'three'
import { figuurIn, schouderIn } from '../kinematica'
import { ARM_GREEP, MATEN } from '../maten'
import type { Houding, Oefening3d } from '../typen'
import { houding, lus, metMoment, rechtsNaar } from '../bouw/basis'

const GRAAD = Math.PI / 180

/** Romp: zittend op de bank (zitvlak 0,43 m), vanuit de heupen voorover, rug lang. */
const ROMP = houding({ bekkenY: 0.535, bekkenZ: -0.1, kantel: 34, lende: 2, borst: 6, nek: -14, schouders: -0.01, draai: 180 })

/** Waar de elleboog tegen de dij rust: binnenkant van de linkerdij, een hand voor de knie. */
const ELLEBOOG_DOEL = new Vector3(0.12, 0.5, 0.3)

const S = schouderIn(ROMP)
/** Bovenarm van de schouder naar de dij, precies een bovenarm lang. */
const BOVENARM = ELLEBOOG_DOEL.clone().sub(S).normalize()
const ELLEBOOG = S.clone().addScaledVector(BOVENARM, MATEN.bovenarm)
/** De onderarm buigt naar de borst en de andere schouder: loodrecht op de bovenarm. */
const BUIG = new Vector3(-0.3, 1, 0.05).addScaledVector(BOVENARM, -new Vector3(-0.3, 1, 0.05).dot(BOVENARM)).normalize()

/** De greep bij een elleboogbuiging (graden). */
function hand(buiging: number): Vector3 {
  const b = buiging * GRAAD
  const onder = BOVENARM.clone().multiplyScalar(Math.cos(b)).addScaledVector(BUIG, Math.sin(b))
  return ELLEBOOG.clone().addScaledVector(onder, ARM_GREEP)
}

const BASIS: Oefening3d = {
  naam: 'Concentratiecurl',
  sleutels: [],
  last: 'wereld',
  handen: 'greep',
  handenRechts: 'plat',
  greepAnatomisch: true,
  enkel: { x: 0.3, y: 0.08, z: 0.36 },
  voet: { kanteling: 0, uitdraai: 22 },
  knieRichting: { x: 0.55, y: 0.35, z: 1 },
  elleboogRichting: { x: -BUIG.x, y: -BUIG.y, z: -BUIG.z },
  elleboogRichtingRechts: { x: -0.75, y: -0.1, z: -0.6 },
  materiaal: [{ soort: 'bankKaal', draai: 90, plek: { x: 0, y: 0, z: -0.14 } }, { soort: 'halters', zijde: 'links' }],
  spieren: ['bovenarm'],
  spierenSecundair: ['onderarm'],
  camera: { hoek: -30, hoogte: 14, afstand: 3.9, doel: { x: 0, y: 0.72, z: 0.18 } },
}

/** De rechterhand plat op de rechterknie, vingers over de knieschijf. */
function opKnie(h: Houding): Houding {
  const knie = figuurIn(BASIS, h).benen[1].midden
  return rechtsNaar(BASIS, h, { x: knie.x + 0.01, y: knie.y + 0.075, z: knie.z - 0.06 })
}

function stand(p: { buiging: number }): Houding {
  const g = hand(p.buiging)
  return opKnie({ ...ROMP, greep: g.x, lastY: g.y, lastZ: g.z, draaiRechts: -195 })
}

export const CONCENTRATIECURL: Oefening3d = metMoment({
  ...BASIS,
  sleutels: lus({ buiging: 14 }, { buiging: 124 }, stand, { begin: 0.4, heen: 1.1, eind: 0.5, terug: 2.0 }, 3),
})
