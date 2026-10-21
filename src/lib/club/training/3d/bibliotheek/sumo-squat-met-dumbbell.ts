// 3D-oefening: Sumo squat met dumbbell. Naam exact zoals in de oefenbibliotheek.
// Brede stand, ruim breder dan de schouders, tenen schuin naar buiten. Een
// dumbbell hangt verticaal tussen de benen: beide handen onder de bovenste
// kop, armen gestrekt en stil recht onder de schouders. De heup zakt recht naar
// beneden alsof je langs een muur glijdt, de knieen gaan naar buiten in de lijn
// van de tenen en de romp blijft vrijwel rechtop met de blik vooruit. Onderin
// ligt de dij ongeveer horizontaal en hangt de onderste kop een handbreedte
// boven de vloer. Tempo volgens de coaching: 3 tellen omlaag, kort stil, 1 tel omhoog.

import { balanceer, HEUP_STAAND, houding, lus } from '../bouw/basis'
import { schouderIn } from '../kinematica'
import type { Houding, Oefening3d } from '../typen'

/** Hoogte van het heupgewricht onderin: dij ongeveer horizontaal in de brede stand. */
const DIEPTE = 0.52
/** Bekken onderin voorover (graden): de romp blijft vrijwel rechtop. */
const KANTEL = 22
/** Gewicht van de dumbbell voor het zwaartepunt (fractie van het lichaam). */
const GEWICHT = 0.2
/** Zwaartepunt boven het midden van de voet. */
const DOEL_Z = 0.04
/** Halve afstand tussen de handen: vingers in elkaar onder de bovenste kop. */
const GREEP = 0.04
/** Hoe ver de handen boven voor de schouders hangen (m): de bovenste kop vrij van de dijen. */
const VOOR_BOVEN = 0.13

const BASIS: Oefening3d = {
  naam: 'Sumo squat met dumbbell',
  sleutels: [],
  last: 'hangend',
  handen: 'greep',
  materiaal: [{ soort: 'halterStaand' }],
  elleboogRichting: { x: 0.3, y: 0, z: -1 },
  // Brede stand, tenen schuin naar buiten; de knieen volgen de tenen.
  enkel: { x: 0.34, y: 0.08, z: 0 },
  voet: { kanteling: 0, uitdraai: 38 },
  knieRichting: { x: 0.8, y: 0, z: 1 },
  spieren: ['dij', 'bil'],
  spierenSecundair: ['hamstring', 'romp'],
  // Bijna recht van voren: de brede stand, de knieen boven de tenen en de dumbbell tussen de benen.
  camera: { hoek: 30, hoogte: 10, afstand: 4.3, doel: { x: 0, y: 0.82, z: 0 } },
}

/**
 * Armen hangen gestrekt en stil. Boven hangt de bovenste kop voor het kruis
 * (een paar cm voor de lijn van de schouders); zodra de dijen opzij gaan zakt de
 * dumbbell recht onder de schouders tussen de benen door.
 */
function zetLast(h: Houding, d: number): Houding {
  const voor = VOOR_BOVEN * (1 - d) ** 1.5
  return { ...h, greep: GREEP, lastZ: schouderIn(h).z + 0.01 + voor }
}

function maak(p: { d: number }): Houding {
  const d = p.d
  const kantel = 4 + (KANTEL - 4) * d
  const borst = -3 * d
  const romp = houding({
    bekkenY: HEUP_STAAND - 0.03 + (DIEPTE - HEUP_STAAND + 0.03) * d,
    bekkenZ: -0.05 * d,
    kantel,
    lende: 0,
    borst,
    // Blik vooruit: de nek vangt de kleine rompkanteling op.
    nek: -(kantel + borst) * 0.9,
    schouders: -0.015,
  })
  let uit = zetLast(romp, d)
  for (let i = 0; i < 3; i++) uit = zetLast(balanceer(BASIS, uit, DOEL_Z, GEWICHT), d)
  return uit
}

export const SUMO_SQUAT_DB: Oefening3d = {
  ...BASIS,
  kniePad: true,
  sleutels: lus({ d: 0 }, { d: 1 }, maak, { begin: 0.5, heen: 3.0, eind: 0.4, terug: 1.1 }, 2),
}
