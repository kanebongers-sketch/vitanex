// 3D-oefening: Squat met dumbbells. Naam exact zoals in de oefenbibliotheek.
// Voeten iets breder dan de heupen, tenen licht naar buiten. Een dumbbell naast
// elk been in neutrale greep (as van voor naar achter, handpalmen naar het
// lichaam). De armen hangen stil en loodrecht onder de schouders; onderin gaan
// de handen iets naar buiten zodat de dumbbells naast de knieen hangen en er
// niet tegen tikken. Zakken tot de dij ongeveer horizontaal is, borst omhoog,
// hielen plat. Tempo: 3 tellen omlaag, kort stil, 1 tel omhoog.

import { balanceer, HEUP_STAAND, houding, lus } from '../bouw/basis'
import { schouderIn } from '../kinematica'
import type { Houding, Oefening3d } from '../typen'

/** Gewicht van het paar dumbbells voor het zwaartepunt (fractie van het lichaam). */
const LAST_GEWICHT = 0.25
/** Zwaartepunt boven het midden van de voet. */
const DOEL_Z = 0.05

const ONDER = { heup: 0.47, kantel: 34, nek: -8 }
/** Halve afstand tussen de handen boven (langs de dijen) en onder (buiten de knieen). */
const GREEP = { boven: 0.225, onder: 0.252 }
/** Onderin hangen de dumbbells net achter de lijn van de schouders, naast de kuit. */
const LAST_TERUG = 0.06

const BASIS: Oefening3d = {
  naam: 'Squat met dumbbells',
  sleutels: [],
  last: 'hangend',
  handen: 'greep',
  enkel: { x: 0.14, y: 0.08, z: 0 },
  voet: { kanteling: 0, uitdraai: 18 },
  knieRichting: { x: 0.2, y: 0, z: 1 },
  elleboogRichting: { x: 0.45, y: 0, z: -1 },
  greepRichting: { x: 0, y: 0, z: 1 },
  materiaal: [{ soort: 'halters' }],
  spieren: ['dij', 'bil'],
  camera: { hoek: 54, hoogte: 12, afstand: 4.3, doel: { x: 0, y: 0.84, z: 0 } },
}

/** Handen recht onder de schouders, daarna het bekken in balans brengen. */
function zetLast(h: Houding, greep: number, terug: number): Houding {
  return { ...h, greep, lastZ: schouderIn(h).z - 0.005 - terug }
}

function maak(p: { d: number }): Houding {
  const d = p.d
  const romp = houding({
    bekkenY: HEUP_STAAND + (ONDER.heup - HEUP_STAAND) * d,
    bekkenZ: -0.1 * d,
    kantel: 4 + (ONDER.kantel - 4) * d,
    lende: 2 * d,
    borst: -4 * d,
    nek: ONDER.nek * d,
    schouders: -0.005,
  })
  // Handen gaan pas in het onderste deel van de beweging iets naar buiten (kwadratisch),
  // zodat de armen loodrecht blijven hangen en de dumbbells net langs de knie gaan.
  const greep = GREEP.boven + (GREEP.onder - GREEP.boven) * d * d
  const terug = LAST_TERUG * d
  let uit = zetLast(romp, greep, terug)
  for (let i = 0; i < 3; i++) uit = zetLast(balanceer(BASIS, uit, DOEL_Z, LAST_GEWICHT), greep, terug)
  return uit
}

export const SQUAT_DUMBBELLS: Oefening3d = {
  ...BASIS,
  sleutels: lus({ d: 0 }, { d: 1 }, maak, { begin: 0.6, heen: 3.0, eind: 0.4, terug: 1.0 }, 2),
}
