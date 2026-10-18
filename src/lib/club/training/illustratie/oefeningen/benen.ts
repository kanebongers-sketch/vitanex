// ─── Fit Factory Club, illustraties: beenoefeningen als houdingen ───────────
// Begin- en eindhouding in gewrichtshoeken (zie typen.ts voor de afspraken).
// Elke houding volgt de kernpunten van de coaching in coaching/benen.ts.

import type { Oefening } from '../typen'
import { aan, arm, armNaar, been, beenNaar, ENKEL_Y, wereld, zij } from './hulp'

const ENKEL = { punt: 'enkelNabij' as const, op: { x: 0, y: ENKEL_Y } }

/** Stang hoog op de bovenrug (op de trapezius), net onder de nek. */
const STANG_OP_RUG = { id: 'stang', soort: 'barbell' as const, plek: { aan: 'thoracaal' as const, langs: 25, dwars: -9 }, maat: { r: 20 } }

export const BACK_SQUAT: Oefening = {
  naam: 'Back squat',
  repdb: 'squat',
  heen: 'excentrisch',
  spieren: { primair: ['quadriceps', 'bilspieren'], secundair: ['hamstrings', 'onderrug'] },
  plaatSchuif: { x: -29, y: 0 },
  toont: [
    'Stang hoog op de bovenrug, handen om de stang, ellebogen omlaag',
    'Gewicht op de middenvoet: de stang blijft boven het midden van de voet',
    'Knieen naar voren in de richting van de tenen, hielen op de grond',
    'Rug neutraal: romp kantelt als geheel naar voren, geen bolle onderrug',
    'Diepte tot de heupplooi op kniehoogte',
  ],
  begin: zij({
    anker: ENKEL,
    bekken: 10,
    thoracaal: 2,
    hoofd: -11,
    armNabij: armNaar(aan('stang'), -1, [0.6, 0.62]),
    beenNabij: been(182, 4),
    materiaal: [STANG_OP_RUG],
  }),
  eind: zij({
    anker: ENKEL,
    bekken: 44,
    thoracaal: 2,
    hoofd: -26,
    armNabij: armNaar(aan('stang'), -1, [0.6, 0.62]),
    beenNabij: been(88, 124),
    materiaal: [STANG_OP_RUG],
  }),
}

/** Kettlebell bij de hoorns, tegen de borst. */
const KB_BORST = { id: 'kb', soort: 'kettlebell' as const, plek: { aan: 'thoracaal' as const, langs: 17, dwars: 24 }, hoek: 0 }

export const GOBLET_SQUAT: Oefening = {
  naam: 'Goblet squat',
  repdb: 'goblet-squat',
  heen: 'excentrisch',
  spieren: { primair: ['quadriceps', 'bilspieren'], secundair: ['adductoren', 'rechte_buikspier'] },
  toont: [
    'Kettlebell tegen de borst, ellebogen omlaag',
    'Ellebogen zakken tussen de knieen',
    'Hielen blijven op de grond',
    'Borst omhoog: de romp blijft rechter dan bij de back squat',
  ],
  begin: zij({
    anker: ENKEL,
    bekken: 1,
    armNabij: armNaar(aan('kb'), 1, [0.72, 0.62]),
    beenNabij: been(178, 4),
    materiaal: [KB_BORST],
  }),
  eind: zij({
    anker: ENKEL,
    bekken: 28,
    thoracaal: -2,
    hoofd: -18,
    armNabij: armNaar(aan('kb'), 1, [0.72, 0.62]),
    beenNabij: been(80, 136),
    materiaal: [KB_BORST],
  }),
}

/** Barbell in de handen (vast aan de nabije hand). */
const STANG_IN_HANDEN = { id: 'stang', soort: 'barbell' as const, plek: { aan: 'handNabij' as const } }

export const ROEMEENSE_DEADLIFT: Oefening = {
  naam: 'Roemeense deadlift met barbell',
  repdb: 'romanian-deadlift',
  heen: 'excentrisch',
  spieren: { primair: ['hamstrings', 'bilspieren'], secundair: ['onderrug', 'latissimus'] },
  toont: [
    'Heupen naar achteren: een heupscharnier, geen squat',
    'Knieen licht gebogen en stil, scheenbenen bijna verticaal',
    'Rug recht van stuitje tot nek',
    'Stang langs de benen, boven het midden van de voet',
  ],
  begin: zij({
    anker: ENKEL,
    bekken: 2,
    armNabij: arm(167),
    beenNabij: been(173, 8),
    materiaal: [STANG_IN_HANDEN],
  }),
  eind: zij({
    anker: ENKEL,
    bekken: 74,
    thoracaal: 2,
    hoofd: -12,
    armNabij: arm(197),
    beenNabij: been(146, 35),
    materiaal: [STANG_IN_HANDEN],
  }),
}

export const DEADLIFT: Oefening = {
  naam: 'Deadlift',
  repdb: 'deadlift',
  heen: 'concentrisch',
  spieren: { primair: ['bilspieren', 'hamstrings', 'onderrug'], secundair: ['quadriceps', 'trapezius', 'latissimus'] },
  toont: [
    'Stang boven de middenvoet, tegen de scheenbenen',
    'Rug recht, borst trots: heupen tussen knie en schouder',
    'Armen gestrekt, schouders net voor de stang',
    'Bovenaan rechtop staan, niet hol achterover',
  ],
  begin: zij({
    anker: ENKEL,
    bekken: 63,
    thoracaal: -2,
    hoofd: -22,
    armNabij: arm(177),
    beenNabij: been(103, 81),
    materiaal: [STANG_IN_HANDEN],
  }),
  eind: zij({
    anker: ENKEL,
    bekken: 1,
    armNabij: arm(168),
    beenNabij: been(180, 0),
    materiaal: [STANG_IN_HANDEN],
  }),
}

/** Twee dumbbells hangen langs het lichaam, de as van voor naar achter (neutrale greep). */
const DB_NABIJ = { id: 'db', soort: 'dumbbell' as const, plek: { aan: 'handNabij' as const }, hoek: 90 }
const DB_VER = { id: 'db-ver', soort: 'dumbbell' as const, plek: { aan: 'handVer' as const }, hoek: 90, maat: { ver: 1 } }
const ACHTERVOET = wereld(-74, -2.4)

export const WALKING_LUNGE: Oefening = {
  naam: 'Walking lunge',
  repdb: 'walking-lunge',
  heen: 'excentrisch',
  spieren: { primair: ['quadriceps', 'bilspieren'], secundair: ['hamstrings', 'adductoren'] },
  toont: [
    'Romp rechtop, dumbbells hangen stil langs het lichaam',
    'Voorste knie boven de voet, onderbeen bijna verticaal',
    'Achterste knie stopt net boven de vloer',
    'Een flinke pas: onderin twee hoeken van ongeveer 90 graden',
  ],
  begin: zij({
    anker: ENKEL,
    bekken: 1,
    armNabij: arm(180),
    beenNabij: been(146, 19),
    beenVer: beenNaar(ACHTERVOET, -1, 122, true),
    materiaal: [DB_NABIJ, DB_VER],
  }),
  eind: zij({
    anker: ENKEL,
    bekken: 3,
    armNabij: arm(180),
    beenNabij: been(95, 95),
    beenVer: beenNaar(ACHTERVOET, -1, 122, true),
    materiaal: [DB_NABIJ, DB_VER],
  }),
}
