// ─── Fit Factory Club, 3D-oefenbeelden: bouwstenen onderlichaam (PUUR) ──────
// Squat, hinge, lunge, heupstrek (hip thrust, bridge), leg press, beenmachine
// en kuit. Elke bouwsteen neemt een paar parameters en geeft een complete
// oefening terug; de getallen per oefening staan in ../bibliotheek.
// Staande bouwstenen hebben standaard een blik vooruit in de wereld, heup en
// knie die samen buigen (kniePad), primaire en secundaire spieren, een camera
// per patroon en het zwaarste moment op de helft van de lus.

import { MATEN } from '../maten'
import { metKnie } from '../beweging'
import { figuurIn, heupIn, schouderIn } from '../kinematica'
import type { Blik, Camera, Houding, Lichaamsdeel, Materiaal, Oefening3d, Vec3 } from '../typen'
import {
  balanceer,
  BLIK,
  CAMERA_PATROON,
  enkelPlek,
  HEUP_STAAND,
  houding,
  langsBeen,
  lus,
  metMoment,
  opTenen,
  STAAND,
  steunOp,
  TEMPO,
  zwaartepuntZ,
  type Tempo,
} from './basis'

/** Wat een sportschool in de handen heeft bij een staande oefening. */
export type StaandeLast = 'stang' | 'goblet' | 'halters' | 'kettlebell' | 'armenVooruit' | 'geen'

interface LastInstelling {
  readonly o: Pick<Oefening3d, 'last' | 'materiaal' | 'elleboogRichting' | 'greepRichting'>
  /** Zet de kanalen van de last bij deze romp. */
  readonly zet: (h: Houding) => Houding
  readonly gewicht: number
}

/** Hoe een staande last hangt of gedragen wordt. */
export function staandeLast(last: StaandeLast, greep = 0.25, voorZ = 0.1, neutraal = true): LastInstelling {
  switch (last) {
    case 'stang':
      return {
        o: { last: 'hangend', materiaal: [{ soort: 'stang', schijven: 2 }], elleboogRichting: { x: 0, y: 0, z: -1 } },
        zet: (h) => ({ ...h, greep, lastZ: voorZ }),
        gewicht: 0.35,
      }
    case 'halters':
      return {
        o: {
          last: 'hangend',
          materiaal: [{ soort: 'halters' }],
          elleboogRichting: { x: 0.3, y: 0, z: -1 },
          ...(neutraal ? { greepRichting: { x: 0, y: 0, z: 1 } } : {}),
        },
        zet: (h) => ({ ...h, greep, lastZ: schouderIn(h).z + voorZ }),
        gewicht: 0.25,
      }
    case 'kettlebell':
      return {
        o: { last: 'hangend', materiaal: [{ soort: 'kettlebell' }], elleboogRichting: { x: 0.2, y: 0, z: -1 } },
        zet: (h) => ({ ...h, greep: 0.035, lastZ: voorZ }),
        gewicht: 0.2,
      }
    case 'goblet':
      // Dumbbell verticaal tegen de borst, handen onder de bovenste schijf.
      return {
        o: { last: 'romp', materiaal: [{ soort: 'halterStaand' }], elleboogRichting: { x: 0.25, y: -1, z: 0.1 }, greepRichting: { x: 0, y: 1, z: 0 } },
        zet: (h) => ({ ...h, lastY: 0.19, lastZ: 0.2, greep: 0.05 }),
        gewicht: 0.2,
      }
    case 'armenVooruit':
      // Armen recht vooruit op schouderhoogte als tegengewicht.
      return {
        o: { last: 'wereld', materiaal: [], elleboogRichting: { x: 0.3, y: -1, z: 0 } },
        zet: (h) => {
          const s = schouderIn(h)
          return { ...h, lastY: s.y - 0.02, lastZ: s.z + 0.645, greep: 0.175 }
        },
        gewicht: 0,
      }
    default:
      return {
        o: { last: 'romp', materiaal: [], elleboogRichting: { x: 0.5, y: -0.6, z: 0 } },
        zet: (h) => ({ ...h, lastY: 0.0, lastZ: 0.16, greep: 0.2 }),
        gewicht: 0,
      }
  }
}

interface StaandExtra {
  readonly enkel?: Vec3
  readonly uitdraai?: number
  readonly spieren: readonly Lichaamsdeel[]
  readonly spierenSecundair?: readonly Lichaamsdeel[]
  readonly camera: Camera
  readonly knieRichting?: Vec3
  readonly blik?: Blik
}

