// ─── Fit Factory Club, 3D-oefenbeelden: alle oefeningen als data (PUUR) ──────
// Per oefening de sleutelhoudingen met tempo zoals een trainer het voordoet:
// rustig zakken (2 tot 2,5 s), korte pauze onderin, krachtig maar gecontroleerd
// omhoog (1 tot 1,5 s), even stil bovenin. Voeten staan vast op de vloer en de
// handen vast aan de last; armen en benen volgen met inverse kinematica.

import { houding } from './bouw/basis'
import { BIBLIOTHEEK_3D } from './bibliotheek'
import type { Oefening3d } from './typen'

// ── Back squat ──────────────────────────────────────────────────────────────
// Stang hoog op de bovenrug, voeten iets breder dan de heupen, tenen licht naar
// buiten. Heupen naar achteren en omlaag tot de dij ongeveer horizontaal is,
// knieen in de lijn van de tenen, borst omhoog en blik vooruit.

const SQUAT_BOVEN = houding({
  bekkenY: 0.944, bekkenZ: -0.02, kantel: 6, lende: 0, borst: 0, nek: 0,
  schouders: 0.01, lastY: 0.27, lastZ: -0.125, greep: 0.42,
})
const SQUAT_ONDER = houding({
  bekkenY: 0.47, bekkenZ: -0.2, kantel: 42, lende: 4, borst: -4, nek: -26,
  schouders: 0.01, lastY: 0.27, lastZ: -0.125, greep: 0.42,
})

export const BACK_SQUAT_3D: Oefening3d = {
  naam: 'Back squat',
  sleutels: [
    { houding: SQUAT_BOVEN, vast: 0.7, naarVolgende: 2.0 },
    { houding: SQUAT_ONDER, vast: 0.3, naarVolgende: 1.3 },
  ],
  last: 'romp',
  handen: 'greep',
  enkel: { x: 0.16, y: 0.08, z: 0 },
  voet: { kanteling: 0, uitdraai: 18 },
  knieRichting: { x: 0.35, y: 0, z: 1 },
  elleboogRichting: { x: 0.2, y: -1, z: -0.7 },
  materiaal: [{ soort: 'stang', schijven: 2 }],
  spieren: ['dij', 'bil'],
  camera: { hoek: 38, hoogte: 10, afstand: 4.2, doel: { x: 0, y: 0.88, z: 0 } },
}

// ── Deadlift ────────────────────────────────────────────────────────────────
// Stang boven het midden van de voet, schenen tegen de stang, schouders net voor
// de stang, rug neutraal. Eerst duwen met de benen, dan heupen naar voren tot
// rechtop. Terug: heupen eerst naar achteren, stang langs de dijen.

const DEADLIFT_ONDER = houding({
  bekkenY: 0.66, bekkenZ: -0.3, kantel: 65, lende: 2, borst: 2, nek: -30,
  schouders: -0.01, lastY: 0, lastZ: 0.1, greep: 0.25,
})
const DEADLIFT_KNIE = houding({
  bekkenY: 0.82, bekkenZ: -0.2, kantel: 48, lende: 1, borst: 1, nek: -24,
  schouders: -0.01, lastY: 0, lastZ: 0.1, greep: 0.25,
})
const DEADLIFT_BOVEN = houding({
  bekkenY: 0.948, bekkenZ: 0, kantel: 3, lende: -2, borst: -1, nek: 0,
  schouders: -0.02, lastY: 0, lastZ: 0.1, greep: 0.25,
})

export const DEADLIFT_3D: Oefening3d = {
  naam: 'Deadlift',
  sleutels: [
    { houding: DEADLIFT_ONDER, vast: 0.6, naarVolgende: 0.7 },
    { houding: DEADLIFT_KNIE, vast: 0, naarVolgende: 0.7 },
    { houding: DEADLIFT_BOVEN, vast: 0.6, naarVolgende: 0.9 },
    { houding: DEADLIFT_KNIE, vast: 0, naarVolgende: 0.9 },
  ],
  last: 'hangend',
  handen: 'greep',
  enkel: { x: 0.13, y: 0.08, z: 0 },
  voet: { kanteling: 0, uitdraai: 8 },
  knieRichting: { x: 0.2, y: 0, z: 1 },
  elleboogRichting: { x: 0, y: 0, z: -1 },
  materiaal: [{ soort: 'stang', schijven: 3 }],
  // de hoogte van de stang volgt uit de gestrekte armen (lastY telt niet)
  spieren: ['bil', 'dij', 'rug'],
  camera: { hoek: 52, hoogte: 10, afstand: 4.1, doel: { x: 0, y: 0.86, z: 0 } },
}

