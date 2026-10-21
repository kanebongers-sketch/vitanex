// ─── Fit Factory Club, 3D-oefenbeelden: handen ──────────────────────────────
// Om een stang, halter, kabelgreep of kettlebell: de handpalm ligt achter de
// greep, vier vingers krullen er strak omheen (met knokkels, gewrichten en
// nagels) en de duim sluit er van de andere kant overheen. Plat op de vloer
// (push-up, plank): de muis van de hand loopt vloeiend over in de pols, de
// vingers liggen licht gebogen en bijna gesloten naast elkaar.
//
// Oorsprong in het midden van de greep (plat: bij de pols), y van de pols naar
// de vingers, x langs de stang. Plat: z wijst naar de vloer.

import { Color, Vector3 } from 'three'
import type { HandModus } from '@/lib/club/training/3d/typen'
import { buis, glad, klok, raster, tabel, type Bouwer, type PuntInfo } from './bouwer'
import { kleurMet, sterkteVan, type Palet } from './palet'
import { BOT } from './skelet'

function macht(x: number, n: number): number {
  return Math.sign(x) * Math.abs(x) ** (2 / n)
}

const v = (x: number, y: number, z: number) => new Vector3(x, y, z)

interface Palm {
  /** Rijen [y, halve breedte, halve dikte, midden z]. */
  readonly rijen: readonly (readonly number[])[]
  /** Knokkels op de rug van de hand: x-posities op hoogte `knokkelY`. */
  readonly knokkels: readonly number[]
  readonly knokkelY: number
  /** Kant van de handrug: -1 als de rug naar -z wijst. */
  readonly rug: number
  /** De pols loopt de onderarm in (plat): daar rond als de onderarm. */
  readonly pols?: boolean
}

/** Rug van de hand: lichte bulten van de knokkels en pezen ertussen. */
function rugRelief(def: Palm, x: number, y: number, rug: number): number {
  if (rug <= 0) return 0
  let k = 0
  for (const kx of def.knokkels) k += klok((x - kx) / 0.0095)
  const knokkel = 0.0032 * k * klok((y - def.knokkelY) / 0.016)
  return knokkel * rug ** 1.5
}

/**
 * Waar de huid van de palm aan hangt: plat loopt de pols (y onder 0) over naar
 * het polsbot, dat in het verlengde van de onderarm staat.
 */
function palmInfo(info: PuntInfo, y: number, pols: number | undefined): PuntInfo {
  if (pols === undefined) return info
  const w = glad(0.018, -0.024, y)
  return w > 0 ? { ...info, b: pols, w } : info
}

function palm(b: Bouwer, info: PuntInfo, def: Palm, pols?: number): void {
  const n = 18
  const rond = 28
  const van = def.rijen[0][0]
  const tot = def.rijen[def.rijen.length - 1][0]
  raster(b, {
    ringen: n,
    rond,
    punt: (i, j, uit) => {
      const y = van + ((tot - van) * i) / (n - 1)
      const kap = i === 0 || i === n - 1 ? 0.55 : i === 1 || i === n - 2 ? 0.9 : 1
      const h = (j / rond) * Math.PI * 2
      // In de pols (plat) rond als de onderarm, verderop de plattere hand.
      const vorm = def.pols ? 3.2 - 0.9 * glad(0.012, -0.012, y) : 3.2
      const x = tabel(def.rijen, y, 1) * macht(Math.cos(h), vorm) * kap
      const zijde = Math.sin(h)
      const relief = rugRelief(def, x, y, zijde * def.rug)
      return uit.set(x, y, tabel(def.rijen, y, 3) + tabel(def.rijen, y, 2) * macht(zijde, vorm) * kap + def.rug * relief)
    },
    info: (i) => palmInfo(info, van + ((tot - van) * i) / (n - 1), pols),
  })
}

interface Vinger {
  readonly punten: readonly Vector3[]
  readonly dik: number
  readonly top: number
  /** Waar de nagel zit: 1 op de nagel, 0 ernaast. */
  readonly nagel: (t: number, p: Vector3) => number
}

/** Iets dikker bij de knokkel en de twee vingergewrichten, smaller ertussen. */
function vingerStraal(f: Vinger, t: number): number {
  const basis = f.dik + (f.top - f.dik) * t
  const gewrichten = 0.08 * klok((t - 0.04) / 0.12) + 0.06 * klok((t - 0.48) / 0.09) + 0.045 * klok((t - 0.76) / 0.08)
  return basis * (1 + gewrichten - 0.03 * klok((t - 0.62) / 0.1))
}

function vinger(b: Bouwer, info: PuntInfo, nagelKleur: Color, f: Vinger): void {
  buis(b, {
    punten: f.punten,
    straal: (t) => vingerStraal(f, t),
    stappen: 12,
    rond: 12,
    plat: 0.9,
    info: (t, p) => {
      const n = f.nagel(t, p)
      return n > 0 ? { ...info, kleur: info.kleur.clone().lerp(nagelKleur, n) } : info
    },
  })
}

