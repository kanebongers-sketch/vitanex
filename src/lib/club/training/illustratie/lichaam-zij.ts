// ─── Fit Factory Club, illustraties: het lichaam in zijaanzicht (PUUR) ──────
// Zachte, afgeronde vormen over het skelet: per deel een profiel (dikte langs
// het deel, met kuit, quadriceps, deltoideus), de romp als een vloeiende vorm
// over bekken, lage rug, borstkas en nek, een hoofd met een rustig profiel en
// sportschoenen. De verre kant is iets donkerder, de nabije arm iets lichter:
// zo ontstaat diepte zonder lijnen. Spieren die werken liggen er als lenzen in
// de accentkleur bovenop, met een smalle schaduwmaan voor volume.

import type { Spier } from '../spieren'
import type { Kleur, Laag, Lagen } from './laag'
import { legeLagen } from './laag'
import type { ArmSkelet, BeenSkelet, ZijSkelet } from './skelet-zij'
import { MATEN } from './skelet-zij'
import { punt, type Assen, type Vec } from './vec'
import { ellips, gladGesloten, ledemaatOmtrek, schaduwMaan, spierBand, spierLens, type Profiel } from './vorm'

// Profielen: [t, pluskant, minkant]. Bij benen en armen is de pluskant (normaal n)
// de achterkant (kuit, hamstrings, triceps); bij de romp is de pluskant de voorkant.
export const PROFIEL = {
  bovenbeen: [[0, 9.0, 9.0], [0.2, 8.8, 9.6], [0.45, 8.0, 8.9], [0.7, 6.8, 7.5], [0.9, 5.6, 5.9], [1, 5.2, 5.3]],
  onderbeen: [[0, 5.2, 5.1], [0.15, 7.0, 4.7], [0.3, 7.5, 4.3], [0.5, 5.9, 3.9], [0.75, 3.8, 3.1], [1, 3.2, 3.0]],
  bovenarm: [[0, 6.3, 6.6], [0.15, 6.3, 6.6], [0.35, 5.6, 5.4], [0.6, 5.1, 5.0], [0.85, 4.0, 3.9], [1, 3.6, 3.5]],
  onderarm: [[0, 3.8, 3.7], [0.25, 4.2, 4.5], [0.6, 3.3, 3.2], [1, 2.5, 2.6]],
} as const satisfies Record<string, Profiel>

type RompDeel = 'bekken' | 'lumbaal' | 'thoracaal' | 'nek'
type RompPunt = readonly [deel: RompDeel, langs: number, dwars: number]

// De omtrek van de romp, met de klok mee vanaf het kruis. Dwars positief = voorkant.
const ROMP: readonly RompPunt[] = [
  ['bekken', -8, 1.5],
  ['bekken', -1.5, 8.2],
  ['bekken', 7, 9.4],
  ['lumbaal', 6, 13.4],
  ['lumbaal', 14.5, 14.2],
  ['thoracaal', 4.5, 16.4],
  ['thoracaal', 12.5, 19.4],
  ['thoracaal', 19.5, 18.4],
  ['thoracaal', 25.5, 11.6],
  ['nek', 5.5, 5.4],
  ['nek', 7, -4.8],
  ['thoracaal', 26, -6.6],
  ['thoracaal', 19, -9.2],
  ['thoracaal', 10.5, -9.2],
  ['thoracaal', 2.5, -7.4],
  ['lumbaal', 13, -4.8],
  ['lumbaal', 4.5, -3.4],
  ['bekken', 8.5, -11.8],
  ['bekken', 2, -13.8],
  ['bekken', -4.5, -12.6],
  ['bekken', -10, -9],
]

// Het hoofd in zijn eigen assen (oorsprong onder de schedel, dwars positief = gezicht).
const HOOFD: readonly (readonly [number, number])[] = [
  [-1.5, 4.2], [-0.4, 9.2], [3.4, 10.4], [5.6, 10.6], [7.4, 12], [9.8, 10.7], [12.6, 10.9],
  [16.6, 9.2], [20.4, 4.6], [21.4, -1.4], [19, -7], [13, -9.6], [6, -8.2], [1.5, -5.6],
]
const HAAR: readonly (readonly [number, number])[] = [
  [15.4, 9.3], [19, 7.6], [21.4, 3.8], [22.3, -1.6], [19.8, -7.7], [13.2, -10.4], [7, -9.1],
  [8.4, -6.6], [12, -4.6], [14, 0.6], [14.6, 5.4],
]