// ── Bankdrukken ─────────────────────────────────────────────────────────────
// Op de rug op een vlakke bank, voeten plat op de vloer, schouderbladen samen.
// De stang zakt gecontroleerd naar de onderste borst, onderarmen verticaal,
// ellebogen schuin langs het lichaam; dan uitdrukken tot boven de schouders.

const BANK_BOVEN = houding({
  bekkenY: 0.535, bekkenZ: 0.24, kantel: -90, lende: 0, borst: 0, nek: 0,
  schouders: -0.015, lastY: 1.1, lastZ: -0.23, greep: 0.4,
})
const BANK_ONDER = houding({
  bekkenY: 0.535, bekkenZ: 0.24, kantel: -90, lende: 0, borst: 0, nek: 0,
  schouders: -0.015, lastY: 0.69, lastZ: -0.12, greep: 0.4,
})

export const BANKDRUKKEN_3D: Oefening3d = {
  naam: 'Bankdrukken met barbell',
  sleutels: [
    { houding: BANK_BOVEN, vast: 0.6, naarVolgende: 2.0 },
    { houding: BANK_ONDER, vast: 0.3, naarVolgende: 1.2 },
  ],
  last: 'wereld',
  handen: 'greep',
  enkel: { x: 0.24, y: 0.08, z: 0.62 },
  voet: { kanteling: 0, uitdraai: 15 },
  knieRichting: { x: 0.3, y: 1, z: 0.4 },
  elleboogRichting: { x: 1, y: -0.8, z: 0.55 },
  materiaal: [{ soort: 'bank', plek: { x: 0, y: 0, z: -0.15 } }, { soort: 'stang', schijven: 2 }],
  spieren: ['borst', 'bovenarm', 'schouder'],
  camera: { hoek: 30, hoogte: 26, afstand: 4.4, doel: { x: 0, y: 0.6, z: -0.08 } },
}

// ── Lat pulldown ────────────────────────────────────────────────────────────
// Zittend, dijen onder het kussen, licht achterover. Stang breed vast, schouders
// eerst omlaag, dan de stang naar de bovenkant van de borst trekken met de
// ellebogen naar beneden en iets naar achteren. Gecontroleerd terug.

const LAT_BOVEN = houding({
  bekkenY: 0.555, bekkenZ: 0, kantel: -8, lende: 0, borst: 0, nek: 0,
  schouders: 0.04, lastY: 1.655, lastZ: -0.06, greep: 0.42,
})
const LAT_ONDER = houding({
  bekkenY: 0.555, bekkenZ: 0, kantel: -18, lende: -2, borst: -6, nek: 8,
  schouders: -0.02, lastY: 1.04, lastZ: -0.03, greep: 0.42,
})

export const LAT_PULLDOWN_3D: Oefening3d = {
  naam: 'Lat pulldown',
  sleutels: [
    { houding: LAT_BOVEN, vast: 0.6, naarVolgende: 1.2 },
    { houding: LAT_ONDER, vast: 0.4, naarVolgende: 2.0 },
  ],
  last: 'wereld',
  handen: 'greep',
  enkel: { x: 0.15, y: 0.08, z: 0.5 },
  voet: { kanteling: 0, uitdraai: 10 },
  knieRichting: { x: 0.2, y: 0.4, z: 1 },
  elleboogRichting: { x: 1, y: -0.9, z: -0.5 },
  materiaal: [{ soort: 'kabelstation', plek: { x: 0, y: 0, z: 0 } }],
  spieren: ['rug', 'bovenarm'],
  camera: { hoek: 48, hoogte: 7, afstand: 5.1, doel: { x: 0, y: 1.12, z: 0.12 } },
}

// ── Push-up ─────────────────────────────────────────────────────────────────
// Handen iets breder dan de schouders, lichaam een rechte lijn van hielen tot
// hoofd. Zakken tot de borst net boven de vloer, ellebogen schuin naar achteren
// (ongeveer 45 graden), dan in een stuk terug omhoog.

