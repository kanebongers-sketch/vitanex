// ─── Fit Factory Club, illustraties: duwen en trekken als houdingen ─────────
// Bankdrukken, schouderdrukken, lat pulldown en seated cable row. Zie
// coaching/duwen.ts, schouders-cardio.ts en trekken.ts voor de kernpunten.

import type { MateriaalHouding, Oefening } from '../typen'
import { aan, armNaar, beenNaar, wereld, zij } from './hulp'

// ── Bankdrukken ─────────────────────────────────────────────────────────────
// Liggend op een vlakke bank (hoofd links), voeten plat op de vloer. De stang
// zakt naar de onderste borst; de onderarmen staan dan verticaal onder de stang
// en de ellebogen zakken schuin langs het lichaam (niet wijd).

const BANK = { id: 'bank', soort: 'bank' as const, plek: { wereld: { x: -44, y: -44 } }, maat: { lengte: 122 } }
const LIG = { punt: 'heup' as const, op: { x: 0, y: -57 } }
const VOETEN_VLOER = beenNaar(wereld(40, -7.5), -1, 90)

function bankStang(x: number, y: number) {
  return { id: 'stang', soort: 'barbell' as const, plek: { wereld: { x, y } }, maat: { glas: 1 } }
}

export const BANKDRUKKEN: Oefening = {
  naam: 'Bankdrukken met barbell',
  repdb: 'bench-press',
  heen: 'excentrisch',
  spieren: { primair: ['borstspieren', 'triceps'], secundair: ['voorste_schouder'] },
  plaatSchuif: { x: 5, y: -3 },
  toont: [
    'Schouderbladen samen en laag, lichte boog in de onderrug, billen op de bank',
    'Voeten plat op de vloer',
    'Stang zakt naar de onderste borst',
    'Onderarmen verticaal onder de stang, ellebogen niet wijd',
  ],
  begin: zij({
    anker: LIG,
    bekken: -86,
    lumbaal: 5,
    thoracaal: -9,
    hoofd: 4,
    schouderblad: -1.5,
    armNabij: armNaar(aan('stang'), 1, [0.92, 0.92]),
    beenNabij: VOETEN_VLOER,
    materiaal: [BANK, bankStang(-46, -110)],
  }),
  eind: zij({
    anker: LIG,
    bekken: -86,
    lumbaal: 5,
    thoracaal: -9,
    hoofd: 4,
    schouderblad: -1.5,
    armNabij: armNaar(aan('stang'), 1, [0.62, 0.98]),
    beenNabij: VOETEN_VLOER,
    materiaal: [BANK, bankStang(-34, -74)],
  }),
}

// ── Schouderdrukken met dumbbells, zittend ──────────────────────────────────
// Rechtop tegen een bijna rechte rugleuning. Onderin de dumbbells naast het
// hoofd, ellebogen iets voor het lichaam, polsen recht boven de ellebogen.

const ZIT = { punt: 'heup' as const, op: { x: 0, y: -56 } }
const SCHUINE_BANK = { id: 'bank', soort: 'schuineBank' as const, plek: { wereld: { x: 1, y: -46 } }, maat: { leuning: 84 } }

function dbSchouder(langs: number, dwars: number, ver: boolean): MateriaalHouding {
  return {
    id: ver ? 'db-ver' : 'db',
    soort: 'dumbbell' as const,
    plek: { aan: 'thoracaal' as const, langs, dwars },
    maat: { eind: 1, ver: ver ? 1 : 0, kop: 12 },
  }
}

export const SCHOUDERDRUKKEN: Oefening = {
  naam: 'Dumbbell shoulder press',
  repdb: 'seated-db-press',
  heen: 'concentrisch',
  spieren: { primair: ['voorste_schouder', 'middelste_schouder'], secundair: ['triceps', 'trapezius'] },
  toont: [
    'Rug tegen de leuning, buik vast: geen holle rug',
    'Onderin: ellebogen iets naar voren, polsen boven de ellebogen',
    'Omhoog tot de armen bijna gestrekt boven de schouders zijn',
  ],
  begin: zij({
    anker: ZIT,
    bekken: -6,
    hoofd: 4,
    armNabij: armNaar(aan('db'), 1, [0.43, 1]),
    armVer: armNaar(aan('db-ver'), 1, [0.43, 1]),
    beenNabij: beenNaar(wereld(46, -7.5), -1),
    materiaal: [SCHUINE_BANK, dbSchouder(42.5, 8.5, true), dbSchouder(42.5, 7, false)],
  }),
  eind: zij({
    anker: ZIT,
    bekken: -6,
    hoofd: 4,
    armNabij: armNaar(aan('db'), 1, [0.9, 0.95]),
    armVer: armNaar(aan('db-ver'), 1, [0.9, 0.95]),
    beenNabij: beenNaar(wereld(46, -7.5), -1),
    materiaal: [SCHUINE_BANK, dbSchouder(77, 2.5, true), dbSchouder(77, 1, false)],
  }),
}

