// 3D-oefening: Achterwaartse lunge met dumbbells. Naam exact zoals in de oefenbibliotheek.
// Eigen houdingen: de linkervoet blijft staan, de rechtervoet stapt een ruime pas
// terug en landt op de bal van de voet. Daarna zakt het bekken recht omlaag tot de
// achterste knie net boven de vloer hangt; de voorste scheen staat dan verticaal en
// de dij ongeveer horizontaal. De romp blijft rechtop, de dumbbells hangen stil
// langs het lichaam aan gestrekte armen. Omhoog gaat het krachtig vanuit de voorste
// hiel en de achterste voet komt in een vloeiende beweging terug naast de andere.
// Tempo volgens de coaching: 2 tellen omlaag, kort stil, 1 tel terug.

import { schouderIn } from '../kinematica'
import { bereikbaar, HEUP_STAAND, houding, opTenen } from '../bouw/basis'
import type { Houding, Oefening3d, Sleutel } from '../typen'

/** Afstand die de rechterenkel naar achteren gaat (m). */
const PAS = 0.98
/** Hielhoek van de achterste voet op de bal van de voet (graden). */
const HIEL = 40
/** Halve afstand tussen de dumbbells: hangen naast de dijen. */
const GREEP = 0.265

const BASIS: Oefening3d = {
  naam: 'Achterwaartse lunge met dumbbells',
  sleutels: [],
  last: 'hangend',
  handen: 'greep',
  materiaal: [{ soort: 'halters' }],
  elleboogRichting: { x: 0.3, y: 0, z: -1 },
  // Handpalmen naar het lichaam: de dumbbells wijzen naar voren.
  greepRichting: { x: 0, y: 0, z: 1 },
  // Voeten op heupbreedte, als op twee rails.
  enkel: { x: 0.11, y: 0.08, z: 0 },
  voet: { kanteling: 0, uitdraai: 4 },
  knieRichting: { x: 0.08, y: 0, z: 1 },
  spieren: ['dij', 'bil'],
  camera: { hoek: -75, hoogte: 11, afstand: 4.5, doel: { x: 0, y: 0.76, z: -0.4 } },
}

interface Stand {
  /** Hoogte en voor/achter van het heupgewricht. */
  readonly y: number
  readonly z: number
  /** Rompkanteling voorover (graden), verdeeld over bekken en rug. */
  readonly romp: number
  /** Bovenrug: negatief = borst omhoog. */
  readonly borst: number
  /** Rechtervoet: deel van de pas (0 tot 1), hoogte boven de vloer en hielhoek. */
  readonly stap: number
  readonly til: number
  readonly hiel: number
}

function maak(s: Stand): Houding {
  const tenen = opTenen(s.hiel)
  const h = houding({
    bekkenY: s.y,
    bekkenZ: s.z,
    kantel: s.romp,
    lende: 0,
    borst: s.borst,
    // Blik recht vooruit: de nek vangt de kleine rompkanteling op.
    nek: -Math.max(0, s.romp - 1),
    schouders: -0.012,
    stapKantel: s.hiel,
    stapY: s.til + tenen.voetY,
    stapZ: -PAS * s.stap + tenen.voetZ,
  })
  const vast = bereikbaar(BASIS, h)
  // Armen hangen recht onder de schouders: de dumbbells zwaaien niet mee.
  return { ...vast, greep: GREEP, lastZ: schouderIn(vast).z }
}

const STAAND: Stand = { y: HEUP_STAAND - 0.004, z: 0, romp: 3, borst: -1, stap: 0, til: 0, hiel: 0 }
/** Rechtervoet zweeft naar achteren, het bekken zakt al iets mee. */
const ZWEEF_TERUG: Stand = { y: 0.885, z: -0.12, romp: 3, borst: -1.5, stap: 0.55, til: 0.07, hiel: 18 }
/** Landing op de bal van de voet, achterste been nog bijna gestrekt. */
const LANDING: Stand = { y: 0.765, z: -0.37, romp: 4, borst: -2, stap: 1, til: 0, hiel: HIEL }
const HALF: Stand = { y: 0.665, z: -0.415, romp: 3, borst: -2.5, stap: 1, til: 0, hiel: HIEL }
/** Onderin: voorste scheen verticaal, achterste knie net boven de vloer. */
const ONDER: Stand = { y: 0.545, z: -0.445, romp: 3, borst: -3, stap: 1, til: 0, hiel: HIEL }
/** Krachtig omhoog vanuit de voorste hiel, gewicht naar het voorste been. */
const DUW: Stand = { y: 0.7, z: -0.34, romp: 3.5, borst: -2, stap: 1, til: 0, hiel: HIEL + 5 }
/** De achterste voet komt los en zwaait naar voren. */
const ZWEEF_VOOR: Stand = { y: 0.89, z: -0.08, romp: 3, borst: -1.5, stap: 0.45, til: 0.07, hiel: 22 }

const STAND_SLEUTEL = maak(STAAND)

/** Acht sleutels: de vijfde (helft van de lus) is de onderste stand. */
const SLEUTELS: Sleutel[] = [
  { houding: STAND_SLEUTEL, vast: 0.2, naarVolgende: 0.32 },
  { houding: maak(ZWEEF_TERUG), vast: 0, naarVolgende: 0.3 },
  { houding: maak(LANDING), vast: 0.12, naarVolgende: 0.55 },
  { houding: maak(HALF), vast: 0, naarVolgende: 0.5 },
  { houding: maak(ONDER), vast: 0.35, naarVolgende: 0.35 },
  { houding: maak(DUW), vast: 0, naarVolgende: 0.2 },
  { houding: maak(ZWEEF_VOOR), vast: 0, naarVolgende: 0.2 },
  { houding: STAND_SLEUTEL, vast: 0.83, naarVolgende: 0.05 },
]

export const ACHTERWAARTSE_LUNGE_DB: Oefening3d = { ...BASIS, sleutels: SLEUTELS }