const PUSH_BOVEN = houding({
  bekkenY: 0.42, bekkenZ: -0.17, kantel: 74, lende: 0, borst: 0, nek: 0,
  schouders: 0, lastY: 0.035, lastZ: 0.2, greep: 0.27,
})
const PUSH_ONDER = houding({
  bekkenY: 0.215, bekkenZ: -0.132, kantel: 89, lende: 0, borst: 0, nek: 2,
  schouders: 0, lastY: 0.035, lastZ: 0.2, greep: 0.27,
})

export const PUSH_UP_3D: Oefening3d = {
  naam: 'Push-up',
  sleutels: [
    { houding: PUSH_BOVEN, vast: 0.5, naarVolgende: 1.6 },
    { houding: PUSH_ONDER, vast: 0.25, naarVolgende: 1.0 },
  ],
  last: 'wereld',
  handen: 'plat',
  enkel: { x: 0.1, y: 0.16, z: -1.0 },
  voet: { kanteling: 72, uitdraai: 0 },
  knieRichting: { x: 0, y: -1, z: 0.2 },
  elleboogRichting: { x: 0.55, y: 1.2, z: -0.6 },
  materiaal: [{ soort: 'mat', plek: { x: 0, y: 0, z: -0.3 } }],
  spieren: ['borst', 'bovenarm', 'schouder'],
  camera: { hoek: 66, hoogte: 11, afstand: 4.1, doel: { x: 0, y: 0.32, z: -0.24 } },
}

// ── Dumbbell shoulder press ─────────────────────────────────────────────────
// Zittend op een rechte bank, rug tegen het kussen, voeten plat. Halters op
// oorhoogte, onderarmen verticaal; recht omhoog drukken tot de armen bijna
// gestrekt zijn en de halters boven het hoofd bij elkaar komen.

const PRESS_ONDER = houding({
  bekkenY: 0.535, bekkenZ: -0.02, kantel: -4, lende: 0, borst: 0, nek: 0,
  schouders: 0, lastY: 1.21, lastZ: 0.0, greep: 0.42,
})
const PRESS_BOVEN = houding({
  bekkenY: 0.535, bekkenZ: -0.02, kantel: -4, lende: 0, borst: 0, nek: 0,
  schouders: 0.03, lastY: 1.68, lastZ: -0.04, greep: 0.16,
})

export const SCHOUDERDRUKKEN_3D: Oefening3d = {
  naam: 'Dumbbell shoulder press',
  sleutels: [
    { houding: PRESS_ONDER, vast: 0.35, naarVolgende: 1.2 },
    { houding: PRESS_BOVEN, vast: 0.5, naarVolgende: 2.0 },
  ],
  last: 'wereld',
  handen: 'greep',
  enkel: { x: 0.2, y: 0.08, z: 0.46 },
  voet: { kanteling: 0, uitdraai: 14 },
  knieRichting: { x: 0.3, y: 0.3, z: 1 },
  elleboogRichting: { x: 1, y: -0.5, z: 0.25 },
  materiaal: [{ soort: 'bankRug', plek: { x: 0, y: 0, z: -0.02 } }, { soort: 'halters' }],
  spieren: ['schouder', 'bovenarm'],
  camera: { hoek: 34, hoogte: 9, afstand: 4.1, doel: { x: 0, y: 0.88, z: 0.06 } },
}

/** De zes oefeningen van het eerste prototype (met de hand afgesteld). */
export const PROTOTYPE_3D: readonly Oefening3d[] = [
  BACK_SQUAT_3D,
  BANKDRUKKEN_3D,
  DEADLIFT_3D,
  LAT_PULLDOWN_3D,
  PUSH_UP_3D,
  SCHOUDERDRUKKEN_3D,
]

/** Alle oefeningen in 3D: het prototype plus de bibliotheek via de bouwstenen. */
export const OEFENINGEN_3D: readonly Oefening3d[] = [...PROTOTYPE_3D, ...BIBLIOTHEEK_3D]

export function oefening3dOpNaam(naam: string): Oefening3d | undefined {
  return OEFENINGEN_3D.find((o) => o.naam === naam)
}