// Sportschoen in de assen van de voet (oorsprong enkel, langs = naar de teen, dwars positief = zool).
const SCHOEN: readonly (readonly [number, number])[] = [
  [-4.8, 7.5], [-5.7, 3.6], [-4.2, -2.6], [-0.6, -3.6], [2.8, -3.2], [8.6, -0.6], [15.6, 3.1],
  [19.6, 5.9], [18.6, 7.6], [6, 7.8],
]
const ZOOL: readonly (readonly [number, number])[] = [
  [-5.3, 6.1], [-4.9, 7.7], [6, 7.9], [18.6, 7.8], [19.9, 6.2], [18.7, 6.3], [6, 6.3], [-4.6, 6.1],
]

// Vuist in de assen van de hand (oorsprong pols, langs = naar de greep).
const VUIST: readonly (readonly [number, number])[] = [
  [-0.4, 2.9], [3, 4.1], [7.6, 4.4], [10.2, 2.6], [10.8, -0.5], [9.2, -3.7], [5, -4.3], [1, -3.1],
]

type LidDeel = 'bovenbeen' | 'onderbeen' | 'bovenarm' | 'onderarm'
export type SpierVorm =
  | { readonly deel: LidDeel; readonly kant: 1 | -1; readonly t0: number; readonly t1: number; readonly diepte: number }
  | { readonly deel: LidDeel; readonly band: readonly [number, number] }
  | { readonly deel: 'romp'; readonly punten: readonly RompPunt[] }

