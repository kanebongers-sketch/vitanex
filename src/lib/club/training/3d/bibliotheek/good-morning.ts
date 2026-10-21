// 3D-oefening: Good morning. Naam exact zoals in de oefenbibliotheek.
// Stang op de bovenrug zoals bij een squat (niet op de nek), voeten op
// heupbreedte en de knieen licht gebogen. Die kniebuiging staat vanaf het begin
// vast; alleen de heupen bewegen. Heupen naar de muur achter je, de romp
// kantelt met een rechte rug mee tot hij bijna horizontaal is, blik een paar
// meter voor je op de vloer. Dan heupen naar voren tot rechtop met billen aan.
// Het zwaartepunt van figuur en stang blijft boven het midden van de voet, dus
// de heupen gaan ver naar achteren. Zijaanzicht licht van achteren: rechte rug,
// heupscharnier en de vaste kniehoek; de schijf aan de kant van de camera wordt
// doorzichtig als hij het lichaam afdekt.

import { metKnie } from '../beweging'
import { BLIK, houding, lus, metMoment, zwaartepuntZ } from '../bouw/basis'
import type { Houding, Oefening3d } from '../typen'

/** Vaste kniebuiging (graden): licht gebogen, niet verder zakken. */
const KNIE = 20
/** Romp onderin: bekken plus rug, bijna horizontaal (graden voorover). */
const ROMP_ONDER = 76
/** Zwaartepunt boven het midden van de voet. */
const MIDDEN_VOET = 0.05
/** Aandeel van de stang in het zwaartepunt. */
const STANG = 0.35

const BASIS: Oefening3d = {
  naam: 'Good morning',
  sleutels: [],
  // Stang op de bovenrug, vast aan de borst (zoals de back squat).
  last: 'romp',
  handen: 'greep',
  enkel: { x: 0.12, y: 0.08, z: 0 },
  voet: { kanteling: 0, uitdraai: 7 },
  knieRichting: { x: 0.15, y: 0, z: 1 },
  // Ellebogen schuin naar achteren en omlaag (rechtop) en naar de heupen
  // (voorover): stang vast in de schouders.
  elleboogRichting: { x: 0.5, y: -0.6, z: -1 },
  materiaal: [{ soort: 'stang', schijven: 1 }],
  spieren: ['hamstring', 'bil'],
  spierenSecundair: ['onderrug'],
  camera: { hoek: 104, hoogte: 16, afstand: 4.4, doel: { x: 0, y: 0.92, z: -0.1 } },
  blik: BLIK.scharnier,
  kniePad: true,
}

function maak({ d }: { d: number }): Houding {
  // Rug recht: onderrug neutraal, bovenrug licht gestrekt (schouderbladen bij elkaar).
  const lende = -1
  const borst = -1 - 2 * d
  const romp = 1 + (ROMP_ONDER - 1) * d
  let h = houding({
    bekkenY: 0.93,
    kantel: romp - lende - borst,
    lende,
    borst,
    nek: 0,
    schouders: 0.0,
    lastY: 0.25,
    lastZ: -0.125,
    greep: 0.45,
  })
  for (let i = 0; i < 6; i++) {
    h = metKnie(BASIS, h, KNIE)
    const fout = zwaartepuntZ(BASIS, h, STANG) - MIDDEN_VOET
    h = { ...h, bekkenZ: h.bekkenZ - fout * 1.2 }
  }
  return metKnie(BASIS, h, KNIE)
}

// 3 tellen omlaag met de heupen naar achteren, kort stil in de rek, 1 tot 2
// tellen omhoog (coaching).
export const GOOD_MORNING: Oefening3d = metMoment({
  ...BASIS,
  sleutels: lus({ d: 0 }, { d: 1 }, maak, { begin: 0.5, heen: 3.0, eind: 0.5, terug: 1.4 }, 2),
})
