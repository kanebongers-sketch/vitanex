// 3D-oefening: Squat met dumbbells. Naam exact zoals in de oefenbibliotheek.
// Voeten iets breder dan de heupen, tenen licht naar buiten. Een dumbbell naast
// elk been in neutrale greep (as van voor naar achter, handpalmen naar het
// lichaam). De armen hangen stil en loodrecht onder de schouders; onderin gaan
// de handen naar buiten zodat de dumbbells naast de kuit hangen en niet tegen
// de knie tikken. Heup en knie buigen tegelijk: de heup gaat naar achteren en
// omlaag, zitten tussen de hielen tot de dij ongeveer horizontaal is. Borst
// omhoog, blik vooruit, hielen plat.
// Tempo volgens de coaching: 3 tellen omlaag, kort stil, 1 tel omhoog, boven
// rustig ademhalen. Het begin staat rechtop, het diepste punt valt op de helft.
// Camera 3/4 van voren op borsthoogte, iets meer van voren dan zijwaarts: heup
// naar achteren, knieen boven de tenen en beide dumbbells naast de benen zijn
// tegelijk te zien; staand en onderin past het hele figuur in beeld.

import { balanceer, CAMERA_PATROON, HEUP_STAAND, houding, lus, metMoment } from '../bouw/basis'
import { schouderIn } from '../kinematica'
import type { Houding, Oefening3d } from '../typen'

/** Gewicht van het paar dumbbells voor het zwaartepunt (fractie van het lichaam). */
const LAST_GEWICHT = 0.25
/** Zwaartepunt boven het midden van de voet. */
const DOEL_Z = 0.05

/** Onderin: dij ongeveer horizontaal, heup ver naar achteren, romp licht voorover. */
const ONDER = { heup: 0.5, bekkenZ: -0.14, kantel: 29 }
/** Halve afstand tussen de handen boven (langs de dijen) en onder (naast de kuit). */
const GREEP = { boven: 0.225, onder: 0.355 }
/** Onderin hangen de dumbbells net achter de lijn van de schouders, naast de kuit. */
const LAST_TERUG = 0.08
/**
 * Trainerstempo uit de coaching (bijna 3 tellen omlaag, kort stil, 1 tel omhoog)
 * met boven een rustige ademhaling. Omlaag duurt even lang als boven plus omhoog,
 * zodat het diepste punt op de helft van de lus valt en het begin (0 procent)
 * nog rechtop staat.
 */
const TEMPO_DB = { begin: 1.7, heen: 2.8, eind: 0.3, terug: 1.1 }

const BASIS: Oefening3d = {
  naam: 'Squat met dumbbells',
  sleutels: [],
  last: 'hangend',
  handen: 'greep',
  enkel: { x: 0.14, y: 0.08, z: 0 },
  voet: { kanteling: 0, uitdraai: 18 },
  knieRichting: { x: 0.22, y: 0, z: 1 },
  elleboogRichting: { x: 0.45, y: 0, z: -1 },
  greepRichting: { x: 0, y: 0, z: 1 },
  materiaal: [{ soort: 'halters' }],
  spieren: ['dij', 'bil'],
  spierenSecundair: ['hamstring', 'onderrug', 'kuit'],
  blik: { hoek: 6, sterkte: 1 },
  kniePad: true,
  camera: { ...CAMERA_PATROON.squat, hoek: 36, hoogte: 11, afstand: 4.05, doel: { x: 0, y: 0.72, z: -0.02 } },
}

/** Handen recht onder de schouders, iets naar achteren onderin. */
function zetLast(h: Houding, greep: number, terug: number): Houding {
  return { ...h, greep, lastZ: schouderIn(h).z - 0.005 - terug }
}

function maak(p: { d: number }): Houding {
  const d = p.d
  const romp = houding({
    bekkenY: HEUP_STAAND + (ONDER.heup - HEUP_STAAND) * d,
    bekkenZ: ONDER.bekkenZ * d,
    kantel: 4 + (ONDER.kantel - 4) * d,
    lende: 2 * d,
    borst: 1 * d,
    nek: 0,
    schouders: -0.005,
  })
  // De handen gaan pas in het onderste deel naar buiten (kwadratisch), zodat de
  // armen loodrecht blijven hangen en de dumbbells naast de knie langs gaan.
  const greep = GREEP.boven + (GREEP.onder - GREEP.boven) * d * d
  const terug = LAST_TERUG * d
  let uit = zetLast(romp, greep, terug)
  for (let i = 0; i < 3; i++) uit = zetLast(balanceer(BASIS, uit, DOEL_Z, LAST_GEWICHT), greep, terug)
  return uit
}

export const SQUAT_DUMBBELLS: Oefening3d = metMoment({
  ...BASIS,
  sleutels: lus({ d: 0 }, { d: 1 }, maak, TEMPO_DB, 2),
})
