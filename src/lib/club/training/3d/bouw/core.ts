// ─── Fit Factory Club, 3D-oefenbeelden: bouwstenen core (PUUR) ──────────────
// Plank (vasthouden met rustige ademhaling), zijplank (op de zij, op een
// onderarm) en crunch (bovenrug oprollen).

import { Vector3 } from 'three'
import { BEEN, figuurIn, heupIn, schouderIn } from '../kinematica'
import { MATEN } from '../maten'
import type { Camera, Houding, Oefening3d } from '../typen'
import { houding, lus, rechtsNaar, steunOp, TEMPO } from './basis'

/** Het schoudergewricht in het frame van de borst. */
const SCHOUDER_IN_BORST = { x: 0, y: 0.25, z: -0.02 }

/**
 * Plank op de onderarmen: ellebogen onder de schouders, lichaam een rechte lijn
 * van hielen tot hoofd, op de tenen. De lus is de ademhaling tijdens het houden.
 */
export function plank(naam: string, camera?: Camera): Oefening3d {
  const schouderY = 0.35
  // Zoek de kanteling waarbij het lichaam recht is en de enkels op ongeveer 0,13 m staan.
  let kantel = 78
  let h: Houding = houding({})
  let enkel = new Vector3()
  for (let i = 0; i < 6; i++) {
    h = steunOp(houding({ kantel, nek: -14, schouders: 0.01 }), { x: 0, y: schouderY, z: 0.1 }, SCHOUDER_IN_BORST)
    const heup = heupIn(h)
    const s = schouderIn(h)
    const lijn = new Vector3(0, s.y - heup.y, s.z - heup.z).normalize()
    enkel = new Vector3(heup.x + 0.01, heup.y, heup.z).addScaledVector(lijn, -BEEN * 0.985)
    kantel -= (enkel.y - 0.13) * 40
  }
  const s = schouderIn(h)
  const o: Oefening3d = {
    naam,
    sleutels: [],
    last: 'wereld',
    handen: 'plat',
    enkel: { x: 0.1, y: enkel.y, z: enkel.z },
    voet: { kanteling: 68, uitdraai: 0 },
    knieRichting: { x: 0, y: -1, z: 0.1 },
    elleboogRichting: { x: 0.05, y: -1, z: -0.35 },
    materiaal: [{ soort: 'mat', plek: { x: 0, y: 0, z: -0.45 } }],
    spieren: ['romp', 'schouder'],
    camera: camera ?? { hoek: 66, hoogte: 13, afstand: 4.0, doel: { x: 0, y: 0.25, z: -0.42 } },
  }
  const handen = { lastY: 0.03, lastZ: s.z + 0.27, greep: 0.11 }
  const maak = (p: { a: number }) => ({ ...h, ...handen, bekkenY: h.bekkenY + 0.006 * p.a, borst: 1.5 * p.a, schouders: 0.01 + 0.004 * p.a })
  return { ...o, sleutels: lus({ a: 0 }, { a: 1 }, maak, TEMPO.houden, 1) }
}

/** Op de linkerzij: eerst om de lengteas gerold, dan gekanteld tot het lichaam schuin oploopt. */
const ZIJ = { rol: -90 } as const

/** Alleen om de heupen door te rekenen (benen en armen doen er niet toe). */
const LEEG_ZIJ: Oefening3d = {
  naam: '',
  sleutels: [],
  last: 'wereld',
  handen: 'plat',
  enkel: { x: 0.1, y: 0.08, z: 0 },
  voet: { kanteling: 0, uitdraai: 0 },
  knieRichting: { x: 0, y: 0, z: 1 },
  elleboogRichting: { x: 0, y: 0, z: -1 },
  materiaal: [],
  spieren: [],
  camera: { hoek: 0, hoogte: 0, afstand: 3, doel: { x: 0, y: 0, z: 0 } },
}

/** Het linker schoudergewricht in het frame van de borst. */
const LINKER_SCHOUDER = { x: MATEN.schouder.x, y: MATEN.schouder.y, z: MATEN.schouder.z }

/**
 * Zijplank op de linkeronderarm: elleboog recht onder de schouder, onderarm
 * plat naar voren, voeten op elkaar op de buitenkant van de linkervoet. Het
 * lichaam is een rechte lijn van enkels tot hoofd, de heupen hoog. De
 * rechterhand rust op de heup. De lus is de ademhaling tijdens het houden, met
 * de heup een fractie omhoog bij het uitademen.
 */
