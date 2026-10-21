// 3D-oefening: Kettlebell swing. Naam exact zoals in de oefenbibliotheek.
// Een heupscharnier, geen squat: billen naar achteren, scheenbenen bijna
// rechtop, rug lang en blik een paar meter voor je. De romp blijft rechtop tot
// de onderarmen tegen de bovenbenen komen en scharniert dan pas ("hike").
// Bovenin staat het lichaam als een plank en zweeft de bel op borsthoogte in
// het verlengde van de armen.
// De bel hangt aan gestrekte armen: we geven per sleutel de hoek van de arm en
// rekenen daaruit de plek van de bel, zodat hij een echte boog rond de
// schouder maakt.

import { balanceer, houding } from '../bouw/basis'
import { HANG_STREK, schouderIn } from '../kinematica'
import { ARM_GREEP, MATEN } from '../maten'
import type { Houding, Oefening3d, Sleutel } from '../typen'

const GRAAD = Math.PI / 180
/** Halve afstand tussen de handen: beide handen naast elkaar om het handvat. */
const GREEP = 0.035
/** Zwaartepunt boven het midden van de voet. */
const BALANS_Z = 0.03

interface Stand {
  /** Gewenste hoogte van de heup (de balans houdt de knie net niet op slot). */
  readonly bekkenY: number
  readonly kantel: number
  readonly lende: number
  readonly borst: number
  readonly nek: number
  readonly schouders: number
  /** Hoek van de arm met de verticaal, 0 = recht omlaag, positief = naar voren. */
  readonly arm: number
  /**
   * Hoe zwaar de bel op dat moment trekt (aandeel in het zwaartepunt). Bovenin
   * zweeft hij bijna gewichtloos, onderin trekt hij hard naar achteren.
   */
  readonly gewicht: number
}

const BASIS: Oefening3d = {
  naam: 'Kettlebell swing',
  sleutels: [],
  last: 'hangend',
  handen: 'greep',
  // Iets breder dan heupbreedte, zodat de bel ruim tussen de benen door kan.
  enkel: { x: 0.24, y: 0.08, z: 0 },
  voet: { kanteling: 0, uitdraai: 12 },
  // Knieen licht naar buiten, in de lijn van de tenen.
  knieRichting: { x: 0.3, y: 0, z: 1 },
  elleboogRichting: { x: 0.15, y: 0, z: -1 },
  materiaal: [{ soort: 'kettlebell' }],
  spieren: ['bil', 'rug', 'dij'],
  camera: { hoek: 56, hoogte: 7, afstand: 4.3, doel: { x: 0, y: 0.88, z: 0.05 } },
}

/** Waar de bel hangt bij deze armhoek (alleen lastZ telt, de hoogte volgt uit de arm). */
function belZ(h: Houding, arm: number): number {
  const s = schouderIn(h)
  const lengte = (MATEN.bovenarm + ARM_GREEP) * HANG_STREK
  const dx = GREEP - s.x
  const vlak = Math.sqrt(lengte * lengte - dx * dx)
  return s.z + vlak * Math.sin(arm * GRAAD)
}

function maak({ arm, gewicht, ...romp }: Stand): Houding {
  let h = houding({ ...romp, greep: GREEP })
  for (let i = 0; i < 3; i++) {
    h = { ...h, lastZ: belZ(h, arm) }
    h = balanceer(BASIS, h, BALANS_Z, gewicht)
  }
  return { ...h, lastZ: belZ(h, arm) }
}

// Bovenin: rechtop als een plank, billen en buik aan, bel op borsthoogte.
const BOVEN: Stand = { bekkenY: 0.95, kantel: 1, lende: -2, borst: -1, nek: -2, schouders: -0.02, arm: 80, gewicht: 0.05 }
// De bel valt: de romp blijft rechtop, de armen zijn touwen.
const VAL: Stand = { bekkenY: 0.95, kantel: 3, lende: -2, borst: -2, nek: -2, schouders: -0.02, arm: 50, gewicht: 0.1 }
// Onderarmen raken de bovenbenen: pas nu gaan de heupen naar achteren.
const CONTACT: Stand = { bekkenY: 0.94, kantel: 14, lende: -1, borst: -3, nek: -4, schouders: -0.03, arm: 2, gewicht: 0.16 }
// Halverwege de hike: heupen naar achteren, scheenbenen blijven bijna rechtop.
const HIKE: Stand = { bekkenY: 0.925, kantel: 44, lende: -1, borst: -10, nek: -14, schouders: -0.04, arm: -28, gewicht: 0.2 }
// Onderin: heupscharnier, rug lang en borst open, bel tussen en achter de knieen.
const ONDER: Stand = { bekkenY: 0.905, kantel: 70, lende: -1, borst: -15, nek: -25, schouders: -0.04, arm: -50, gewicht: 0.2 }
// Heupen knallen naar voren, de bel komt tussen de benen vandaan.
const STREK: Stand = { bekkenY: 0.925, kantel: 38, lende: -1, borst: -8, nek: -8, schouders: -0.04, arm: -18, gewicht: 0.2 }
// Heupen bijna gestrekt, de bel zweeft mee omhoog.
const ZWEEF: Stand = { bekkenY: 0.95, kantel: 5, lende: -2, borst: -2, nek: -3, schouders: -0.02, arm: 48, gewicht: 0.1 }

const S = {
  boven: maak(BOVEN),
  val: maak(VAL),
  contact: maak(CONTACT),
  hike: maak(HIKE),
  onder: maak(ONDER),
  strek: maak(STREK),
  zweef: maak(ZWEEF),
}

// Tempo: kort zweven bovenin, vrij vallen, hike, kort keren onderin, explosief
// strekken. Een herhaling duurt ongeveer 1,8 seconden.
const SLEUTELS: Sleutel[] = [
  { houding: S.boven, vast: 0.08, naarVolgende: 0.22 },
  { houding: S.val, vast: 0, naarVolgende: 0.18 },
  { houding: S.contact, vast: 0, naarVolgende: 0.2 },
  { houding: S.hike, vast: 0, naarVolgende: 0.22 },
  { houding: S.onder, vast: 0.14, naarVolgende: 0.26 },
  { houding: S.strek, vast: 0, naarVolgende: 0.24 },
  { houding: S.zweef, vast: 0, naarVolgende: 0.28 },
]

export const KETTLEBELL_SWING: Oefening3d = { ...BASIS, sleutels: SLEUTELS }
