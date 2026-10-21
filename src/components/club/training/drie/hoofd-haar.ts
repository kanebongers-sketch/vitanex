// ─── Fit Factory Club, 3D-oefenbeelden: haar en wenkbrauwen ─────────────────
// Kort sportief kapsel: bovenop volume met plukjes (golvende dikte en kleur),
// aan de zijkant en achter kort opgeschoren, met een natuurlijke haarlijn,
// lichte inhammen en bakkebaarden. Wenkbrauwen als dunne strook met volume.
// Alles ligt op de vorm van de huid (zie hoofd-vorm).

import { Color, Vector3 } from 'three'
import { glad, raster, tabel, type Bouwer, type PuntInfo } from './bouwer'
import { vel } from './hoofd-vel'
import { MIDDEN, projecteer } from './hoofd-vorm'
import type { Palet } from './palet'
import { BOT, HOOFD_NAAR_BIND } from './skelet'

const GRAAD = Math.PI / 180

/** Haarlijn: [hoek rond het hoofd vanaf voren, hoek vanaf de kruin] in graden. */
const HAARLIJN: readonly (readonly number[])[] = [
  [0, 46],
  [12, 46.5],
  [24, 49.5],
  [33, 52.5],
  [45, 55.5],
  [55, 59.5],
  [63, 64.5],
  [70, 72],
  [75, 86],
  [79, 97],
  [86, 99],
  [91, 96],
  [95, 84],
  [99, 77],
  [112, 76],
  [119, 82],
  [126, 98],
  [140, 110],
  [160, 115],
  [180, 116],
]

/** Hoek vanaf de kruin (graden) waar het haar ophoudt, voor hoek `b` (graden). */
export function haarGrens(b: number): number {
  const h = Math.abs(((((b + 180) % 360) + 360) % 360) - 180)
  return tabel(HAARLIJN, h, 1) + 1.1 * Math.sin(b * GRAAD * 11) * glad(40, 5, h)
}

/** Ruis tussen -1 en 1 voor plukjes. */
function ruis(x: number, y: number): number {
  const hash = (i: number, j: number) => {
    const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453
    return (s - Math.floor(s)) * 2 - 1
  }
  const [ix, iy] = [Math.floor(x), Math.floor(y)]
  const [fx, fy] = [x - ix, y - iy]
  const [sx, sy] = [fx * fx * (3 - 2 * fx), fy * fy * (3 - 2 * fy)]
  const a = hash(ix, iy) + (hash(ix + 1, iy) - hash(ix, iy)) * sx
  const b = hash(ix, iy + 1) + (hash(ix + 1, iy + 1) - hash(ix, iy + 1)) * sx
  return a + (b - a) * sy
}

/** Plukjes op richting (x, y, z) vanuit het midden: langgerekt van voor naar achter. */
function plukjes(h: HaarPunt): number {
  const [x, y, z] = h.r
  return 0.55 * ruis(x * 24 + y * 6 + 3, z * 10 + y * 5) + 0.45 * ruis(x * 52 + y * 17, z * 22 + 7)
}

const RIJEN = 20
const ROND = 64
const P = new Vector3()

interface HaarPunt {
  readonly a: number
  readonly b: number
  readonly u: number
  /** Richting vanuit het midden. */
  readonly r: readonly [number, number, number]
}

function haarPunt(i: number, j: number): HaarPunt {
  const u = i / (RIJEN - 1)
  const b = (j / ROND) * 360
  // Fijnere rijen naar de haarlijn toe, voor een zachte overgang.
  const a = 2 + (haarGrens(b) - 2) * (1 - (1 - u) ** 1.5)
  const [sa, ca] = [Math.sin(a * GRAAD), Math.cos(a * GRAAD)]
  return { a, b, u, r: [sa * Math.sin(b * GRAAD), ca, sa * Math.cos(b * GRAAD)] }
}

function richting(a: number, b: number, zij: number, uit: Vector3): Vector3 {
  return uit.set(zij * Math.sin(a * GRAAD) * Math.sin(b * GRAAD), Math.cos(a * GRAAD), Math.sin(a * GRAAD) * Math.cos(b * GRAAD))
}

/** Volume bovenop (0 aan de opgeschoren zijkant, 1 bovenop). */
function volume(y: number, z: number): number {
  return glad(0.198, 0.238, y + 0.02 * glad(0.02, 0.09, z))
}

function dikte(h: HaarPunt, y: number, z: number): number {
  const v = volume(y, z)
  const voor = glad(0.02, 0.085, z) * v
  const d = 0.0017 + 0.0058 * v + 0.0022 * voor + 0.0026 * plukjes(h) * v + 0.0004 * ruis(h.r[0] * 90 + h.r[1] * 40, h.r[2] * 70)
  // Naar de haarlijn toe loopt het haar dun uit tot vlak op de huid.
  return d * glad(1, 0.5, h.u) ** 1.6 + 0.0005
}

/** Kleur van de huid op een punt van het hoofd (zonder schaduw), voor de rand van het haar. */
export type HuidOp = (q: Vector3) => Color

