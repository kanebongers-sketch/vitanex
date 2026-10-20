// ─── Fit Factory Club, 3D-oefenbeelden: handen en schoenen ──────────────────
// Handen om de stang: handpalm achter de stang, vier vingers die over de stang
// heen krullen en een duim die er onderdoor komt. Plat op de vloer (push-up):
// gestrekte, licht gespreide vingers. Schoenen: sneaker met lichte zool,
// bovenwerk en een hielstuk in de accentkleur.
//
// Hand: oorsprong in het midden van de greep (plat: bij de pols), y van de pols
// naar de vingers, x langs de stang. Voet: oorsprong in de enkel, y omhoog, z
// naar de tenen, vloer op 0,08 m onder de enkel.

import { Vector3 } from 'three'
import type { HandModus } from '@/lib/club/training/3d/typen'
import { buis, glad, raster, tabel, type Bouwer, type PuntInfo } from './bouwer'
import { kleurMet, werkt, type Palet } from './palet'
import { BOT } from './skelet'

function macht(x: number, n: number): number {
  return Math.sign(x) * Math.abs(x) ** (2 / n)
}

const v = (x: number, y: number, z: number) => new Vector3(x, y, z)

interface Palm {
  /** Rijen [y, halve breedte, halve dikte, midden z]. */
  readonly rijen: readonly (readonly number[])[]
}

function palm(b: Bouwer, info: PuntInfo, def: Palm): void {
  const n = 16
  const rond = 24
  const van = def.rijen[0][0]
  const tot = def.rijen[def.rijen.length - 1][0]
  raster(b, {
    ringen: n,
    rond,
    punt: (i, j, uit) => {
      const y = van + ((tot - van) * i) / (n - 1)
      const kap = i === 0 || i === n - 1 ? 0.55 : i === 1 || i === n - 2 ? 0.9 : 1
      const h = (j / rond) * Math.PI * 2
      return uit.set(
        tabel(def.rijen, y, 1) * macht(Math.cos(h), 3.2) * kap,
        y,
        tabel(def.rijen, y, 3) + tabel(def.rijen, y, 2) * macht(Math.sin(h), 3.2) * kap,
      )
    },
    info: () => info,
  })
}

interface Vinger {
  readonly punten: readonly Vector3[]
  readonly dik: number
  readonly top: number
}

function vinger(b: Bouwer, info: PuntInfo, f: Vinger): void {
  buis(b, {
    punten: f.punten,
    straal: (t) => f.dik + (f.top - f.dik) * t,
    stappen: 8,
    rond: 10,
    plat: 0.86,
    info: () => info,
  })
}

/** Vingers om een stang met straal `stang`. */
function greepVingers(k: number, stang: number): Vinger[] {
  const r = stang + 0.0095
  const boog = (x: number, eind: number) => {
    const lijst = [v(x, -0.006, -0.033)]
    for (const f of [0.28, 0.55, 0.8, 1.0, eind]) {
      const a = f * Math.PI
      lijst.push(v(x * (1 - 0.06 * f), r * Math.sin(a), -r * Math.cos(a)))
    }
    return lijst
  }
  return [
    { punten: boog(-k * 0.027, 1.16), dik: 0.0094, top: 0.0078 },
    { punten: boog(-k * 0.009, 1.22), dik: 0.0097, top: 0.008 },
    { punten: boog(k * 0.009, 1.14), dik: 0.0092, top: 0.0077 },
    { punten: boog(k * 0.026, 1.02), dik: 0.0082, top: 0.0068 },
    {
      punten: [v(-k * 0.028, -0.065, -0.03), v(-k * 0.042, -0.042, -0.018), v(-k * 0.041, -0.024, 0.002), v(-k * 0.032, -0.013, 0.02), v(-k * 0.021, -0.005, 0.028)],
      dik: 0.0125,
      top: 0.0088,
    },
  ]
}

function platteVingers(k: number): Vinger[] {
  const recht = (x: number, lengte: number, spreid: number) => [
    v(x, 0.088, 0.02),
    v(x + spreid * 0.4, 0.088 + lengte * 0.45, 0.016),
    v(x + spreid, 0.088 + lengte, 0.024),
  ]
  return [
    { punten: recht(-k * 0.029, 0.074, -k * 0.012), dik: 0.0092, top: 0.0076 },
    { punten: recht(-k * 0.01, 0.082, -k * 0.003), dik: 0.0095, top: 0.0078 },
    { punten: recht(k * 0.01, 0.077, k * 0.005), dik: 0.009, top: 0.0075 },
    { punten: recht(k * 0.028, 0.062, k * 0.013), dik: 0.008, top: 0.0066 },
    { punten: [v(-k * 0.026, 0.012, 0.016), v(-k * 0.05, 0.04, 0.02), v(-k * 0.066, 0.068, 0.025)], dik: 0.0125, top: 0.0088 },
  ]
}

