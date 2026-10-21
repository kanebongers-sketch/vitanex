// 3D-oefening: Squat met lichaamsgewicht. Naam exact zoals in de oefenbibliotheek.
// Voeten iets breder dan de heupen, tenen zichtbaar naar buiten. Billen naar
// achteren en omlaag alsof je op een stoel gaat zitten, tot de heupvouw op
// kniehoogte. Knieen volgen de tenen, hielen plat, rug recht en borst omhoog.
// De armen blijven de hele herhaling recht vooruit op schouderhoogte als
// tegengewicht. Tempo volgens de coaching: 3 tellen omlaag, kort stil, 1 tel omhoog.
// Camera 3/4 van voren (46 graden) op borsthoogte: romphoek, diepte, knie over
// de tenen en de uitgedraaide voetstand zijn tegelijk te lezen.

import { BLIK, bereikbaar, handPlek, HEUP_STAAND, houding, lus, metMoment, TEMPO, zwaartepuntZ } from '../bouw/basis'
import { metKnie } from '../beweging'
import type { Houding, Oefening3d } from '../typen'

/** Hoogte van het heupgewricht onderin: heupvouw op kniehoogte. */
const DIEPTE = 0.37
/** Bekken onderin voorover (graden): billen naar achteren, rug blijft recht. */
const KANTEL = 42
/** Midden van de voet in z: daar boven blijft het zwaartepunt, hielen plat. */
const MIDDENVOET = 0.045
/** Heup bovenin: iets hoger dan HEUP_STAAND, want de brede stand vraagt meer beenlengte. */
const BOVEN = HEUP_STAAND + 0.02
/** Reik van het been in de balanslus: onderweg nooit verder dan bijna gestrekt. */
const REIK_BOVEN = 0.9999
/** Kniebuiging bovenin (graden): benen recht in lijn met de tenen, net niet op slot. */
const KNIE_BOVEN = 0.5

/** Knie wijst in de richting van de tenen (uitdraai 26 graden) plus iets naar buiten. */
const KNIE_UIT = 0.45

const BASIS: Oefening3d = {
  naam: 'Squat met lichaamsgewicht',
  sleutels: [],
  last: 'wereld',
  handen: 'plat',
  enkel: { x: 0.17, y: 0.08, z: 0 },
  voet: { kanteling: 0, uitdraai: 26 },
  knieRichting: { x: KNIE_UIT, y: 0, z: 1 },
  elleboogRichting: { x: 0.3, y: -1, z: 0 },
  materiaal: [],
  spieren: ['dij', 'bil'],
  spierenSecundair: ['hamstring', 'onderrug', 'romp'],
  blik: BLIK.vooruit,
  kniePad: true,
  camera: { hoek: 46, hoogte: 13, afstand: 3.95, doel: { x: 0.02, y: 0.66, z: 0.2 } },
}

/** Armen recht vooruit: boven op schouderhoogte, onderin iets erboven. */
function metArmen(h: Houding, d: number): Houding {
  const plek = handPlek(h, { heffen: 90 + 8 * d, opzij: 3.5, elleboog: 11 }, true)
  return { ...h, ...plek }
}

/** Zwaartepunt boven de middenvoet en voeten bereikbaar, met bijna gestrekte knieen bovenin. */
function inBalans(h: Houding): Houding {
  let uit = h
  for (let i = 0; i < 12; i++) {
    const fout = zwaartepuntZ(BASIS, uit, 0) - MIDDENVOET
    if (Math.abs(fout) < 0.001) break
    uit = bereikbaar(BASIS, { ...uit, bekkenZ: uit.bekkenZ - fout * 1.2 }, REIK_BOVEN)
  }
  return bereikbaar(BASIS, uit, REIK_BOVEN)
}

function maak(p: { d: number }): Houding {
  const d = p.d
  const romp = houding({
    bekkenY: BOVEN + (DIEPTE - BOVEN) * d,
    bekkenZ: -0.2 * d,
    kantel: 4 + (KANTEL - 4) * d,
    lende: -5 * d,
    borst: 0,
    schouders: 0.005,
  })
  let uit = metArmen(romp, d)
  for (let i = 0; i < 2; i++) uit = metArmen(inBalans(uit), d)
  if (d > 0) return uit
  // Bovenin precies gestrekt: zonder dit leest een kleine rest-buiging in de brede stand als knik.
  for (let i = 0; i < 2; i++) uit = metArmen(metKnie(BASIS, uit, KNIE_BOVEN), d)
  return uit
}

export const SQUAT_LICHAAMSGEWICHT: Oefening3d = metMoment({
  ...BASIS,
  sleutels: lus({ d: 0 }, { d: 1 }, maak, TEMPO.squat, 1),
})