function staandeOefening(naam: string, last: LastInstelling, sleutels: Oefening3d['sleutels'], extra: StaandExtra): Oefening3d {
  return {
    naam,
    sleutels,
    ...last.o,
    handen: 'greep',
    enkel: extra.enkel ?? STAAND.enkel,
    voet: { kanteling: 0, uitdraai: extra.uitdraai ?? STAAND.voet.uitdraai },
    knieRichting: extra.knieRichting ?? STAAND.knieRichting,
    spieren: extra.spieren,
    ...(extra.spierenSecundair ? { spierenSecundair: extra.spierenSecundair } : {}),
    camera: extra.camera,
    blik: extra.blik ?? BLIK.vooruit,
    kniePad: true,
  }
}

/** Doe het opzetten (last, balans) twee keer: de last hangt aan de romp en andersom. */
function opbouwen(o: Oefening3d, last: LastInstelling, h: Houding, doelZ: number): Houding {
  let uit = last.zet(h)
  for (let i = 0; i < 2; i++) uit = last.zet(balanceer(o, uit, doelZ, last.gewicht))
  return uit
}

// ── Squat ───────────────────────────────────────────────────────────────────

export interface SquatOpties {
  readonly naam: string
  readonly last: StaandeLast
  /** Hoogte van de heup onderin (0,47 is dij ongeveer horizontaal). */
  readonly diepte?: number
  /** Kanteling van het bekken onderin: goblet rechter (30), stang op de rug meer (42). */
  readonly kantel?: number
  readonly breedte?: number
  readonly greep?: number
  readonly camera?: Camera
  readonly tempo?: Tempo
  readonly blik?: Blik
}

/** Ruimte tussen het midden van de knie en een halter die ernaast hangt (m). */
const HALTER_NAAST_KNIE = 0.12

export function squat(op: SquatOpties): Oefening3d {
  const last = staandeLast(op.last, op.greep ?? 0.24)
  const enkel = { x: op.breedte ?? 0.16, y: 0.08, z: 0 }
  const diepte = op.diepte ?? 0.48
  const kantel = op.kantel ?? 32
  const basis = staandeOefening(op.naam, last, [], {
    enkel,
    uitdraai: 18,
    knieRichting: { x: 0.35, y: 0, z: 1 },
    spieren: ['dij', 'bil'],
    spierenSecundair: ['hamstring', 'onderrug'],
    camera: op.camera ?? CAMERA_PATROON.squat,
    ...(op.blik ? { blik: op.blik } : {}),
  })
  const ruw = (d: number) =>
    houding({
      bekkenY: HEUP_STAAND + (diepte - HEUP_STAAND) * d,
      bekkenZ: -0.1 * d,
      kantel: 5 + (kantel - 5) * d,
      lende: 3 * d,
      borst: -3 * d,
      schouders: 0.005,
    })
  // Knie en heup samen: de kniebuiging loopt even hard op als de kanteling.
  const knieBij = (d: number) => figuurIn(basis, opbouwen(basis, last, ruw(d), 0.05)).benen[0].buiging
  const knieBoven = knieBij(0)
  const knieOnder = knieBij(1)
  const maak = (p: { d: number }) => {
    const kb = knieBoven + (knieOnder - knieBoven) * p.d
    let uit = ruw(p.d)
    for (let i = 0; i < 3; i++) uit = opbouwen(basis, last, metKnie(basis, uit, kb), 0.05)
    if (op.last !== 'halters') return uit
    // Halters hangen naast de knieen, ook als die onderin naar buiten gaan.
    const knie = figuurIn(basis, uit).benen[0].midden.x
    return { ...uit, greep: Math.max(uit.greep, knie + HALTER_NAAST_KNIE) }
  }
  return metMoment({ ...basis, sleutels: lus({ d: 0 }, { d: 1 }, maak, op.tempo ?? TEMPO.squat, 2) })
}

// ── Hinge (heupscharnier) ───────────────────────────────────────────────────

