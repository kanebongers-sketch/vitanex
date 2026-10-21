// 3D-oefening: Achterwaartse lunge (lichaamsgewicht). Naam exact zoals in de oefenbibliotheek.
// Handen in de zij, ellebogen naar buiten. De linkervoet blijft staan, de
// rechtervoet stapt een grote pas terug op heupbreedte (twee rails) en landt op
// de bal van de voet. Daarna zakt de heup als een lift recht omlaag tot de
// achterste knie net boven de vloer hangt: voorste scheen bijna verticaal, dij
// ongeveer horizontaal, twee hoeken van ongeveer 90 graden. Het gewicht blijft
// op de voorste hiel, de romp rechtop met de blik vooruit. Omhoog duwt het
// voorste been, de achterste voet volgt en komt terug naast de andere.
// Tempo volgens de coaching: 2 tellen omlaag, kort stil, 1 tel terug.

import { bereikbaar, HEUP_STAAND, houding, opTenen } from '../bouw/basis'
import type { Houding, Oefening3d, Sleutel } from '../typen'

/** Afstand die de rechterenkel naar achteren gaat (m). */
const PAS = 0.96
/** Hielhoek van de achterste voet op de bal van de voet (graden). */
const HIEL = 40
/** Handen in de zij: net boven de bekkenkam, in het frame van het bekken. */
const ZIJ = { lastY: 0.125, lastZ: 0.0, greep: 0.19 } as const

const BASIS: Oefening3d = {
  naam: 'Achterwaartse lunge',
  sleutels: [],
  last: 'bekken',
  handen: 'greep',
  materiaal: [],
  // Ellebogen naar buiten en iets naar achteren, vuisten op de heupen.
  elleboogRichting: { x: 1, y: 0, z: -0.3 },
  greepRichting: { x: 0, y: 0, z: 1 },
  // Voeten op heupbreedte, als op twee rails.
  enkel: { x: 0.11, y: 0.08, z: 0 },
  voet: { kanteling: 0, uitdraai: 4 },
  knieRichting: { x: 0.08, y: 0, z: 1 },
  spieren: ['dij', 'bil'],
  spierenSecundair: ['hamstring'],
  camera: { hoek: -75, hoogte: 11, afstand: 4.5, doel: { x: 0, y: 0.78, z: -0.4 } },
}

interface Stand {
  /** Hoogte en voor/achter van het heupgewricht. */
  readonly y: number
  readonly z: number
  /** Rompkanteling voorover (graden). */
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
    nek: -Math.max(0, s.romp + s.borst),
    schouders: -0.01,
    stapKantel: s.hiel,
    stapY: s.til + tenen.voetY,
    stapZ: -PAS * s.stap + tenen.voetZ,
    ...ZIJ,
  })
  return bereikbaar(BASIS, h)
}

const STAAND: Stand = { y: HEUP_STAAND - 0.004, z: 0, romp: 3, borst: -1, stap: 0, til: 0, hiel: 0 }
/** Rechtervoet zweeft naar achteren, het bekken zakt al iets mee. */
const ZWEEF_TERUG: Stand = { y: 0.885, z: -0.12, romp: 4, borst: -1.5, stap: 0.55, til: 0.07, hiel: 18 }
/** Landing op de bal van de voet, achterste been nog bijna gestrekt. */
const LANDING: Stand = { y: 0.765, z: -0.36, romp: 5, borst: -2, stap: 1, til: 0, hiel: HIEL }
const HALF: Stand = { y: 0.665, z: -0.405, romp: 5, borst: -2.5, stap: 1, til: 0, hiel: HIEL }
/** Onderin: voorste scheen bijna verticaal, achterste knie net boven de vloer. */
const ONDER: Stand = { y: 0.545, z: -0.435, romp: 5, borst: -3, stap: 1, til: 0, hiel: HIEL }
/** Krachtig omhoog vanuit de voorste hiel, gewicht naar het voorste been. */
const DUW: Stand = { y: 0.7, z: -0.33, romp: 6, borst: -2, stap: 1, til: 0, hiel: HIEL + 5 }
/** De achterste voet komt los en zwaait naar voren. */
const ZWEEF_VOOR: Stand = { y: 0.89, z: -0.08, romp: 4, borst: -1.5, stap: 0.45, til: 0.07, hiel: 22 }

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

export const ACHTERWAARTSE_LUNGE: Oefening3d = { ...BASIS, sleutels: SLEUTELS }
