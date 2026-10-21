// 3D-oefening: Squat naar een bank. Naam exact zoals in de oefenbibliotheek.
// Een vlakke bank staat dwars achter het figuur, een kleine stap achter de
// hielen. Voeten iets breder dan de heupen, tenen licht naar buiten, armen recht
// vooruit op schouderhoogte als tegengewicht. De billen reiken naar achteren
// naar de bank, de scheen blijft steiler dan bij een gewone squat en de romp
// kantelt met een rechte rug mee. Onderin tikken de billen de bank net aan (de
// dij ligt dan ongeveer horizontaal op het kussen), zonder te gaan zitten. Daarna
// zonder vaart via de hielen omhoog, borst omhoog. Tempo volgens de coaching:
// 3 tellen omlaag, aantikken, 1 tel omhoog.

import { balanceer, handPlek, HEUP_STAAND, houding, lus } from '../bouw/basis'
import type { Houding, Oefening3d } from '../typen'

/** Hoogte van het heupgewricht onderin: de achterkant van de dij raakt het kussen (bovenkant 0,43 m). */
const DIEPTE = 0.525
/** Bekken onderin voorover (graden): billen ver naar achteren, rug blijft recht. */
const KANTEL = 50
/** Zwaartepunt boven het midden van de voet, iets naar de hielen. */
const DOEL_Z = 0.0
/** Midden van de bank (dwars, 0,30 m diep): voorrand een kleine stap achter de hielen. */
const BANK_Z = -0.3

const BASIS: Oefening3d = {
  naam: 'Squat naar een bank',
  sleutels: [],
  last: 'wereld',
  handen: 'plat',
  enkel: { x: 0.2, y: 0.08, z: 0 },
  voet: { kanteling: 0, uitdraai: 22 },
  knieRichting: { x: 0.42, y: 0, z: 1 },
  elleboogRichting: { x: 0.3, y: -1, z: 0 },
  materiaal: [{ soort: 'bankKaal', plek: { x: 0, y: 0, z: BANK_Z }, draai: 90 }],
  spieren: ['dij', 'bil'],
  spierenSecundair: ['hamstring', 'romp'],
  // Schuin van voren-opzij: de bank achter de billen, de scheenhoek en de knieen in lijn met de tenen.
  camera: { hoek: 64, hoogte: 11, afstand: 4.2, doel: { x: 0, y: 0.78, z: -0.1 } },
}

/** Armen recht vooruit: boven op schouderhoogte, onderin iets erboven. */
function metArmen(h: Houding, d: number): Houding {
  const plek = handPlek(h, { heffen: 90 + 6 * d, opzij: 3.5, elleboog: 4 }, true)
  return { ...h, ...plek }
}

function maak(p: { d: number }): Houding {
  const d = p.d
  const kantel = 4 + (KANTEL - 4) * d
  const lende = -3 * d
  const borst = -4 * d
  const romp = houding({
    bekkenY: HEUP_STAAND - 0.004 + (DIEPTE - HEUP_STAAND) * d,
    bekkenZ: -0.25 * d,
    kantel,
    lende,
    borst,
    // Blik vooruit: de nek vangt het grootste deel van de rompkanteling op.
    nek: -0.75 * (kantel + lende + borst),
    schouders: 0.005,
  })
  let uit = metArmen(romp, d)
  for (let i = 0; i < 3; i++) uit = metArmen(balanceer(BASIS, uit, DOEL_Z, 0), d)
  return uit
}

export const SQUAT_NAAR_BANK: Oefening3d = {
  ...BASIS,
  kniePad: true,
  sleutels: lus({ d: 0 }, { d: 1 }, maak, { begin: 0.5, heen: 3.0, eind: 0.25, terug: 1.1 }, 2),
}
