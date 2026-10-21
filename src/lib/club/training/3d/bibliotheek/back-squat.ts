// 3D-oefening: Back squat. Naam exact zoals in de oefenbibliotheek.
// Stang op de bovenste trapezius (onder de nek, niet erop), handen ruim buiten de
// schouders met rechte polsen en de ellebogen onder de stang. Voeten iets breder
// dan de heupen, tenen licht naar buiten. Bovenaan staan de benen gestrekt met
// de knieen boven de enkels. Heupen en knieen buigen tegelijk tot de heupplooi
// op kniehoogte is, knieen in de lijn van de tenen, rug neutraal en borst omhoog,
// blik vooruit. Elke stand wordt in balans gezet met een stang van ongeveer het
// eigen lichaamsgewicht: de stang blijft zo boven de middenvoet en maakt een
// rechte lijn omhoog en omlaag.
// Tempo volgens de coaching: bovenaan ademen en vastzetten, 2 tot 3 tellen
// omlaag, kort stil, krachtig omhoog.
// Camera zij 3/4 (56 graden) op borsthoogte: romphoek, diepte en knie boven de tenen
// zijn tegelijk te lezen.

import { bereikbaar, houding, lus, metMoment, zwaartepuntZ, type Tempo } from '../bouw/basis'
import type { Houding, Oefening3d } from '../typen'

/** Hoogte van het heupgewricht onderin: heupplooi op kniehoogte. */
const DIEPTE = 0.44
/** Kanteling van het bekken onderin (graden voorover), high bar: romp vrij rechtop. */
const KANTEL = 38
/** Kanteling bovenaan: de romp staat net voor het lood, zodat de stang boven de middenvoet ligt. */
const BOVEN_KANTEL = 11
/** Gewicht van de stang voor het zwaartepunt (fractie van het lichaam): een werkgewicht. */
const GEWICHT = 1.5
/** Midden van de voet in z: daar boven blijven stang en zwaartepunt. */
const MIDDENVOET = 0.05
/** Hoe gestrekt de benen bovenaan zijn (reik van het been, 1 is op slot). */
const STREK = 0.9985

/** Stang op de bovenste trapezius, handen ruim buiten de schouders (borstframe). */
const STANG = { lastY: 0.222, lastZ: -0.135, greep: 0.5 } as const

/**
 * Bovenaan ademen en de romp vastzetten, 2,6 tellen zakken, kort stil, krachtig
 * omhoog. De pauze bovenaan is zo lang dat 0 procent van de lus precies op het
 * begin van het zakken valt.
 */
const TEMPO_BACK_SQUAT: Tempo = { begin: 1.5, heen: 2.6, eind: 0.6, terug: 1.2 }

const BASIS: Oefening3d = {
  naam: 'Back squat',
  sleutels: [],
  last: 'romp',
  handen: 'greep',
  enkel: { x: 0.16, y: 0.08, z: 0 },
  voet: { kanteling: 0, uitdraai: 18 },
  knieRichting: { x: 0.5, y: 0, z: 1 },
  elleboogRichting: { x: 0.8, y: -1.4, z: -0.45 },
  materiaal: [{ soort: 'stang', schijven: 2 }],
  spieren: ['dij', 'bil'],
  spierenSecundair: ['hamstring', 'onderrug', 'romp'],
  blik: { hoek: 0 },
  kniePad: true,
  camera: { hoek: 56, hoogte: 14, afstand: 3.95, doel: { x: 0, y: 0.82, z: -0.04 } },
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
      bekkenZ: -0.12 * d,
      kantel: BOVEN_KANTEL + (KANTEL - BOVEN_KANTEL) * d,
      lende: 0,
      borst: -2 * d,
      nek: 0,
      schouders: 0.01 - 0.01 * d,
      ...STANG,
    }),
  )
}

export const BACK_SQUAT_3D: Oefening3d = metMoment({
  ...BASIS,
  sleutels: lus({ d: 0 }, { d: 1 }, maak, TEMPO_BACK_SQUAT, 2),
})