export function zijplank(naam: string, camera?: Camera): Oefening3d {
  const schouderY = 0.35
  let kantel = 78
  let h: Houding = houding({})
  let enkel = new Vector3()
  for (let i = 0; i < 8; i++) {
    h = steunOp(houding({ ...ZIJ, kantel, schouders: 0.012 }), { x: 0, y: schouderY, z: 0.1 }, LINKER_SCHOUDER)
    const heup = heupIn(h)
    const lijn = new Vector3(0, Math.cos(kantel * (Math.PI / 180)), Math.sin(kantel * (Math.PI / 180)))
    enkel = heup.clone().addScaledVector(lijn, -BEEN * 0.995)
    kantel -= (enkel.y - 0.055) * 40
  }
  // Rechterenkel op de linker (een voet hoger), even ver van de rechterheup: het been blijft gestrekt.
  const rechtsHeup = figuurIn(LEEG_ZIJ, h).benen[1].begin
  const opLinks = enkel.clone().add(new Vector3(0.0, 0.088, -0.01))
  const rechts = rechtsHeup.clone().add(opLinks.sub(rechtsHeup).normalize().multiplyScalar(BEEN * 0.995))
  // De elleboog komt recht onder de linkerschouder.
  const schouder = schouderIn(h)
  const o: Oefening3d = {
    naam,
    sleutels: [],
    last: 'wereld',
    handen: 'plat',
    enkel: { x: enkel.x, y: enkel.y, z: enkel.z },
    enkelRechts: { x: rechts.x, y: rechts.y, z: rechts.z },
    // Voeten op hun zij: tenen naar voren (-x), buitenkant van de linkervoet op de vloer.
    voet: { kanteling: 0, uitdraai: -90, rol: -90 },
    voetRechts: { kanteling: 0, uitdraai: 90, rol: 90 },
    knieRichting: { x: -1, y: 0, z: 0 },
    knieRichtingRechts: { x: -1, y: 0, z: 0 },
    elleboogRichting: { x: 1, y: -1, z: 0 },
    elleboogRichtingRechts: { x: 0.5, y: 0.8, z: -0.3 },
    materiaal: [{ soort: 'mat', plek: { x: 0, y: 0, z: -0.45 } }],
    spieren: ['romp'],
    spierenSecundair: ['schouder', 'bil'],
    camera: camera ?? { hoek: -72, hoogte: 14, afstand: 4.0, doel: { x: 0, y: 0.3, z: -0.4 } },
  }
  // Onderarm plat naar voren (-x), de pols net boven de mat.
  const links = { lastY: 0.03, lastZ: schouder.z + 0.02, greep: schouder.x - 0.25, draai: -90, draaiRechts: 90 }
  const maak = (p: { a: number }) => {
    const basis = { ...h, ...links, bekkenY: h.bekkenY + 0.004 * p.a, borst: 1.2 * p.a, schouders: 0.012 + 0.004 * p.a }
    const heup = figuurIn(o, basis).benen[1].begin
    return rechtsNaar(o, basis, { x: heup.x - 0.03, y: heup.y + 0.1, z: heup.z + 0.06 })
  }
  return { ...o, sleutels: lus({ a: 0 }, { a: 1 }, maak, TEMPO.houden, 1) }
}

/**
 * Crunch: op de rug, knieen gebogen, voeten plat. Handen op de borst, de
 * bovenrug rolt op tot de schouderbladen los zijn; onderrug blijft liggen.
 */
export function crunch(naam: string, camera?: Camera): Oefening3d {
  const lig = houding({ bekkenY: 0.105, bekkenZ: 0, kantel: -90, nek: 12, schouders: 0 })
  const o: Oefening3d = {
    naam,
    sleutels: [],
    last: 'romp',
    handen: 'greep',
    enkel: { x: 0.13, y: 0.08, z: 0.5 },
    voet: { kanteling: 0, uitdraai: 6 },
    knieRichting: { x: 0.25, y: 1, z: 0.3 },
    elleboogRichting: { x: 1, y: -0.15, z: 0 },
    materiaal: [{ soort: 'mat', plek: { x: 0, y: 0, z: -0.1 } }],
    spieren: ['romp'],
    camera: camera ?? { hoek: 70, hoogte: 16, afstand: 3.8, doel: { x: 0, y: 0.25, z: -0.05 } },
  }
  const handen = { lastY: 0.17, lastZ: 0.15, greep: 0.06 }
  const maak = (p: { d: number }) => ({ ...lig, ...handen, lende: 6 * p.d, borst: 30 * p.d, nek: 12 + 10 * p.d, schouders: -0.01 * p.d })
  return { ...o, sleutels: lus({ d: 0 }, { d: 1 }, maak, { begin: 0.5, heen: 1.1, eind: 0.6, terug: 1.6 }, 1) }
}