// Waar elke spier in zijaanzicht ligt.
export const SPIER_ZIJ: Partial<Record<Spier, readonly SpierVorm[]>> = {
  quadriceps: [{ deel: 'bovenbeen', kant: -1, t0: 0.12, t1: 0.94, diepte: 0.82 }],
  hamstrings: [{ deel: 'bovenbeen', kant: 1, t0: 0.18, t1: 0.92, diepte: 0.72 }],
  adductoren: [{ deel: 'bovenbeen', kant: 1, t0: 0.05, t1: 0.45, diepte: 0.5 }],
  kuiten: [{ deel: 'onderbeen', kant: 1, t0: 0.05, t1: 0.66, diepte: 0.8 }],
  scheenbeenspier: [{ deel: 'onderbeen', kant: -1, t0: 0.08, t1: 0.62, diepte: 0.7 }],
  biceps: [{ deel: 'bovenarm', kant: -1, t0: 0.3, t1: 0.9, diepte: 0.9 }],
  triceps: [{ deel: 'bovenarm', kant: 1, t0: 0.22, t1: 0.92, diepte: 0.95 }],
  middelste_schouder: [{ deel: 'bovenarm', band: [0, 0.3] }],
  voorste_schouder: [{ deel: 'bovenarm', kant: -1, t0: -0.04, t1: 0.36, diepte: 1.0 }],
  achterste_schouder: [{ deel: 'bovenarm', kant: 1, t0: -0.04, t1: 0.34, diepte: 1.0 }],
  onderarmen: [{ deel: 'onderarm', band: [0.04, 0.62] }],
  bilspieren: [{ deel: 'romp', punten: [['lumbaal', 1, -4.2], ['bekken', 8.5, -11.8], ['bekken', 2, -13.8], ['bekken', -4.5, -12.6], ['bekken', -10, -9], ['bekken', -7, -5.5], ['bekken', 0, -6.5], ['bekken', 6.5, -7.2]] }],
  abductoren: [{ deel: 'romp', punten: [['bekken', 9, -9.5], ['bekken', 4, -11], ['bekken', 1, -6], ['bekken', 6, -3], ['bekken', 10, -5]] }],
  onderrug: [{ deel: 'romp', punten: [['bekken', 10, -10], ['lumbaal', 5, -4], ['lumbaal', 14, -5.2], ['thoracaal', 4, -7.2], ['thoracaal', 4, -3.6], ['lumbaal', 12, -1.6], ['lumbaal', 4, -0.8]] }],
  latissimus: [{ deel: 'romp', punten: [['lumbaal', 14, -4.8], ['thoracaal', 3, -7.2], ['thoracaal', 10.5, -8.6], ['thoracaal', 17, -8.3], ['thoracaal', 16, -1], ['thoracaal', 9, 1.5], ['thoracaal', 2, 0]] }],
  rhomboideus: [{ deel: 'romp', punten: [['thoracaal', 9, -8.5], ['thoracaal', 15, -8.5], ['thoracaal', 21, -7.9], ['thoracaal', 18, -4.5], ['thoracaal', 12, -4.6]] }],
  trapezius: [{ deel: 'romp', punten: [['thoracaal', 17, -8.3], ['thoracaal', 26, -6.2], ['nek', 7, -4.6], ['nek', 5.5, -1.5], ['thoracaal', 25, -2], ['thoracaal', 19, -4.5]] }],
  borstspieren: [{ deel: 'romp', punten: [['thoracaal', 8.5, 17.3], ['thoracaal', 13.5, 18.2], ['thoracaal', 20.5, 16.4], ['thoracaal', 24.5, 12.3], ['thoracaal', 21, 8], ['thoracaal', 14, 11], ['thoracaal', 9.5, 13.5]] }],
  rechte_buikspier: [{ deel: 'romp', punten: [['bekken', 6, 9.5], ['lumbaal', 6, 14.2], ['lumbaal', 15, 15.2], ['thoracaal', 5, 16.6], ['thoracaal', 6, 13], ['lumbaal', 14, 11.4], ['lumbaal', 5, 10.6], ['bekken', 7, 6.8]] }],
  diepe_buikspier: [{ deel: 'romp', punten: [['bekken', 6, 9.5], ['lumbaal', 6, 14.2], ['lumbaal', 15, 15.2], ['thoracaal', 5, 16.6], ['thoracaal', 6, 13], ['lumbaal', 14, 11.4], ['lumbaal', 5, 10.6], ['bekken', 7, 6.8]] }],
  schuine_buikspieren: [{ deel: 'romp', punten: [['lumbaal', 3, 10], ['lumbaal', 10, 12.6], ['thoracaal', 2, 13], ['thoracaal', 6, 9], ['lumbaal', 12, 5.5], ['lumbaal', 5, 5.8]] }],
  heupbuigers: [{ deel: 'romp', punten: [['bekken', 6, 8.6], ['bekken', 0, 7.6], ['bekken', -2, 4.6], ['bekken', 4, 4.4]] }],
}

export interface SpierKeuze {
  readonly primair: readonly Spier[]
  readonly secundair: readonly Spier[]
}

function rompAssen(s: ZijSkelet, deel: RompDeel): Assen {
  return deel === 'bekken' ? s.bekken : deel === 'lumbaal' ? s.lumbaal : deel === 'thoracaal' ? s.thoracaal : s.nek
}

function rompPunt(s: ZijSkelet, [deel, langs, dwars]: RompPunt): Vec {
  return punt(rompAssen(s, deel), langs, dwars)
}

function inAssen(a: Assen, lijst: readonly (readonly [number, number])[]): Vec[] {
  return lijst.map(([l, d]) => punt(a, l, d))
}

function lidAssen(lid: ArmSkelet | BeenSkelet, deel: LidDeel): { a: Assen; l: number } | null {
  if ('greep' in lid) {
    if (deel === 'bovenarm') return { a: lid.boven, l: lid.lBoven }
    if (deel === 'onderarm') return { a: lid.onder, l: lid.lOnder }
    return null
  }
  if (deel === 'bovenbeen') return { a: lid.boven, l: MATEN.bovenbeen }
  if (deel === 'onderbeen') return { a: lid.onder, l: MATEN.onderbeen }
  return null
}

function spierKleur(primair: boolean, ver: boolean): Kleur {
  if (ver) return primair ? 'spierVer' : 'spierVerZacht'
  return primair ? 'spier' : 'spierZacht'
}

