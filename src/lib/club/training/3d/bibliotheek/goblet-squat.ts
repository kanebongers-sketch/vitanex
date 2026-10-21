// 3D-oefening: Goblet squat. Naam exact zoals in de oefenbibliotheek.
// De dumbbell staat tegen het borstbeen, op de middenlijn, beide handen als een
// kom onder de bovenste schijf met de duimen om de stang. Voeten iets breder dan
// de heupen, tenen licht naar buiten. Heup en knie buigen samen tot de dij
// ongeveer horizontaal is; de romp blijft rechtop door de last voor de borst en
// de ellebogen zakken onderin net binnen de knieen. Hielen plat, borst omhoog,
// blik vooruit. Tempo volgens de coaching: 3 tellen omlaag, kort stil, 1 tel
// omhoog, met bovenin een rustige adempauze.

import { balanceer, bereikbaar, BLIK, CAMERA_PATROON, HEUP_STAAND, houding, lus, metMoment, TEMPO } from '../bouw/basis'
import { figuurIn } from '../kinematica'
import { BEEN } from '../maten'
import type { Houding, Oefening3d } from '../typen'

/** Hoogte van de heup onderin: dij net onder horizontaal. */
const DIEPTE = 0.33
/** Bovenaan staat het been net niet op slot (reik van het been, 1 is gestrekt). */
const STREK = 0.998
/** Bekkenkanteling boven en onder: de last voor de borst houdt de romp rechtop. */
const KANTEL = { boven: 4, onder: 22 }
/** Gewicht van de dumbbell voor het zwaartepunt (fractie van het lichaam). */
const GEWICHT = 0.2
/** Zwaartepunt boven het midden van de voet. */
const DOEL_Z = 0.05

/**
 * Handen onder de bovenste schijf (borstframe), hoog genoeg dat de onderarmen
 * steil staan en de ellebogen omlaag langs de romp hangen; de bovenste schijf ligt
 * op het borstbeen onder de kin. `lastZ` houdt de schijven plat tegen de borst,
 * onderin blijft er lucht tussen de onderste schijf en het bekken. `greep` is de
 * halve afstand tussen de handen.
 */
const LAST = { lastY: { boven: 0.19, onder: 0.2 }, lastZ: 0.13, greep: 0.035 } as const

/**
 * Tempo van de coaching (3 tellen omlaag, kort stil, 1 tel omhoog) met bovenin
 * een langere pauze: rechtop staan, inademen en de buik aanspannen (lus 5,9 seconden).
 */
const TEMPO_GOBLET = { ...TEMPO.squat, begin: 1.4 } as const

/**
 * Plek van de diepste stand in de lus: zo valt 0 procent precies aan het eind van
 * de pauze bovenin (rechtop, net voor het zakken) en 50 procent op het begin van
 * de pauze onderin.
 */
const LUS_DUUR = TEMPO_GOBLET.begin + TEMPO_GOBLET.heen + TEMPO_GOBLET.eind + TEMPO_GOBLET.terug
const MOMENT = (TEMPO_GOBLET.heen + TEMPO_GOBLET.eind / 2) / LUS_DUUR

const BASIS: Oefening3d = {
  naam: 'Goblet squat',
  sleutels: [],
  last: 'romp',
  handen: 'greep',
  materiaal: [{ soort: 'halterStaand' }],
  // Ellebogen omlaag, iets naar binnen en naar voren: dicht langs de romp onder de
  // last en onderin binnen de knieen (negatieve x is naar de middenlijn).
  elleboogRichting: { x: -0.4, y: -1, z: 0.5 },
  // Beide handen om de verticale stang, direct onder de bovenste schijf, duimen eromheen.
  greepRichting: { x: 0, y: -1, z: 0 },
  enkel: { x: 0.175, y: 0.08, z: 0 },
  voet: { kanteling: 0, uitdraai: 20 },
  // Voeten iets breder dan de heupen, tenen licht naar buiten. Knieen in lijn met
  // de tenen: de ellebogen zakken er onderin tussen.
  knieRichting: { x: 0.55, y: 0, z: 1 },
  spieren: ['dij', 'bil'],
  spierenSecundair: ['romp', 'onderrug', 'hamstring'],
  blik: BLIK.vooruit,
  kniePad: true,
  // 3/4 van voren op borsthoogte: romphoek, kniespoor en de ellebogen binnen de knieen.
  camera: { ...CAMERA_PATROON.squat, hoek: 36, hoogte: 11, afstand: 3.9, doel: { x: 0, y: 0.76, z: -0.03 } },
}

/** Til het bekken op tot het staande been bijna gestrekt is (symmetrisch, knie niet op slot). */
function strek(h: Houding): Houding {
  let uit = h
  for (let i = 0; i < 8; i++) {
    const f = figuurIn(BASIS, uit)
    const reik = Math.max(f.benen[0].reik, f.benen[1].reik)
    if (reik >= STREK - 0.0005) break
    uit = { ...uit, bekkenY: uit.bekkenY + (STREK - reik) * BEEN }
  }
  return uit
}

function maak(p: { d: number }): Houding {
  const d = p.d
  const last = { lastY: LAST.lastY.boven + (LAST.lastY.onder - LAST.lastY.boven) * d, lastZ: LAST.lastZ, greep: LAST.greep }
  const h = houding({
    bekkenY: HEUP_STAAND + (DIEPTE - HEUP_STAAND) * d,
    bekkenZ: -0.1 * d,
    kantel: KANTEL.boven + (KANTEL.onder - KANTEL.boven) * d,
    lende: 0,
    borst: -6 * d,
    schouders: 0.005,
    ...last,
  })
  let uit = h
  for (let i = 0; i < 2; i++) uit = { ...balanceer(BASIS, uit, DOEL_Z, GEWICHT), ...last }
  const klaar = bereikbaar(BASIS, uit, STREK)
  return d === 0 ? strek(klaar) : klaar
}

export const GOBLET_SQUAT: Oefening3d = metMoment(
  {
    ...BASIS,
    sleutels: lus({ d: 0 }, { d: 1 }, maak, TEMPO_GOBLET, 2),
  },
  MOMENT,
)