// ── Lat pulldown ────────────────────────────────────────────────────────────
// Zittend met de bovenbenen onder het kussen. De stang komt naar de bovenste
// borst; de borst gaat omhoog en de romp leunt een klein beetje achterover.

const LAT_ZIT = { punt: 'heup' as const, op: { x: 0, y: -57 } }
const KATROL_BOVEN = { x: -9, y: -214 }
const LAT_MACHINE = { id: 'machine', soort: 'latPulldown' as const, plek: { wereld: { x: 0, y: -47 } }, maat: { toren: 52, padX: 26, padY: -21 }, kabelVan: KATROL_BOVEN }

function latStang(langs: number, dwars: number) {
  return { id: 'stang', soort: 'latstang' as const, plek: { aan: 'thoracaal' as const, langs, dwars }, kabelVan: KATROL_BOVEN }
}

export const LAT_PULLDOWN: Oefening = {
  naam: 'Lat pulldown',
  repdb: 'lat-pulldown',
  heen: 'concentrisch',
  spieren: { primair: ['latissimus'], secundair: ['biceps', 'rhomboideus', 'achterste_schouder'] },
  toont: [
    'Bovenbenen klem onder het kussen, voeten plat',
    'Borst omhoog, romp leunt licht achterover',
    'Ellebogen naar beneden en iets naar achteren',
    'Stang naar de bovenste borst, dan rustig terug omhoog',
  ],
  begin: zij({
    anker: LAT_ZIT,
    bekken: -6,
    hoofd: 2,
    schouderblad: 1,
    armNabij: armNaar(aan('stang'), 1, [0.86, 0.9]),
    beenNabij: beenNaar(wereld(43, -7.5), -1),
    materiaal: [LAT_MACHINE, latStang(77, 3)],
  }),
  eind: zij({
    anker: LAT_ZIT,
    bekken: -16,
    thoracaal: -6,
    hoofd: 6,
    schouderblad: -2,
    armNabij: armNaar(aan('stang'), 1, [0.62, 0.95]),
    beenNabij: beenNaar(wereld(43, -7.5), -1),
    materiaal: [LAT_MACHINE, latStang(25, 21)],
  }),
}

// ── Seated cable row ────────────────────────────────────────────────────────
// Rechtop zittend, voeten tegen de voetsteun, knieen licht gebogen. Het handvat
// komt naar de buik; de ellebogen gaan langs het lichaam naar achteren en de
// schouderbladen gaan samen.

const ROW_ZIT = { punt: 'heup' as const, op: { x: 0, y: -49 } }
const ROW_MACHINE = { id: 'machine', soort: 'seatedRow' as const, plek: { wereld: { x: 0, y: -39 } }, maat: { voetX: 88, voetY: -2 } }
const KATROL_ONDER = { x: 98, y: -14 }
const ROW_VOETEN = beenNaar(aan('machine', 'voet', { x: -6.5, y: 0 }), -1, 20)

function rowHandvat(langs: number, dwars: number) {
  return { id: 'handvat', soort: 'handvat' as const, plek: { aan: 'thoracaal' as const, langs, dwars }, kabelVan: KATROL_ONDER, hoek: 90 }
}

export const SEATED_CABLE_ROW: Oefening = {
  naam: 'Seated cable row',
  repdb: 'seated-cable-row',
  heen: 'concentrisch',
  spieren: { primair: ['latissimus', 'rhomboideus'], secundair: ['biceps', 'achterste_schouder', 'trapezius'] },
  toont: [
    'Rechtop zitten, knieen licht gebogen, voeten tegen de steun',
    'Handvat naar de buik, ellebogen langs het lichaam naar achteren',
    'Schouderbladen samen aan het eind',
    'Gecontroleerd terug zonder met de romp mee te zwaaien',
  ],
  begin: zij({
    anker: ROW_ZIT,
    bekken: 6,
    hoofd: -4,
    schouderblad: 2.2,
    armNabij: armNaar(aan('handvat'), 1, [1, 1]),
    beenNabij: ROW_VOETEN,
    materiaal: [ROW_MACHINE, rowHandvat(15, 61)],
  }),
  eind: zij({
    anker: ROW_ZIT,
    bekken: -2,
    thoracaal: -3,
    hoofd: -1,
    schouderblad: -2.6,
    armNabij: armNaar(aan('handvat'), 1, [0.94, 1]),
    beenNabij: ROW_VOETEN,
    materiaal: [ROW_MACHINE, rowHandvat(-1, 24)],
  }),
}
