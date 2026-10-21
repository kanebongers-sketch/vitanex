// 3D-oefening: Step-up (lichaamsgewicht). Naam exact zoals in de oefenbibliotheek.
// Een vlakke bank staat dwars voor het figuur (kussen op 0,43 m: de knie komt
// niet boven de heup). De linkervoet staat de hele lus met de hele voet op het
// kussen, de rechtervoet begint plat op de vloer voor de bank. Handen op de
// bekkenkam, ellebogen naar opzij.
// Omhoog: licht voorover leunen en via de linkerhiel duwen; de rechtervoet komt
// direct los van de vloer (niet afzetten) en zweeft over de rand naast de
// linkervoet. Bovenaan staat het figuur rechtop op de bank, de linkerknie in
// lijn met de tenen. Omlaag remt het linkerbeen: de rechtervoet zakt in twee
// tellen terug en landt zacht met de tenen eerst op de vloer. Bij het afremmen
// gaat de heup naar achteren en de romp iets voorover: de knie blijft boven de voet.
// Tempo volgens de coaching: 1 tel op, 2 tellen gecontroleerd af.

import { balanceer, BLIK, bereikbaar, houding, metMoment, opTenen } from '../bouw/basis'
import type { Houding, Oefening3d, Sleutel } from '../typen'

/** Bovenkant van het kussen van de bank (m). */
const BANK_HOOGTE = 0.43
/** Midden van de bank (dwars, 0,30 m diep): de hele linkervoet staat erop. */
const BANK_Z = 0.055
/** Halve afstand tussen de voeten: heupbreedte. */
const SPOOR = 0.11
/** Rechterenkel op de vloer, een korte pas achter de linkerenkel (m). */
const ACHTER = -0.42
/** Handen op de bekkenkam, handpalm plat op de heup, vingers naar voren en iets naar binnen. */
const ZIJ = { lastY: 0.07, lastZ: 0.01, greep: 0.172, draai: -32 } as const

const BASIS: Oefening3d = {
  naam: 'Step-up',
  sleutels: [],
  last: 'bekken',
  handen: 'plat',
  materiaal: [{ soort: 'bankKaal', plek: { x: 0, y: 0, z: BANK_Z }, draai: 90 }],
  // Handen op de bekkenkam, ellebogen naar opzij, handpalm plat op de heup.
  elleboogRichting: { x: 1, y: 0, z: -0.2 },
  greepRichting: { x: 0, y: -1, z: 0 },
  // Linkervoet plat op het kussen, rechts plat op de vloer (twee rails).
  enkel: { x: SPOOR, y: BANK_HOOGTE + 0.08, z: 0 },
  enkelRechts: { x: -SPOOR, y: 0.08, z: ACHTER },
  voet: { kanteling: 0, uitdraai: 2 },
  // De knie wijst naar de tenen en valt niet naar binnen.
  knieRichting: { x: 0.18, y: 0, z: 1 },
  spieren: ['dij', 'bil'],
  spierenSecundair: ['hamstring'],
  blik: BLIK.vooruit,
  // Bijna van opzij op borsthoogte: werkbeen, hele voet op de bank en de achterste voet plat op de vloer.
  camera: { hoek: 70, hoogte: 14, afstand: 4.05, doel: { x: 0, y: 1.15, z: 0.0 } },
}

interface Stand {
  /** Hoogte van het heupgewricht (m) en waar het zwaartepunt boven moet liggen (z). */
  readonly y: number
  readonly doel: number
  /** Rompkanteling voorover (graden) en bovenrug (negatief = borst omhoog). */
  readonly romp: number
  readonly borst: number
  /** Rechtervoet: verschuiving vanaf de vloer (m) en kanteling (positief = tenen omlaag). */
  readonly stapY: number
  readonly stapZ: number
  readonly kantel: number
  /** Rechtervoet staat op de tenen (draait om de bal van de voet). */
  readonly opTenen?: boolean
}

function maak(s: Stand): Houding {
  const tenen = s.opTenen ? opTenen(s.kantel) : { voetY: 0, voetZ: 0 }
  const h = houding({
    bekkenY: s.y,
    bekkenZ: s.doel,
    kantel: s.romp,
    lende: 0,
    borst: s.borst,
    schouders: -0.01,
    stapKantel: s.kantel,
    stapY: s.stapY + tenen.voetY,
    stapZ: s.stapZ + tenen.voetZ,
    ...ZIJ,
  })
  return bereikbaar(BASIS, balanceer(BASIS, h, s.doel), 0.985)
}

const OP_BANK = { stapY: BANK_HOOGTE, stapZ: -ACHTER } as const

/** Start: linkervoet op de bank, rechts plat op de vloer, romp rechtop. */
const START: Stand = { y: 0.94, doel: -0.22, romp: 6, borst: -2, stapY: 0, stapZ: 0, kantel: 0 }
/** Licht voorover, gewicht naar de linkerhiel; de rechtervoet raakt de vloer nog net. */
const DRUK: Stand = { y: 0.96, doel: -0.06, romp: 25, borst: -3, stapY: 0, stapZ: 0, kantel: 0 }
/** De rechtervoet komt los: tenen licht op, geen afzet. */
const LOS: Stand = { y: 1.08, doel: 0.02, romp: 22, borst: -3, stapY: 0.1, stapZ: 0.08, kantel: -6 }
/** Rechtervoet hoog achter de rand van de bank, het linkerbeen strekt. */
const OVER: Stand = { y: 1.25, doel: 0.04, romp: 11, borst: -2, stapY: 0.52, stapZ: 0.14, kantel: 4 }
/** Bovenaan: rechtop op de bank, beide voeten op het kussen. */
const BOVEN: Stand = { y: 1.43, doel: 0.04, romp: 3, borst: -1, ...OP_BANK, kantel: 0 }
/** Omlaag: de rechtervoet zakt direct achter de rand, het linkerbeen begint te remmen. */
const AF: Stand = { y: 1.3, doel: -0.05, romp: 17, borst: -2, stapY: 0.46, stapZ: 0.11, kantel: 4 }
/** Rechtervoet hangt boven de vloer, linkerknie diep gebogen en boven de voet. */
const ZAK: Stand = { y: 1.04, doel: -0.15, romp: 30, borst: -3, stapY: 0.11, stapZ: 0.03, kantel: 18 }
/** Zachte landing: de tenen van de rechtervoet raken eerst de vloer. */
const LAND: Stand = { y: 0.96, doel: -0.12, romp: 13, borst: -2.5, stapY: 0, stapZ: 0, kantel: 22, opTenen: true }

const START_SLEUTEL = maak(START)

/** Negen sleutels: de vijfde (helft van de lus) is de stand bovenop de bank. */
const SLEUTELS: Sleutel[] = [
  { houding: START_SLEUTEL, vast: 0.44, naarVolgende: 0.3 },
  { houding: maak(DRUK), vast: 0.05, naarVolgende: 0.28 },
  { houding: maak(LOS), vast: 0, naarVolgende: 0.31 },
  { houding: maak(OVER), vast: 0, naarVolgende: 0.28 },
  { houding: maak(BOVEN), vast: 0.5, naarVolgende: 0.55 },
  { houding: maak(AF), vast: 0, naarVolgende: 0.65 },
  { houding: maak(ZAK), vast: 0, naarVolgende: 0.55 },
  { houding: maak(LAND), vast: 0.08, naarVolgende: 0.32 },
  { houding: START_SLEUTEL, vast: 0.3, naarVolgende: 0.05 },
]

export const STEP_UP: Oefening3d = metMoment({ ...BASIS, sleutels: SLEUTELS })
