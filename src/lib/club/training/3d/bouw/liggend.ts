// ─── Fit Factory Club, 3D-oefenbeelden: bouwstenen buik liggend (PUUR) ──────
// Oefeningen op de rug waarbij de benen van de vloer komen: reverse crunch
// (bekken oprollen met de knieen in een vaste hoek), leg raise (gestrekte benen
// heffen en afremmen) en hollow hold (banaan vasthouden).
//
// De benen worden uitgerekend vanuit de heup (voorwaartse kinematica in het
// zijvlak): zo volgt de enkel een echte boog, blijft de knie in dezelfde hoek
// en staat de voet in het verlengde van het onderbeen. De enkels gaan daarna
// via de kanalen voetY, voetZ en voetKantel naar de inverse kinematica.

import { Vector3 } from 'three'
import { heupIn, schouderIn } from '../kinematica'
import { ARM_GREEP, MATEN } from '../maten'
import type { Camera, Houding, Lichaamsdeel, Oefening3d } from '../typen'
import { houding, lus, metMoment, steunOp, TEMPO } from './basis'

const GRAAD = Math.PI / 180

/** Op de rug: heupgewricht op 10,5 cm, hoofd licht gebogen op de mat (zoals de crunch). */
export const RUGLIG = houding({ bekkenY: 0.105, bekkenZ: 0, kantel: -90, nek: 12 })

/** Richting in het zijvlak, `hoek` graden gemeten van recht omlaag naar voren (+z). */
function richting(hoek: number): Vector3 {
  const a = hoek * GRAAD
  return new Vector3(0, -Math.cos(a), Math.sin(a))
}

/** Een been in het zijvlak: dij onder `dij` graden (vanaf omlaag, wereld) en de knie `knie` graden gebogen. */
export interface BeenStand {
  readonly dij: number
  readonly knie: number
  /** Gestrekte voet (graden, positief = tenen weg van het scheenbeen). */
  readonly strek: number
}

/**
 * De voetkanalen voor deze beenstand, met de linkerenkel op `enkelX` (de enkel
 * van de oefening staat op x = enkelX, y = 0, z = 0). De afstand heup-enkel is
 * in 3D precies die van de gekozen kniebuiging, ook als de enkels dichter bij
 * elkaar staan dan de heupen.
 */
export function voetVoor(h: Houding, been: BeenStand, enkelX: number): Partial<Houding> {
  const heup = heupIn(h)
  const dij = richting(been.dij)
  const scheen = richting(been.dij - been.knie)
  const enkel2d = dij.clone().multiplyScalar(MATEN.dij).addScaledVector(scheen, MATEN.scheen)
  const dx = enkelX - heup.x
  const lengte = enkel2d.length()
  const vlak = Math.sqrt(Math.max(0, lengte * lengte - dx * dx))
  const enkel = heup.clone().addScaledVector(enkel2d.normalize(), vlak)
  // Kanteling van de voet in het verlengde van het onderbeen, doorlopend genomen.
  let kantel = Math.atan2(-scheen.z, -scheen.y) / GRAAD
  if (kantel > 90) kantel -= 360
  return { voetY: enkel.y, voetZ: enkel.z, voetKantel: kantel + been.strek }
}

/** Plek van de linkerhand (pols of greep) vanuit de schouder in richting `hoek` (zijvlak) met `opzij` meter naar buiten. */
function handVanuitSchouder(h: Houding, hoek: number, reik: number, lengte: number, opzij: number, hoogte?: number) {
  const s = schouderIn(h)
  const r = richting(hoek)
  const hand = s.clone().addScaledVector(r, lengte * reik)
  return { lastY: hoogte ?? hand.y, lastZ: hand.z, greep: s.x + opzij }
}

function liggend(naam: string, enkelX: number, deel: {
  spieren: readonly Lichaamsdeel[]
  spierenSecundair?: readonly Lichaamsdeel[]
  camera: Camera
  handen: 'greep' | 'plat'
  knieRichting: { x: number; y: number; z: number }
  elleboogRichting: { x: number; y: number; z: number }
  matZ?: number
}): Oefening3d {
  return {
    naam,
    sleutels: [],
    last: 'wereld',
    handen: deel.handen,
    enkel: { x: enkelX, y: 0, z: 0 },
    voet: { kanteling: 0, uitdraai: 0 },
    knieRichting: deel.knieRichting,
    elleboogRichting: deel.elleboogRichting,
    materiaal: [{ soort: 'mat', plek: { x: 0, y: 0, z: deel.matZ ?? -0.1 } }],
    spieren: deel.spieren,
    ...(deel.spierenSecundair ? { spierenSecundair: deel.spierenSecundair } : {}),
    camera: deel.camera,
  }
}

/** Pols op de mat (handpalm plat), zoals bij de push-up. */
const POLS_Y = 0.035

/**
 * Reverse crunch: op de rug, armen naast het lichaam met de handpalmen op de
 * mat, knieen in een rechte hoek boven de heupen. Het bekken rolt op richting de
 * ribben tot de billen net los zijn (1 tel), kort stil, en rolt in 2 tellen
 * terug. De knieen houden dezelfde hoek, de borst blijft liggen.
 */