export interface HingeOpties {
  readonly naam: string
  readonly last: StaandeLast
  /** Kanteling van het bekken onderin (graden voorover). */
  readonly kantel?: number
  /**
   * Vaste kniebuiging tijdens het scharnieren (graden), los van de diepte: een RDL
   * houdt 15 tot 20, een stiff leg deadlift 5 tot 10. Bovenaan zijn de knieen zacht.
   */
  readonly knie?: number
  /** Stang of halters: afstand tot de beenlijn (m), de last glijdt langs de benen. Null = vrij hangen. */
  readonly langsBeen?: number | null
  readonly greep?: number
  readonly breedte?: number
  readonly camera?: Camera
  readonly tempo?: Tempo
  readonly spieren?: readonly Lichaamsdeel[]
  readonly spierenSecundair?: readonly Lichaamsdeel[]
  readonly blik?: Blik
}

/** Zachte knieen bovenaan een heupscharnier (graden). */
const KNIE_ZACHT = 5

export function hinge(op: HingeOpties): Oefening3d {
  const last = staandeLast(op.last, op.greep ?? 0.23, 0.1, false)
  const kantel = op.kantel ?? 68
  const knie = op.knie ?? 18
  const hangt = op.last === 'stang' || op.last === 'halters'
  const standaard = op.last === 'stang' ? 0.085 : 0.07
  const afstand = hangt ? (op.langsBeen === undefined ? standaard : op.langsBeen) : null
  const basis = staandeOefening(op.naam, last, [], {
    enkel: { x: op.breedte ?? 0.12, y: 0.08, z: 0 },
    uitdraai: 6,
    knieRichting: { x: 0.15, y: 0, z: 1 },
    spieren: op.spieren ?? ['hamstring', 'bil'],
    spierenSecundair: op.spierenSecundair ?? ['onderrug'],
    camera: op.camera ?? CAMERA_PATROON.scharnier,
    blik: op.blik ?? BLIK.scharnier,
  })
  const maak = (p: { d: number }) => {
    // Eerst de knieen in hun vaste buiging, daarna alleen de heupen naar achteren.
    const kb = KNIE_ZACHT + (knie - KNIE_ZACHT) * Math.min(1, p.d / 0.25)
    let h = houding({
      bekkenY: HEUP_STAAND,
      kantel: 3 + (kantel - 3) * p.d,
      lende: -1,
      borst: -3 * p.d,
      schouders: -0.015 - 0.02 * p.d,
    })
    for (let i = 0; i < 5; i++) {
      h = metKnie(basis, last.zet(h), kb)
      if (afstand !== null) h = langsBeen(basis, h, afstand)
      const fout = zwaartepuntZ(basis, h, last.gewicht) - 0.04
      h = { ...h, bekkenZ: h.bekkenZ - fout * 1.2 }
    }
    h = metKnie(basis, h, kb)
    return afstand === null ? h : langsBeen(basis, h, afstand)
  }
  return metMoment({ ...basis, sleutels: lus({ d: 0 }, { d: 1 }, maak, op.tempo ?? TEMPO.hinge, 2) })
}

/** Kettlebell swing: heupen naar achteren met de bel tussen de benen, dan explosief strekken tot borsthoogte. */
export function swing(naam: string): Oefening3d {
  const last = staandeLast('kettlebell')
  const basis = staandeOefening(naam, last, [], {
    enkel: { x: 0.2, y: 0.08, z: 0 },
    uitdraai: 14,
    knieRichting: { x: 0.35, y: 0, z: 1 },
    spieren: ['bil', 'hamstring'],
    spierenSecundair: ['onderrug', 'schouder'],
    camera: { hoek: 72, hoogte: 8, afstand: 4.3, doel: { x: 0, y: 0.85, z: 0.05 } },
    blik: BLIK.scharnier,
  })
  const maak = (p: { d: number }) => {
    const d = p.d
    const h = houding({
      bekkenY: 0.925 + (0.8 - 0.925) * d,
      kantel: 2 + 60 * d,
      lende: -1,
      schouders: -0.01,
    })
    const vast = balanceer(basis, { ...h, greep: 0.035, lastZ: 0 }, 0.04, 0.2)
    const s = schouderIn(vast)
    // Boven: bel recht vooruit op borsthoogte. Onder: bel tussen en achter de knieen.
    const lastZ = s.z + 0.62 * (1 - d) + (-0.14 - s.z) * d
    return { ...vast, greep: 0.035, lastZ }
  }
  const sleutels = lus({ d: 0 }, { d: 1 }, maak, TEMPO.explosief, 3)
  return metMoment({ ...basis, sleutels })
}

// ── Lunge ───────────────────────────────────────────────────────────────────