/** De spierlagen op een ledemaat. */
function spierenOpLid(lid: ArmSkelet | BeenSkelet, deel: LidDeel, keuze: SpierKeuze, ver: boolean, sleutel: string): Laag[] {
  const plek = lidAssen(lid, deel)
  if (!plek) return []
  const profiel = PROFIEL[deel]
  const uit: Laag[] = []
  const lagen = [
    ...keuze.secundair.map((sp) => ({ sp, primair: false })),
    ...keuze.primair.map((sp) => ({ sp, primair: true })),
  ]
  for (const { sp, primair } of lagen) {
    for (const [i, vorm] of (SPIER_ZIJ[sp] ?? []).entries()) {
      if (vorm.deel !== deel) continue
      const punten = 'band' in vorm
        ? spierBand(plek.a, plek.l, profiel, vorm.band[0], vorm.band[1])
        : spierLens(plek.a, plek.l, profiel, vorm.kant, vorm.t0, vorm.t1, vorm.diepte)
      uit.push({ sleutel: `${sleutel}-${sp}-${i}`, d: gladGesloten(punten), kleur: spierKleur(primair, ver) })
    }
  }
  return uit
}

function lidLagen(lid: ArmSkelet | BeenSkelet, deel: LidDeel, keuze: SpierKeuze, huid: Kleur, ver: boolean, sleutel: string): Laag[] {
  const plek = lidAssen(lid, deel)
  if (!plek) return []
  const profiel = PROFIEL[deel]
  // Licht van voren en boven: de schaduwmaan ligt aan de achterkant van armen en benen.
  return [
    { sleutel: `${sleutel}-vorm`, d: gladGesloten(ledemaatOmtrek(plek.a, plek.l, profiel)), kleur: huid },
    ...spierenOpLid(lid, deel, keuze, ver, sleutel),
    { sleutel: `${sleutel}-schaduw`, d: gladGesloten(schaduwMaan(plek.a, plek.l, profiel, 1, 0.34)), kleur: 'schaduw' },
    { sleutel: `${sleutel}-glans`, d: gladGesloten(schaduwMaan(plek.a, plek.l, profiel, -1, 0.22)), kleur: 'glans' },
  ]
}

function schoenLagen(been: BeenSkelet, ver: boolean, sleutel: string): Laag[] {
  return [
    { sleutel: `${sleutel}-schoen`, d: gladGesloten(inAssen(been.voet, SCHOEN), 0.9), kleur: ver ? 'schoenVer' : 'schoen' },
    { sleutel: `${sleutel}-zool`, d: gladGesloten(inAssen(been.voet, ZOOL), 0.6), kleur: 'zool' },
  ]
}

function vuistLaag(arm: ArmSkelet, huid: Kleur, sleutel: string): Laag {
  return { sleutel: `${sleutel}-vuist`, d: gladGesloten(inAssen(arm.hand, VUIST)), kleur: huid }
}

function beenLagen(b: BeenSkelet, keuze: SpierKeuze, ver: boolean, sleutel: string): Laag[] {
  const huid: Kleur = ver ? 'huidVer' : 'huid'
  return [
    ...lidLagen(b, 'onderbeen', keuze, huid, ver, `${sleutel}-onder`),
    ...schoenLagen(b, ver, sleutel),
    ...lidLagen(b, 'bovenbeen', keuze, huid, ver, `${sleutel}-boven`),
  ]
}

function armLagen(a: ArmSkelet, keuze: SpierKeuze, ver: boolean, sleutel: string): Laag[] {
  const huid: Kleur = ver ? 'huidVer' : 'huidNabij'
  return [
    ...lidLagen(a, 'bovenarm', keuze, huid, ver, `${sleutel}-boven`),
    ...lidLagen(a, 'onderarm', keuze, huid, ver, `${sleutel}-onder`),
  ]
}

function rompSpieren(s: ZijSkelet, keuze: SpierKeuze): Laag[] {
  const lagen = [
    ...keuze.secundair.map((sp) => ({ sp, primair: false })),
    ...keuze.primair.map((sp) => ({ sp, primair: true })),
  ]
  const uit: Laag[] = []
  for (const { sp, primair } of lagen) {
    for (const [i, vorm] of (SPIER_ZIJ[sp] ?? []).entries()) {
      if (vorm.deel !== 'romp') continue
      // Net binnen de omtrek: de spier ligt op het lichaam, niet erbuiten.
      const punten = vorm.punten.map(([deel, langs, dwars]) => rompPunt(s, [deel, langs, dwars * 0.95]))
      uit.push({ sleutel: `romp-${sp}-${i}`, d: gladGesloten(punten), kleur: spierKleur(primair, false) })
    }
  }
  return uit
}

