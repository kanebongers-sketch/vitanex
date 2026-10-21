// 3D-oefening: Goblet squat. Naam exact zoals in de oefenbibliotheek.
// Eigen houdingen: de dumbbell staat verticaal tegen het borstbeen met de handen
// onder de bovenste schijf, onderin zakken de ellebogen tussen de knieen, de dij
// komt net onder horizontaal, de blik blijft vooruit. Tempo volgens de coaching:
// 3 tellen omlaag, kort stil, 1 tel omhoog.

import { balanceer, HEUP_STAAND, houding, lus, type Tempo } from '../bouw/basis'
import type { Houding, Oefening3d } from '../typen'

/** Hoogte van de heup onderin: dij net onder horizontaal, ellebogen tussen de knieen. */
const DIEPTE = 0.31
/** Hoogte van de heup bovenaan: knieen net niet op slot. */
const BOVEN = HEUP_STAAND - 0.022
/** Bekkenkanteling onderin: lichte voorover-lean, zo komen de ellebogen bij de knieen. */
const KANTEL = 27
/** Gewicht van de dumbbell voor het zwaartepunt (fractie van het lichaam). */
const GEWICHT = 0.2

/** Handen onder de bovenste schijf; die schijf rust tegen het borstbeen onder de kin (borstframe). */
const LAST = { lastY: 0.2, lastZ: 0.12, greep: 0.045 } as const

const TEMPO_GOBLET: Tempo = { begin: 0.5, heen: 3.0, eind: 0.6, terug: 1.0 }

const BASIS: Oefening3d = {
  naam: 'Goblet squat',
  sleutels: [],
  last: 'romp',
  handen: 'greep',
  materiaal: [{ soort: 'halterStaand' }],
  elleboogRichting: { x: -0.35, y: -1, z: 0.45 },
  // Handpalmen naar boven als een kom onder de schijf, geen hamergreep om de stang.
  greepRichting: { x: 1, y: 0, z: 0.35 },
  enkel: { x: 0.25, y: 0.08, z: 0 },
  voet: { kanteling: 0, uitdraai: 26 },
  // Knieen ver naar buiten, in lijn met de tenen: de ellebogen zakken er onderin tussen.
  knieRichting: { x: 0.95, y: 0, z: 1 },
  spieren: ['dij', 'bil'],
  camera: { hoek: 45, hoogte: 9, afstand: 4.2, doel: { x: 0, y: 0.82, z: 0 } },
}

function maak(p: { d: number }): Houding {
  const d = p.d
  const kantel = 5 + (KANTEL - 5) * d
  const lende = 0
  const borst = -3 * d
  // Blik vooruit: de nek vangt bijna de hele rompkanteling op.
  const nek = Math.max(-28, -(kantel + lende + borst) * 0.9)
  const h = houding({
    bekkenY: BOVEN + (DIEPTE - BOVEN) * d,
    bekkenZ: -0.1 * d,
    kantel,
    lende,
    borst,
    nek,
    schouders: 0.005,
    ...LAST,
  })
  let uit = h
  for (let i = 0; i < 2; i++) uit = { ...balanceer(BASIS, uit, 0.05, GEWICHT), ...LAST }
  return uit
}

/**
 * De lus begint een derde van de weg omlaag. Zo valt het stilstaan onderin precies
 * op de helft van de lus en het stilstaan boven op driekwart.
 */
const LUS = lus({ d: 0 }, { d: 1 }, maak, TEMPO_GOBLET, 2)

export const GOBLET_SQUAT: Oefening3d = { ...BASIS, sleutels: [...LUS.slice(1), LUS[0]] }