export interface LungeOpties {
  readonly naam: string
  /** Achterwaarts (rechtervoet stapt naar achteren), voorwaarts of op de plek (split squat). */
  readonly richting: 'achter' | 'voor' | 'plek'
  readonly last: 'halters' | 'geen'
  readonly pas?: number
  readonly camera?: Camera
}

/**
 * Lunge: de linkervoet staat vast, de rechtervoet stapt (achter of voor) of staat
 * al in spreidstand (split squat). Onderin twee hoeken van ongeveer 90 graden,
 * romp rechtop, gewicht op de voorste voet.
 */
export function lunge(op: LungeOpties): Oefening3d {
  const pas = op.pas ?? 0.82
  const last = op.last === 'halters' ? staandeLast('halters', 0.25, 0.0) : staandeLast('geen')
  const voor = op.richting === 'voor'
  const plek = op.richting === 'plek'
  // Linkervoet vast. Bij voorwaarts stapt rechts naar voren en gaat de linkerhiel omhoog.
  const links = { x: 0.11, y: 0.08, z: 0 }
  const basis: Oefening3d = {
    ...staandeOefening(op.naam, last, [], {
      enkel: links,
      uitdraai: 4,
      knieRichting: { x: 0.12, y: 0, z: 1 },
      spieren: ['dij', 'bil'],
      spierenSecundair: ['hamstring'],
      camera: op.camera ?? { ...CAMERA_PATROON.lunge, doel: { ...CAMERA_PATROON.lunge.doel, z: voor ? 0.3 : -0.3 } },
    }),
    ...(plek ? { enkelRechts: { x: -0.11, y: 0.08, z: -pas } } : {}),
  }
  const hielOp = 55
  const maak = (p: { t: number }) => {
    const stap = plek ? 1 : Math.min(1, p.t * 1.6)
    const d = plek ? p.t : Math.max(0, (p.t - 0.3) / 0.7)
    const til = Math.sin(Math.PI * stap) * 0.07
    // De achterste voet staat op de bal van de voet.
    const hiel = (plek ? 1 : Math.max(0, stap * 2 - 1)) * hielOp
    const kant = opTenen(hiel)
    let voetKanalen: Partial<Houding>
    if (voor) {
      // Rechts stapt naar voren; links wordt de achterste voet en gaat op de bal.
      const lk = opTenen(hiel)
      voetKanalen = {
        voetKantel: hiel,
        voetY: lk.voetY,
        voetZ: lk.voetZ,
        stapKantel: -hiel,
        stapY: til - lk.voetY,
        stapZ: pas * stap - lk.voetZ,
      }
    } else if (plek) {
      // Achterste hiel: hoger naarmate de achterste knie zakt.
      const hielPlek = hielOp - 10 + 18 * d
      const tenen = opTenen(hielPlek)
      voetKanalen = { stapKantel: hielPlek, stapY: tenen.voetY, stapZ: tenen.voetZ }
    } else {
      voetKanalen = { stapKantel: hiel, stapY: til + kant.voetY, stapZ: -pas * stap + kant.voetZ }
    }
    const voorZ = voor ? pas : 0
    const achterZ = voor ? 0 : -pas
    const h = houding({
      bekkenY: HEUP_STAAND - 0.012 * stap - 0.4 * d,
      bekkenZ: (voorZ + achterZ) / 2 * stap,
      kantel: 6 + 6 * d,
      lende: 0,
      borst: -2 * d,
      ...voetKanalen,
    })
    const doel = voorZ * stap * 0.55 + achterZ * stap * 0.42 + 0.04
    return opbouwen(basis, last, h, doel)
  }
  const tempo = plek ? TEMPO.squat : { begin: 0.4, heen: 2.2, eind: 0.3, terug: 1.6 }
  return metMoment({ ...basis, sleutels: lus({ t: 0 }, { t: 1 }, maak, tempo, plek ? 2 : 3) })
}

// ── Heupstrek liggend: hip thrust en glute bridge ───────────────────────────

export interface HeupstrekOpties {
  readonly naam: string
  /** Met de bovenrug op een bank (hip thrust) of op de vloer (bridge). */
  readonly steun: 'bank' | 'vloer'
  readonly last: 'stang' | 'geen'
  readonly camera?: Camera
}

const BANK_Z = -0.42

