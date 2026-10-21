// 3D-oefening: Front squat. Naam exact zoals in de oefenbibliotheek.
// Squatpatroon met een barbell in de front rack: de stang rust voor op de
// schouders dicht tegen de hals, de handen net buiten schouderbreedte onder de
// stang en de ellebogen hoog naar voren, in begin en eind. Voeten op
// schouderbreedte met de tenen licht naar buiten. De romp blijft rechter dan bij
// de back squat: de heup zakt recht tussen de hielen en de knieen schuiven ver
// over de tenen terwijl de hielen plat blijven, tot de dijen horizontaal zijn.
// De stang staat in elke stand in balans boven de middenvoet.
// Tempo volgens de coaching: bovenaan ademen en vastzetten, 2 tot 3 tellen
// omlaag, kort stil, krachtig omhoog.
// Camera 3/4 van opzij op borsthoogte: de hoge ellebogen, de rechte romp en de
// knie voorbij de teen zijn tegelijk te lezen.

import { bereikbaar, BLIK, houding, lus, metMoment, zwaartepuntZ, type Tempo } from '../bouw/basis'
import type { Houding, Oefening3d } from '../typen'

/** Hoogte van het heupgewricht onderin: dijen minstens horizontaal. */
const DIEPTE = 0.4
/** Kanteling van het bekken onderin (graden voorover): rechter dan de back squat. */
const KANTEL = 24
/** Kanteling bovenaan: rechtop, de stang boven de middenvoet. */
const BOVEN_KANTEL = 3
/** Gewicht van de stang voor het zwaartepunt (fractie van het lichaam). */
const GEWICHT = 1.1
/** Midden van de voet in z: daar boven blijven stang en zwaartepunt. */
const MIDDENVOET = 0.05
/** Hoe gestrekt de benen bovenaan zijn (reik van het been, 1 is op slot). */
const STREK = 0.9985

/** Stang voor op de schouders tegen de hals, handen net buiten de schouders (borstframe). */
const STANG = { lastY: 0.33, lastZ: 0.11, greep: 0.25 } as const

/**
 * Bovenaan ademen en de romp vastzetten, 2,5 tellen zakken, kort stil, krachtig
 * omhoog.
 */
const TEMPO_FRONT_SQUAT: Tempo = { begin: 1.4, heen: 2.5, eind: 0.5, terug: 1.1 }

const BASIS: Oefening3d = {
  naam: 'Front squat',
  sleutels: [],
  last: 'romp',
  handen: 'greep',
  enkel: { x: 0.17, y: 0.08, z: 0 },
  voet: { kanteling: 0, uitdraai: 16 },
  knieRichting: { x: 0.4, y: 0, z: 1 },
  // Ellebogen hoog naar voren, iets naar buiten: bovenarmen bijna horizontaal.
  elleboogRichting: { x: 0.25, y: 0.2, z: 1 },
  materiaal: [{ soort: 'stang', schijven: 2 }],
  spieren: ['dij'],
  spierenSecundair: ['bil', 'romp'],
  blik: BLIK.vooruit,
  kniePad: true,
  camera: { hoek: 58, hoogte: 14, afstand: 3.9, doel: { x: 0, y: 0.84, z: 0 } },
}

/** Schuif het bekken tot figuur plus stang boven de middenvoet staan; benen net niet op slot. */
function inBalans(h: Houding): Houding {
  let uit = bereikbaar(BASIS, h, STREK)
  for (let i = 0; i < 16; i++) {
    const fout = zwaartepuntZ(BASIS, uit, GEWICHT) - MIDDENVOET
    if (Math.abs(fout) < 0.0005) break
    uit = bereikbaar(BASIS, { ...h, bekkenZ: uit.bekkenZ - fout * 1.2 }, STREK)
  }
  return uit
}

function maak(p: { d: number }): Houding {
  const d = p.d
  return inBalans(
    houding({
      bekkenY: 1 + (DIEPTE - 1) * d,
      bekkenZ: -0.06 * d,
      kantel: BOVEN_KANTEL + (KANTEL - BOVEN_KANTEL) * d,
      lende: 0,
      borst: -4 * d,
      nek: 0,
      schouders: 0.02,
      ...STANG,
    }),
  )
}

export const FRONT_SQUAT_3D: Oefening3d = metMoment({
  ...BASIS,
  sleutels: lus({ d: 0 }, { d: 1 }, maak, TEMPO_FRONT_SQUAT, 2),
})
