// 3D-oefening: Shoulder press machine. Naam exact zoals in de oefenbibliotheek.
// Zittend met de hele rug tegen de licht schuine leuning, voeten plat op de
// grond. De stoel staat zo dat de grepen onderin op schouderhoogte zitten,
// ellebogen onder de handen en iets voor het lichaam. Een tel omhoog tot de
// armen bijna gestrekt zijn (niet op slot), kort stil, dan twee tellen rustig
// terug tot de handen weer op schouderhoogte staan. De handen volgen de boog
// van de hefbomen (../bouw/schouderpress).

import { houding, lus, metMoment } from '../bouw/basis'
import { greepOpBoog } from '../bouw/schouderpress'
import { schouderIn } from '../kinematica'
import type { Houding, Oefening3d } from '../typen'

/** Romp: rug tegen de leuning (8 graden achterover), buik vast, geen holle rug. */
const ROMP = { bekkenY: 0.555, bekkenZ: 0, kantel: -8, lende: 0, borst: 0, nek: 0 }

/** De machine staat vast ten opzichte van de romp: de boog van de grepen hoort bij de schouder in rust. */
const SCHOUDER = schouderIn(houding(ROMP))

function maak(p: { f: number }): Houding {
  const g = greepOpBoog(p.f)
  // Bovenin gaan de schouderbladen een fractie mee omhoog, zoals bij elke press.
  return houding({ ...ROMP, schouders: 0.012 * p.f, lastY: SCHOUDER.y + g.dy, lastZ: SCHOUDER.z + g.dz, greep: SCHOUDER.x + g.dx })
}

const BASIS: Oefening3d = {
  naam: 'Shoulder press machine',
  sleutels: [],
  last: 'wereld',
  handen: 'greep',
  enkel: { x: 0.17, y: 0.08, z: 0.47 },
  voet: { kanteling: 0, uitdraai: 10 },
  knieRichting: { x: 0.2, y: 0.3, z: 1 },
  elleboogRichting: { x: 0.8, y: -0.8, z: 0.6 },
  materiaal: [{ soort: 'schouderPress' }],
  spieren: ['schouder'],
  spierenSecundair: ['bovenarm'],
  // Schuin van voren en iets van boven: rug tegen de leuning, de baan van de grepen en de hefbomen.
  camera: { hoek: 38, hoogte: 10, afstand: 4.5, doel: { x: 0, y: 1.02, z: 0.02 } },
  blik: { hoek: 4 },
}

// Onderin kort stil, 1 tel omhoog, kort stil bovenin, 2 tellen omlaag.
export const SHOULDER_PRESS_MACHINE: Oefening3d = metMoment({
  ...BASIS,
  sleutels: lus({ f: 0 }, { f: 1 }, maak, { begin: 0.45, heen: 1.1, eind: 0.3, terug: 2.0 }, 3),
})