export function heupstrek(op: HeupstrekOpties): Oefening3d {
  const bank = op.steun === 'bank'
  const steunPunt = bank ? { x: 0, y: 0.455, z: BANK_Z + 0.13 } : { x: 0, y: 0.02, z: -0.25 }
  const enkel = bank ? { x: 0.15, y: 0.08, z: 0.5 } : { x: 0.13, y: 0.08, z: 0.42 }
  const materiaal: Materiaal[] = []
  if (bank) materiaal.push({ soort: 'bankKaal', plek: { x: 0, y: 0, z: BANK_Z }, draai: 90 })
  else materiaal.push({ soort: 'mat', plek: { x: 0, y: 0, z: 0.1 } })
  if (op.last === 'stang') materiaal.push({ soort: 'stang', schijven: 2 })
  const basis: Oefening3d = {
    naam: op.naam,
    sleutels: [],
    last: op.last === 'stang' ? 'bekken' : 'wereld',
    handen: op.last === 'stang' ? 'greep' : 'plat',
    enkel,
    voet: { kanteling: 0, uitdraai: 10 },
    knieRichting: { x: 0.3, y: 1, z: 0.4 },
    elleboogRichting: op.last === 'stang' ? { x: 0.6, y: 0.5, z: -0.5 } : { x: 0.2, y: 0.3, z: -1 },
    materiaal,
    spieren: ['bil'],
    spierenSecundair: ['hamstring', 'dij'],
    camera: op.camera ?? CAMERA_PATROON.heupstrek,
  }
  const onder = bank ? -52 : -90
  // Boven: romp en dijen in een lijn (bank: horizontaal; vloer: heupen hoger dan schouders).
  const boven = bank ? -88 : -114
  const maak = (p: { d: number }) => {
    const kantel = onder + (boven - onder) * p.d
    let h = houding({ kantel, lende: 0, borst: bank ? 0 : 0, nek: bank ? 18 * p.d + 12 : 6, schouders: -0.01 })
    h = steunOp(h, steunPunt, bank ? undefined : { x: 0, y: 0.14, z: -0.1 })
    if (op.last === 'stang') return { ...h, lastY: 0.0, lastZ: 0.15, greep: 0.3 }
    return { ...h, lastY: 0.03, lastZ: steunPunt.z + 0.36, greep: 0.25 }
  }
  return metMoment({ ...basis, sleutels: lus({ d: 0 }, { d: 1 }, maak, TEMPO.trekken, 1) })
}

// ── Leg press ───────────────────────────────────────────────────────────────

export interface LegPressOpties {
  readonly naam: string
  /** Hoek van de slede boven horizontaal: 45 (klassiek) of 0 (zittend). */
  readonly hoek: number
  readonly camera?: Camera
}

/**
 * Leg press: het bekken ligt vast in de stoel, het plateau gaat met de voeten
 * mee. Onderin knieen ongeveer 95 graden, boven niet op slot.
 */
export function legPress(op: LegPressOpties): Oefening3d {
  const rad = (op.hoek * Math.PI) / 180
  const richting = { y: Math.sin(rad), z: Math.cos(rad) }
  const leun = op.hoek > 20 ? -52 : -22
  const h0 = houding({ bekkenY: op.hoek > 20 ? 0.5 : 0.56, bekkenZ: 0, kantel: leun, nek: op.hoek > 20 ? 20 : 8, schouders: -0.01 })
  const heup = heupIn(h0)
  const onder = op.hoek > 20 ? 0.53 : 0.55
  const boven = 0.84
  const plek = (afstand: number) => ({ y: heup.y + richting.y * afstand, z: heup.z + richting.z * afstand })
  const start = plek(onder)
  const enkel = { x: 0.15, y: start.y, z: start.z }
  // Zool tegen het plateau: tenen omhoog langs het plateau.
  const kanteling = -(90 + op.hoek)
  const basis: Oefening3d = {
    naam: op.naam,
    sleutels: [],
    last: 'wereld',
    handen: 'greep',
    enkel,
    voet: { kanteling, uitdraai: 10 },
    knieRichting: { x: 0.3, y: 0.75, z: -0.6 },
    elleboogRichting: { x: 0.4, y: 0, z: -1 },
    greepRichting: { x: 0, y: 0, z: 1 },
    materiaal: [{ soort: 'legPress', hoek: op.hoek, plek: { x: 0, y: 0, z: 0 } }],
    spieren: ['dij', 'bil'],
    spierenSecundair: ['hamstring'],
    camera: op.camera ?? { hoek: 74, hoogte: 13, afstand: 4.9, doel: { x: 0, y: 0.78, z: 0.42 } },
  }
  const maak = (p: { d: number }) => {
    const pos = plek(boven + (onder - boven) * p.d)
    return { ...h0, voetY: pos.y - start.y, voetZ: pos.z - start.z, lastY: heup.y - 0.02, lastZ: heup.z + 0.08, greep: 0.29 }
  }
  return metMoment({ ...basis, sleutels: lus({ d: 0 }, { d: 1 }, maak, TEMPO.zakken, 1) })
}