const GREEP_PALM: Palm = {
  rijen: [
    [-0.105, 0.026, 0.018, 0],
    [-0.085, 0.03, 0.018, -0.004],
    [-0.06, 0.04, 0.0155, -0.022],
    [-0.03, 0.043, 0.014, -0.031],
    [0.0, 0.043, 0.0125, -0.033],
    [0.008, 0.04, 0.011, -0.033],
  ],
}

const PLATTE_PALM: Palm = {
  rijen: [
    [-0.03, 0.027, 0.018, 0],
    [-0.005, 0.034, 0.016, 0.008],
    [0.03, 0.043, 0.0135, 0.018],
    [0.075, 0.045, 0.0115, 0.02],
    [0.096, 0.042, 0.0105, 0.02],
  ],
}

export function bouwHanden(b: Bouwer, p: Palet, modus: HandModus, stang: number): void {
  const m = werkt(p, 'onderarm') ? 0.35 : 0
  ;[1, -1].forEach((k, i) => {
    const info: PuntInfo = { kleur: kleurMet(p.huid, p, m), spier: m, a: BOT.hand[i] }
    const vingers = modus === 'plat' ? platteVingers(k) : greepVingers(k, stang)
    palm(b, info, modus === 'plat' ? PLATTE_PALM : GREEP_PALM)
    for (const f of vingers) vinger(b, info, f)
  })
}

/** Rijen [z, halve breedte, bovenkant, onderkant]. */
const BOVENWERK: readonly (readonly number[])[] = [
  [-0.079, 0.018, -0.032, -0.07],
  [-0.07, 0.034, -0.004, -0.072],
  [-0.05, 0.04, 0.005, -0.072],
  [-0.02, 0.042, 0.007, -0.072],
  [0.01, 0.043, -0.004, -0.072],
  [0.05, 0.046, -0.018, -0.072],
  [0.1, 0.05, -0.03, -0.072],
  [0.145, 0.051, -0.04, -0.072],
  [0.18, 0.047, -0.047, -0.072],
  [0.205, 0.038, -0.053, -0.071],
  [0.223, 0.02, -0.058, -0.07],
]

interface Laag {
  readonly rijen: readonly (readonly number[])[]
  readonly breder: number
  readonly macht: number
  readonly boven?: number
  readonly onder?: number
}

function schoenLaag(b: Bouwer, laag: Laag, info: (z: number, y: number) => PuntInfo): void {
  const n = 26
  const rond = 30
  const van = laag.rijen[0][0] - laag.breder
  const tot = laag.rijen[laag.rijen.length - 1][0] + laag.breder
  const zOp = (i: number) => van + ((tot - van) * i) / (n - 1)
  const punt = (i: number, j: number, uit: Vector3) => {
    const z = zOp(i)
    const h = (j / rond) * Math.PI * 2
    const boven = laag.boven ?? tabel(laag.rijen, z, 2)
    let onder = laag.onder ?? tabel(laag.rijen, z, 3)
    // Neus en hak lopen iets op.
    onder += 0.012 * glad(0.15, 0.24, z) + 0.006 * glad(-0.06, -0.09, z)
    const yc = (boven + onder) / 2
    const hh = (boven - onder) / 2
    const kap = i === 0 || i === n - 1 ? 0.5 : 1
    return uit.set((tabel(laag.rijen, z, 1) + laag.breder) * macht(Math.cos(h), laag.macht) * kap, yc + hh * macht(Math.sin(h), laag.macht), z)
  }
  raster(b, {
    ringen: n,
    rond,
    punt,
    info: (i, j) => {
      const p = punt(i, j, new Vector3())
      return info(p.z, p.y)
    },
  })
}

export function bouwSchoenen(b: Bouwer, p: Palet): void {
  ;[0, 1].forEach((i) => {
    const a = BOT.voet[i]
    schoenLaag(b, { rijen: BOVENWERK, breder: 0, macht: 2.6 }, (z, y) => {
      const hiel = glad(-0.055, -0.072, z) * glad(-0.035, -0.015, y)
      const neus = 0.1 * glad(0.17, 0.22, z)
      return { kleur: kleurMet(p.schoen, p, hiel, true, neus), spier: hiel * 0.5, a }
    })
    schoenLaag(b, { rijen: BOVENWERK, breder: 0.006, macht: 5, boven: -0.061, onder: -0.08 }, (_z, y) => ({
      kleur: p.zool.clone().multiplyScalar(0.86 + 0.14 * glad(-0.078, -0.064, y)),
      spier: 0,
      a,
    }))
  })
}
