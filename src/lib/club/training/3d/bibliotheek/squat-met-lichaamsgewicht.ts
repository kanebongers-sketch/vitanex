// 3D-oefening: Squat met lichaamsgewicht. Naam exact zoals in de oefenbibliotheek.
// Voeten iets breder dan de heupen, tenen zichtbaar naar buiten. Billen naar
// achteren en omlaag alsof je op een stoel gaat zitten, tot de heupvouw op
// kniehoogte. Knieen volgen de tenen, hielen plat, rug recht en borst omhoog.
// De armen blijven de hele herhaling recht vooruit op schouderhoogte als
// tegengewicht. Tempo volgens de coaching: 3 tellen omlaag, kort stil, 1 tel omhoog.

import { balanceer, handPlek, HEUP_STAAND, houding, lus } from '../bouw/basis'
import type { Houding, Oefening3d } from '../typen'

/** Hoogte van het heupgewricht onderin: heupvouw op kniehoogte. */
const DIEPTE = 0.37
/** Bekken onderin voorover (graden): billen naar achteren, rug blijft recht. */
const KANTEL = 40

const BASIS: Oefening3d = {
  naam: 'Squat met lichaamsgewicht',
  sleutels: [],
  last: 'wereld',
  handen: 'plat',
  enkel: { x: 0.21, y: 0.08, z: 0 },
  voet: { kanteling: 0, uitdraai: 26 },
  knieRichting: { x: 0.5, y: 0, z: 1 },
  elleboogRichting: { x: 0.3, y: -1, z: 0 },
  materiaal: [],
  spieren: ['dij', 'bil', 'romp'],
  camera: { hoek: 62, hoogte: 9, afstand: 3.9, doel: { x: 0, y: 0.83, z: 0.08 } },
}

/** Armen recht vooruit: boven op schouderhoogte, onderin iets erboven. */
function metArmen(h: Houding, d: number): Houding {
  const plek = handPlek(h, { heffen: 90 + 8 * d, opzij: 3.5, elleboog: 4 }, true)
  return { ...h, ...plek }
}

function maak(p: { d: number }): Houding {
  const d = p.d
  const romp = houding({
    bekkenY: HEUP_STAAND + (DIEPTE - HEUP_STAAND) * d,
    bekkenZ: -0.14 * d,
    kantel: 4 + (KANTEL - 4) * d,
    lende: -5 * d,
    borst: -6 * d,
    nek: -8 * d,
    schouders: 0.005,
  })
  let uit = metArmen(romp, d)
  for (let i = 0; i < 2; i++) uit = metArmen(balanceer(BASIS, uit, 0.025, 0), d)
  return uit
}

export const SQUAT_LICHAAMSGEWICHT: Oefening3d = {
  ...BASIS,
  sleutels: lus({ d: 0 }, { d: 1 }, maak, { begin: 0.6, heen: 2.6, eind: 0.4, terug: 1.1 }, 1),
}
