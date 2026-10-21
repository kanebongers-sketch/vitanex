// 3D-oefening: Superman. Naam exact zoals in de oefenbibliotheek.
// Op de buik op de mat, armen gestrekt boven het hoofd en benen gestrekt op
// heupbreedte, voeten met neus en wreef op de mat. Billen en buik licht aan, dan tegelijk armen,
// borst en benen een klein stukje van de mat: lang maken naar voren en naar
// achteren, niet hoog. Het hoofd blijft in het verlengde van de rug met de blik
// op de mat. 1 tel omhoog, 2 tot 3 tellen vasthouden, 2 tellen rustig omlaag.

import { voetVoor } from '../bouw/liggend'
import { houding, lus, metMoment } from '../bouw/basis'
import { schouderIn } from '../kinematica'
import { MATEN } from '../maten'
import type { Houding, Oefening3d } from '../typen'

const GRAAD = Math.PI / 180

/** Halve afstand tussen de enkels: benen op heupbreedte. */
const ENKEL_X = 0.1

/** Op de buik: heupgewricht net boven de mat, romp plat met het hoofd naar +z. */
const BUIKLIG = houding({ bekkenY: 0.098, bekkenZ: 0, kantel: 90, nek: 4 })

/** Armlengte tot de pols, net niet op slot. */
const ARM = (MATEN.bovenarm + MATEN.onderarm) * 0.993

/** Polsen recht voor de schouders: armen langs de oren, recht vooruit. */
const POLS_OPZIJ = 0.02

/** In rust raken neus en wreef van de schoen de mat (180 = tenen recht naar achteren, zool omhoog); opgetild strekken de voeten lang naar achteren. */
const VOET_KANTEL = 140
const VOET_STREK = 30

/** Pols in rust op de mat (handpalm plat). */
const POLS_MAT = 0.032

/**
 * De polsen gestrekt voor het hoofd: bij t = 0 in rust op de mat, bij t = 1
 * `optil` graden boven de lijn van de bovenrug (negatief = eronder).
 */
function handen(h: Houding, t: number, optil: number) {
  const s = schouderIn(h)
  const rust = Math.asin(Math.max(-1, Math.min(1, (POLS_MAT - s.y) / ARM))) / GRAAD
  const rug = -(h.lende + h.borst)
  const hoek = (rust + (rug + optil - rust) * t) * GRAAD
  return { lastY: s.y + Math.sin(hoek) * ARM, lastZ: s.z + Math.cos(hoek) * ARM, greep: s.x + POLS_OPZIJ }
}

/** p.t = 0 in rust op de mat, 1 = armen, borst en benen een paar centimeter los. */
function maak(p: { t: number }): Houding {
  const h = houding({
    ...BUIKLIG,
    // Onderrug en bovenrug strekken samen een beetje: lengte, geen knik.
    lende: -4 * p.t,
    borst: -6 * p.t,
    // Hoofd in het verlengde van de rug, blik op de mat.
    nek: 4 - 1 * p.t,
    schouders: -0.012 * p.t,
  })
  // Gestrekte benen vanuit de heup: in rust licht omlaag naar de mat, opgetild net boven de lijn van de romp.
  const voet = voetVoor(h, { dij: -87.4 - 8.5 * p.t, knie: 2 - 1.5 * p.t, strek: 52 }, ENKEL_X)
  return { ...h, ...handen(h, p.t, -12), ...voet, voetKantel: VOET_KANTEL + VOET_STREK * p.t }
}

const BASIS: Oefening3d = {
  naam: 'Superman',
  sleutels: [],
  last: 'wereld',
  handen: 'plat',
  enkel: { x: ENKEL_X, y: 0, z: 0 },
  voet: { kanteling: 0, uitdraai: 0 },
  // Knieen wijzen naar de mat (een fractie gebogen, niet op slot).
  knieRichting: { x: 0, y: -1, z: 0 },
  // Ellebogen gestrekt, een fractie naar buiten en omlaag.
  elleboogRichting: { x: 0.15, y: -1, z: 0 },
  // Twee matten die overlappen vormen een lange mat: handen en voeten liggen er allebei op.
  materiaal: [
    { soort: 'mat', plek: { x: 0, y: 0, z: 0.24 } },
    { soort: 'mat', plek: { x: 0, y: 0, z: -0.2 } },
  ],
  spieren: ['onderrug', 'bil'],
  spierenSecundair: ['hamstring', 'rug', 'schouder'],
  camera: { hoek: 88, hoogte: 12, afstand: 6.0, doel: { x: 0, y: 0.16, z: 0.02 } },
}

export const SUPERMAN: Oefening3d = metMoment({
  ...BASIS,
  sleutels: lus({ t: 0 }, { t: 1 }, maak, { begin: 0.5, heen: 1.0, eind: 2.2, terug: 2.0 }, 2),
})