function hoofdLagen(s: ZijSkelet): Laag[] {
  const h = s.hoofd
  const oor = punt(h, 9.4, -1.6)
  return [
    { sleutel: 'hoofd', d: gladGesloten(inAssen(h, HOOFD)), kleur: 'huid' },
    { sleutel: 'oor', d: ellips(oor, 1.4, 2.2, h.hoek), kleur: 'schaduw' },
    { sleutel: 'haar', d: gladGesloten(inAssen(h, HAAR)), kleur: 'haar' },
  ]
}

function rompSchaduw(s: ZijSkelet): Laag {
  // Langs de rug: dezelfde punten als de omtrek, met een binnenrand een paar cm naar voren.
  const rug: RompPunt[] = [
    ['nek', 6.5, -4.4], ['thoracaal', 26, -6.1], ['thoracaal', 19, -8.1], ['thoracaal', 10.5, -8.5],
    ['thoracaal', 3, -7.1], ['lumbaal', 14, -5.1], ['lumbaal', 5, -3.9], ['bekken', 8, -11.6], ['bekken', 2, -13.6], ['bekken', -4.5, -12.4], ['bekken', -9.6, -8.9],
  ]
  const binnen: RompPunt[] = [
    ['bekken', -3, -8.5], ['bekken', 2, -9.6], ['bekken', 8, -8.2], ['lumbaal', 7, -1.2], ['lumbaal', 14, -2],
    ['thoracaal', 4, -3.4], ['thoracaal', 11, -4.6], ['thoracaal', 19, -4.4], ['thoracaal', 25.5, -3.4],
  ]
  return { sleutel: 'romp-schaduw', d: gladGesloten([...rug, ...binnen].map((p) => rompPunt(s, p))), kleur: 'schaduw' }
}

function rompGlans(s: ZijSkelet): Laag {
  // Langs de voorkant (borst en buik): het licht valt van voren en boven.
  const voor: RompPunt[] = [
    ['bekken', 6, 9.2], ['lumbaal', 6, 13.2], ['lumbaal', 14.5, 14], ['thoracaal', 4.5, 16.2], ['thoracaal', 12.5, 19.2], ['thoracaal', 19.5, 18.2], ['thoracaal', 24.5, 12.6],
  ]
  const binnen: RompPunt[] = [
    ['thoracaal', 19, 14.6], ['thoracaal', 12.5, 15.6], ['thoracaal', 4.5, 13], ['lumbaal', 14.5, 11.2], ['lumbaal', 6, 10.8],
  ]
  return { sleutel: 'romp-glans', d: gladGesloten([...voor, ...binnen].map((p) => rompPunt(s, p))), kleur: 'glans' }
}

/** Alle lagen van het lichaam, verdeeld over de dieptevakken. */
export function lichaamZij(s: ZijSkelet, keuze: SpierKeuze): Lagen {
  const l = legeLagen()
  l.ver = [
    ...beenLagen(s.beenVer, keuze, true, 'been-ver'),
    ...armLagen(s.armVer, keuze, true, 'arm-ver'),
  ]
  l.verHand = [vuistLaag(s.armVer, 'huidVer', 'arm-ver')]
  l.romp = [
    { sleutel: 'romp', d: gladGesloten(ROMP.map((p) => rompPunt(s, p))), kleur: 'huid' },
    ...rompSpieren(s, keuze),
    rompSchaduw(s),
    rompGlans(s),
    ...hoofdLagen(s),
  ]
  l.beenNabij = beenLagen(s.beenNabij, keuze, false, 'been-nabij')
  l.armNabij = armLagen(s.armNabij, keuze, false, 'arm-nabij')
  l.hand = [vuistLaag(s.armNabij, 'huidNabij', 'arm-nabij')]
  return l
}

/** Hulp voor tests en materiaal: de punten van de schoenzool in de ruimte. */
export function zoolPunten(been: BeenSkelet): Vec[] {
  return inAssen(been.voet, SCHOEN)
}