const KORT = new Color('#3a3330')

function haarKleur(p: Palet, h: HaarPunt, q: Vector3, huid: HuidOp): Color {
  const v = volume(q.y, q.z)
  const k = p.haar.clone().multiplyScalar(0.72 + 0.4 * (0.5 + 0.5 * plukjes(h)) * v)
  // Opgeschoren zijkant: kort, donker haar waar de huid koel doorheen schemert.
  const kort = KORT.clone().lerp(huid(q), 0.22)
  k.lerp(kort, 0.55 * (1 - v))
  // Langs de haarlijn wordt het haar dunner tot precies de kleur van de huid daar.
  const g = glad(0.7, 1, h.u)
  const ijl = g ** 1.2 + 0.35 * g * (1 - g) * ruis(h.r[0] * 160 + 5, h.r[1] * 120 + h.r[2] * 90)
  return k.lerp(huid(q), Math.min(1, Math.max(0, ijl)))
}

let LAAG: Float32Array | null = null

/** Punten van de haarlaag, een keer berekend en daarna hergebruikt. */
function haarlaag(): Float32Array {
  if (LAAG) return LAAG
  const punten = new Float32Array(RIJEN * ROND * 3)
  const q = new Vector3()
  for (let i = 0; i < RIJEN; i++) {
    for (let j = 0; j < ROND; j++) {
      const h = haarPunt(i, j)
      richting(h.a, h.b, 1, P)
      projecteer(P.x, P.y, P.z, 0, q)
      projecteer(P.x, P.y, P.z, dikte(h, q.y, q.z), q)
      punten.set([q.x, q.y, q.z], (i * ROND + j) * 3)
    }
  }
  LAAG = punten
  return punten
}

export function bouwHaarlaag(b: Bouwer, p: Palet, huid: HuidOp): void {
  const punten = haarlaag()
  raster(b, {
    ringen: RIJEN,
    rond: ROND,
    openEind: true,
    naarBind: HOOFD_NAAR_BIND,
    punt: (i, j, uit) => {
      const k = (i * ROND + j) * 3
      uit.set(punten[k], punten[k + 1], punten[k + 2])
    },
    info: (i, j, q): PuntInfo => ({ kleur: haarKleur(p, haarPunt(i, j), q, huid), spier: 0, a: BOT.hoofd }),
  })
}

/** Wenkbrauw: [plek langs de wenkbrauw, hoek rond, hoek vanaf de kruin, halve breedte]. */
const WENKBRAUW: readonly (readonly number[])[] = [
  [0, 8.5, 81.4, 2.3],
  [0.3, 18, 79.8, 1.9],
  [0.65, 29, 79.4, 1.45],
  [1, 39, 82.2, 0.8],
]

/** Doorsnede: [plek over de breedte -1 tot 1, hoogte (fractie)]. */
const BRAUW_DOORSNEDE: readonly (readonly number[])[] = [
  [-1, 0], [-0.6, 0.65], [0, 1], [0.6, 0.7], [1, 0],
]

function wenkbrauw(b: Bouwer, p: Palet, zij: number): void {
  const n = 12
  vel(b, {
    rijen: n,
    kolommen: BRAUW_DOORSNEDE.length,
    binnen: new Vector3(MIDDEN.x, MIDDEN.y, MIDDEN.z),
    ijk: [n >> 1, 1],
    naarBind: HOOFD_NAAR_BIND,
    punt: (i, j, uit) => {
      const s = i / (n - 1)
      const [over, hoog] = BRAUW_DOORSNEDE[j]
      const ab = tabel(WENKBRAUW, s, 1)
      const aa = tabel(WENKBRAUW, s, 2) + over * tabel(WENKBRAUW, s, 3)
      const dik = 0.0008 * glad(0, 0.12, s) * glad(1, 0.75, s) + 0.0002
      richting(aa, ab, zij, P)
      return projecteer(P.x, P.y, P.z, hoog * dik, uit)
    },
    info: (i, j): PuntInfo => {
      const s = i / (n - 1)
      const rand = 1 - BRAUW_DOORSNEDE[j][1]
      const k = p.haar.clone().lerp(p.huid, 0.35 * glad(0.25, 0, s) + 0.3 * glad(0.75, 1, s) + 0.45 * rand)
      return { kleur: k, spier: 0, a: BOT.hoofd }
    },
  })
}

export function bouwWenkbrauwen(b: Bouwer, p: Palet): void {
  wenkbrauw(b, p, 1)
  wenkbrauw(b, p, -1)
}

/** Hoek vanaf de kruin en rond het hoofd (graden) van een punt in hoofdruimte. */
export function hoekenVan(q: Vector3): { readonly a: number; readonly b: number } {
  const [x, y, z] = [q.x - MIDDEN.x, q.y - MIDDEN.y, q.z - MIDDEN.z]
  const r = Math.hypot(x, y, z) || 1
  return { a: Math.acos(y / r) / GRAAD, b: Math.atan2(x, z) / GRAAD }
}