// ── Beenmachine: leg extension en leg curl zittend ──────────────────────────

export interface BeenMachineOpties {
  readonly naam: string
  readonly variant: 'extension' | 'curl'
  readonly camera?: Camera
}

export function beenMachine(op: BeenMachineOpties): Oefening3d {
  const ext = op.variant === 'extension'
  const h0 = houding({ bekkenY: 0.56, bekkenZ: 0, kantel: -12, nek: 10, schouders: -0.01 })
  const heup = heupIn(h0)
  // Knie: van 90 naar 10 graden (extension) of van 15 naar 110 (curl).
  const van = ext ? 92 : 14
  const naar = ext ? 12 : 108
  const enkelOp = (knie: number) => enkelPlek(h0, { heffen: 86, knie })
  const start = enkelOp(van)
  const basis: Oefening3d = {
    naam: op.naam,
    sleutels: [],
    last: 'wereld',
    handen: 'greep',
    enkel: { x: start.x, y: start.y, z: start.z },
    voet: { kanteling: 0, uitdraai: 4 },
    knieRichting: { x: 0, y: 1, z: 0.25 },
    elleboogRichting: { x: 0.4, y: 0, z: -1 },
    greepRichting: { x: 0, y: 0, z: 1 },
    materiaal: [{ soort: 'beenMachine', variant: op.variant, plek: { x: 0, y: 0, z: heup.z + MATEN.dij } }],
    spieren: ext ? ['dij'] : ['hamstring'],
    ...(ext ? {} : { spierenSecundair: ['kuit'] as const }),
    camera: op.camera ?? { hoek: 72, hoogte: 12, afstand: 4.2, doel: { x: 0, y: 0.75, z: 0.25 } },
  }
  const maak = (p: { k: number }) => {
    const e = enkelOp(p.k)
    return {
      ...h0,
      voetY: e.y - start.y,
      voetZ: e.z - start.z,
      voetKantel: p.k - 90,
      lastY: heup.y - 0.03,
      lastZ: heup.z + 0.06,
      greep: 0.27,
    }
  }
  return metMoment({ ...basis, sleutels: lus({ k: van }, { k: naar }, maak, TEMPO.trekken, 2) })
}

// ── Kuit: calf raise ────────────────────────────────────────────────────────

export function calfRaise(naam: string): Oefening3d {
  const opstap = 0.08
  const basis: Oefening3d = {
    naam,
    sleutels: [],
    last: 'romp',
    handen: 'greep',
    enkel: { x: 0.11, y: 0.08 + opstap, z: 0 },
    voet: { kanteling: 0, uitdraai: 2 },
    knieRichting: { x: 0.1, y: 0, z: 1 },
    elleboogRichting: { x: 0.5, y: -1, z: 0 },
    materiaal: [{ soort: 'kuitMachine', plek: { x: 0, y: 0, z: 0.13 } }],
    spieren: ['kuit'],
    camera: { hoek: 70, hoogte: 6, afstand: 4.2, doel: { x: 0, y: 0.95, z: 0 } },
    blik: BLIK.vooruit,
  }
  const maak = (p: { a: number }) => {
    const t = opTenen(p.a)
    return houding({
      bekkenY: HEUP_STAAND - 0.004 + opstap + t.voetY,
      bekkenZ: -0.02 + t.voetZ,
      kantel: 3,
      schouders: 0,
      voetKantel: p.a,
      voetY: t.voetY,
      voetZ: t.voetZ,
      lastY: 0.21,
      lastZ: 0.2,
      greep: 0.28,
    })
  }
  return metMoment({ ...basis, sleutels: lus({ a: -14 }, { a: 34 }, maak, { begin: 0.7, heen: 1.0, eind: 0.6, terug: 1.6 }, 1) })
}