export function reverseCrunch(naam: string, camera?: Camera): Oefening3d {
  const enkelX = 0.085
  const basis = liggend(naam, enkelX, {
    spieren: ['romp'],
    handen: 'plat',
    // Knieen wijzen omhoog en iets naar het hoofd.
    knieRichting: { x: 0.08, y: 0.25, z: -1 },
    elleboogRichting: { x: 1, y: 0.2, z: 0 },
    camera: camera ?? { hoek: 72, hoogte: 14, afstand: 3.8, doel: { x: 0, y: 0.3, z: -0.12 } },
  })
  // Het punt van de bovenrug dat op de mat ligt blijft op zijn plek.
  const BOVENRUG = { x: 0, y: 0.12, z: -0.11 }
  const rug = steunOp(RUGLIG, { x: 0, y: 0, z: 0 }, BOVENRUG)
  const anker = { x: 0, y: -rug.bekkenY + RUGLIG.bekkenY, z: -rug.bekkenZ + RUGLIG.bekkenZ }
  // Handen naast de heupen, armen bijna gestrekt langs het lichaam.
  const hand = handVanuitSchouder(RUGLIG, 90, 0.988, MATEN.bovenarm + MATEN.onderarm, 0.06, POLS_Y)
  const maak = (p: { r: number }) => {
    const rol = 24 * p.r
    const romp = steunOp(
      houding({ ...RUGLIG, kantel: -90 - rol, lende: 0.62 * rol, borst: 0.38 * rol, schouders: -0.004 * p.r }),
      anker,
      BOVENRUG,
    )
    // Dij net voorbij loodrecht op het bekken (knieen boven de heupen): rolt mee met het bekken.
    const voet = voetVoor(romp, { dij: 180 + rol + 4, knie: 92, strek: 18 }, enkelX)
    return { ...romp, ...hand, ...voet }
  }
  return metMoment({ ...basis, sleutels: lus({ r: 0 }, { r: 1 }, maak, { begin: 0.5, heen: 1.1, eind: 0.5, terug: 2.0 }, 1) })
}

/**
 * Leg raise liggend: handen plat onder de billen, benen bijna gestrekt en
 * tegen elkaar. Vanuit stilstand net boven de mat in 2 tellen omhoog tot de
 * benen recht omhoog wijzen, dan in 3 tellen afremmen tot net boven de mat.
 * Onderrug blijft liggen (bekken iets naar achteren gekanteld).
 */
export function legRaise(naam: string, camera?: Camera): Oefening3d {
  const enkelX = 0.055
  const lig = houding({ ...RUGLIG, bekkenY: 0.118, kantel: -93, lende: 3, schouders: -0.04 })
  const basis = liggend(naam, enkelX, {
    spieren: ['romp'],
    spierenSecundair: ['dij'],
    handen: 'plat',
    // Knie licht gebogen: de knieschijf wijst schuin omhoog naar het hoofd.
    knieRichting: { x: 0.06, y: 0.7, z: -0.7 },
    elleboogRichting: { x: 1, y: 0.1, z: 0 },
    camera: camera ?? { hoek: 74, hoogte: 12, afstand: 4.2, doel: { x: 0, y: 0.38, z: 0.02 } },
  })
  // Polsen onder de billen, vingers naar de voeten.
  const hand = { lastY: 0.03, lastZ: heupIn(lig).z + 0.09, greep: 0.095 }
  const maak = (p: { a: number }) => {
    // a = graden boven de mat (5 = net boven de grond, 88 = recht omhoog).
    const voet = voetVoor(lig, { dij: 90 + p.a, knie: 5, strek: 22 }, enkelX)
    return { ...lig, ...hand, ...voet }
  }
  return metMoment({ ...basis, sleutels: lus({ a: 6 }, { a: 88 }, maak, { begin: 0.5, heen: 2.0, eind: 0.4, terug: 3.0 }, 5) })
}

/**
 * Hollow hold: onderrug in de mat, ribben omlaag. Schouders, armen (naast de
 * oren) en gestrekte benen een stukje van de mat: een lichte banaan. Kin licht
 * naar de borst. De lus is de rustige ademhaling tijdens het vasthouden.
 */
export function hollowHold(naam: string, camera?: Camera): Oefening3d {
  const enkelX = 0.055
  const basis = liggend(naam, enkelX, {
    spieren: ['romp'],
    spierenSecundair: ['dij'],
    handen: 'greep',
    knieRichting: { x: 0.06, y: 1, z: -0.3 },
    elleboogRichting: { x: 1, y: 0.3, z: 0 },
    matZ: -0.18,
    camera: camera ?? { hoek: 76, hoogte: 13, afstand: 4.3, doel: { x: 0, y: 0.25, z: -0.15 } },
  })
  const maak = (p: { a: number }) => {
    // Bekken naar achteren gekanteld (onderrug plat), bovenrug opgerold tot de schouderbladen los zijn.
    const h = houding({ ...RUGLIG, bekkenY: 0.108, kantel: -95, lende: 9 + 0.5 * p.a, borst: 20 + 1.5 * p.a, nek: 10, schouders: 0.02 })
    // Armen langs de oren, iets boven de lijn van de romp.
    const romp = h.kantel + h.lende + h.borst
    const hand = handVanuitSchouder(h, 186 - romp, 0.995, MATEN.bovenarm + ARM_GREEP, 0.025)
    const voet = voetVoor(h, { dij: 90 + 18 - 0.8 * p.a, knie: 4, strek: 30 }, enkelX)
    return { ...h, ...hand, ...voet }
  }
  return { ...basis, sleutels: lus({ a: 0 }, { a: 1 }, maak, TEMPO.houden, 1) }
}