/** Vingers om een greep met straal `stang`. */
function greepVingers(k: number, stang: number): Vinger[] {
  const r = stang + 0.0098
  const boog = (x: number, eind: number) => {
    const lijst = [v(x, -0.008, -0.035)]
    for (const f of [0.26, 0.52, 0.78, 1.0, eind]) {
      const a = f * Math.PI
      lijst.push(v(x * (1 - 0.06 * f), r * Math.sin(a), -r * Math.cos(a)))
    }
    return lijst
  }
  // De nagel zit aan de buitenkant van de kromming, op het laatste kootje.
  const nagel = (t: number, p: Vector3) => glad(0.84, 0.9, t) * glad(r + 0.002, r + 0.006, Math.hypot(p.y, p.z))
  // Duim: de punt rust op de middelvinger, de nagel wijst van de greep af.
  const duimEind = v(-k * 0.018, -0.004, 0.03)
  const duimNagel = (t: number, p: Vector3) => glad(0.8, 0.88, t) * glad(0.033, 0.037, Math.hypot(p.y, p.z))
  return [
    { punten: boog(-k * 0.0275, 1.16), dik: 0.0099, top: 0.0081, nagel },
    { punten: boog(-k * 0.009, 1.22), dik: 0.0102, top: 0.0083, nagel },
    { punten: boog(k * 0.0095, 1.14), dik: 0.0097, top: 0.008, nagel },
    { punten: boog(k * 0.027, 1.02), dik: 0.0087, top: 0.0071, nagel },
    {
      punten: [v(-k * 0.026, -0.068, -0.03), v(-k * 0.04, -0.045, -0.016), v(-k * 0.039, -0.026, 0.004), v(-k * 0.031, -0.013, 0.021), duimEind],
      dik: 0.0128,
      top: 0.0092,
      nagel: duimNagel,
    },
  ]
}

function platteVingers(k: number): Vinger[] {
  // Licht gebogen: het middelste kootje iets omhoog, de top raakt de vloer.
  const vinger = (x: number, lengte: number, spreid: number) => [
    v(x, 0.084, 0.018),
    v(x + spreid * 0.35, 0.084 + lengte * 0.42, 0.013),
    v(x + spreid * 0.75, 0.084 + lengte * 0.78, 0.019),
    v(x + spreid, 0.084 + lengte, 0.0245),
  ]
  // Nagel aan de bovenkant (z naar de vloer, dus kleine z).
  const nagel = (t: number, p: Vector3) => glad(0.8, 0.88, t) * glad(0.019, 0.015, p.z)
  return [
    { punten: vinger(-k * 0.028, 0.072, -k * 0.007), dik: 0.0096, top: 0.0079, nagel },
    { punten: vinger(-k * 0.0095, 0.08, -k * 0.0015), dik: 0.0099, top: 0.0081, nagel },
    { punten: vinger(k * 0.0095, 0.075, k * 0.003), dik: 0.0094, top: 0.0078, nagel },
    { punten: vinger(k * 0.027, 0.061, k * 0.008), dik: 0.0084, top: 0.0069, nagel },
    {
      punten: [v(-k * 0.024, 0.008, 0.012), v(-k * 0.044, 0.034, 0.017), v(-k * 0.057, 0.058, 0.023), v(-k * 0.064, 0.074, 0.026)],
      dik: 0.0128,
      top: 0.009,
      nagel: (t, p) => glad(0.78, 0.88, t) * glad(0.02, 0.016, p.z),
    },
  ]
}

const GREEP_PALM: Palm = {
  rijen: [
    [-0.105, 0.025, 0.017, 0],
    [-0.085, 0.029, 0.0175, -0.004],
    [-0.06, 0.039, 0.0158, -0.022],
    [-0.03, 0.043, 0.0145, -0.031],
    [0.0, 0.0435, 0.013, -0.034],
    [0.009, 0.041, 0.0115, -0.034],
  ],
  knokkels: [-0.0275, -0.009, 0.0095, 0.027],
  knokkelY: 0.0,
  rug: -1,
}

/**
 * Plat: de muis van de hand loopt vloeiend de pols in (z naar de vloer). De
 * pols begint een stukje in de onderarm, met diens doorsnede net iets ruimer,
 * zodat het einde van de onderarm erin verdwijnt en er geen plooi ontstaat, of
 * de onderarm nu rechtop staat (push-up) of op de vloer ligt (plank).
 */
const PLATTE_PALM: Palm = {
  rijen: [
    [-0.034, 0.026, 0.0168, 0],
    [-0.014, 0.0272, 0.0178, 0],
    [0.002, 0.031, 0.0189, 0.001],
    [0.022, 0.04, 0.0148, 0.0105],
    [0.055, 0.044, 0.0122, 0.019],
    [0.08, 0.044, 0.011, 0.02],
    [0.094, 0.041, 0.0098, 0.021],
  ],
  knokkels: [-0.028, -0.0095, 0.0095, 0.027],
  knokkelY: 0.084,
  rug: -1,
  pols: true,
}

/** Bouwt beide handen; `modi` is een modus voor beide handen of een per kant (index 0 = links). */
export function bouwHanden(b: Bouwer, p: Palet, modi: HandModus | readonly [HandModus, HandModus], stang: number): void {
  const m = 0.35 * sterkteVan(p, 'onderarm')
  const nagelKleur = p.huid.clone().lerp(new Color(0.96, 0.84, 0.8), 0.45)
  ;[1, -1].forEach((k, i) => {
    const modus = typeof modi === 'string' ? modi : modi[i]
    const info: PuntInfo = { kleur: kleurMet(p.huid, p, m), spier: m, a: BOT.hand[i] }
    const vingers = modus === 'plat' ? platteVingers(k) : greepVingers(k, stang)
    const def = modus === 'plat' ? PLATTE_PALM : GREEP_PALM
    palm(b, info, { ...def, knokkels: def.knokkels.map((x) => x * k) }, modus === 'plat' ? BOT.pols[i] : undefined)
    for (const f of vingers) vinger(b, info, nagelKleur, f)
  })
}
