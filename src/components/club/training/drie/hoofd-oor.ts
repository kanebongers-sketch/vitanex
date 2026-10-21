// ─── Fit Factory Club, 3D-oefenbeelden: oren ────────────────────────────────
// Een oorschelp als kussen: aan de voorkant de kom (concha) met het
// tragusje, de antihelix als rug, de groef erachter en de opgerolde rand
// (helix); onderaan een vlezige oorlel. De achterkant zakt in het hoofd. Het
// oor staat iets schuin naar achteren en de achterrand staat licht af.

import { Color, Vector3 } from 'three'
import { glad, type Bouwer, type PuntInfo } from './bouwer'
import { vel } from './hoofd-vel'
import type { Palet } from './palet'
import { BOT, HOOFD_NAAR_BIND } from './skelet'

/** Pad over het oor: [straal (0 midden, 1 rand), hoogte, hoogte bij de lel]. */
const PAD: readonly (readonly number[])[] = [
  [0.0, 0.0002, 0.0064],
  [0.22, 0.0008, 0.0067],
  [0.42, 0.0052, 0.007],
  [0.56, 0.0108, 0.0073],
  [0.68, 0.0098, 0.0075],
  [0.78, 0.0064, 0.0076],
  [0.86, 0.0102, 0.0077],
  [0.94, 0.0146, 0.0077],
  [1.0, 0.0128, 0.0068],
  [0.99, 0.0088, 0.0052],
  [0.9, 0.0056, 0.0034],
  [0.6, 0.0016, 0.0006],
  [0.22, -0.004, -0.004],
]

const ROND = 22
const WARM = new Color('#c27565')

interface OorAssen {
  readonly o: Vector3
  readonly u: Vector3
  readonly v: Vector3
  readonly n: Vector3
}

function assen(zij: number): OorAssen {
  const b = (16 * Math.PI) / 180
  const g = (13 * Math.PI) / 180
  const n = new Vector3(zij * Math.cos(b), 0, Math.sin(b))
  const vooruit = new Vector3(-zij * Math.sin(b), 0, Math.cos(b))
  const op = new Vector3(0, 1, 0)
  const u = vooruit.clone().multiplyScalar(Math.cos(g)).addScaledVector(op, Math.sin(g))
  const v = op.clone().multiplyScalar(Math.cos(g)).addScaledVector(vooruit, -Math.sin(g))
  return { o: new Vector3(zij * 0.0685, 0.1405, -0.0125), u, v, n }
}

function lel(f: number): number {
  return glad(-0.3, -0.8, Math.sin(f))
}

const bult = (x: number, m: number, s: number) => Math.exp(-(((x - m) / s) ** 2))

/** Hoek in graden van 0 tot 360 (0 = naar het gezicht, 90 = omhoog). */
const graden = (f: number) => ((((f * 180) / Math.PI) % 360) + 360) % 360

/** Hoogte van de voorkant: kom, antihelix met groef erachter, opgerolde rand. */
function voorHoogte(r: number, f: number): number {
  const g = graden(f)
  const anti = glad(15, 55, g) * glad(250, 205, g)
  const rand = 1 - 0.75 * bult(g, 320, 38) - 0.75 * bult(g, -40, 38)
  let w = 0.0078 - 0.0072 * glad(0.58, 0.05, r)
  w += 0.0034 * anti * bult(r, 0.62, 0.09) - 0.0026 * anti * bult(r, 0.8, 0.06)
  w += 0.0058 * rand * bult(r, 0.94, 0.06)
  w += 0.0042 * bult(g, 345, 22) * bult(r, 0.5, 0.12)
  return w
}

function hoogte(i: number, f: number): number {
  const [r, w, wl] = PAD[i]
  const l = lel(f)
  const voor = i <= 8 ? glad(0.35, 0.95, Math.cos(f)) * (1 - l) : 0
  const h = i <= 8 ? voorHoogte(r, f) : w
  return (h + (wl - h) * l) * (1 - 0.45 * voor)
}

function oor(b: Bouwer, p: Palet, zij: number): void {
  const as = assen(zij)
  vel(b, {
    rijen: PAD.length,
    kolommen: ROND,
    rond: true,
    binnen: as.o.clone().addScaledVector(as.n, -0.01),
    ijk: [1, 0],
    naarBind: HOOFD_NAAR_BIND,
    punt: (i, j, uit) => {
      const f = (j / ROND) * Math.PI * 2
      const r = PAD[i][0]
      const c = Math.cos(f)
      const s = Math.sin(f)
      const breed = (c > 0 ? 0.0128 : 0.0165) * (1 - 0.25 * lel(f) * glad(0, 0.6, c))
      const hoog = s > 0 ? 0.031 : 0.0285
      const du = c * breed * r + 0.0035 * (1 - r)
      const dv = s * hoog * r - 0.004 * (1 - r)
      return uit.copy(as.o).addScaledVector(as.u, du).addScaledVector(as.v, dv).addScaledVector(as.n, hoogte(i, f))
    },
    info: (i, j): PuntInfo => {
      const f = (j / ROND) * Math.PI * 2
      const w = hoogte(i, f)
      const k = p.huid.clone().lerp(WARM, 0.2)
      const voorkant = i <= 7 ? 1 : 0
      const kuil = voorkant * 0.5 * glad(0.0085, 0.001, w) * (1 - lel(f))
      const achter = i >= 9 ? 0.18 : 0
      return { kleur: k.multiplyScalar(1 - kuil - achter), spier: 0, a: BOT.hoofd }
    },
  })
}

export function bouwOren(b: Bouwer, p: Palet): void {
  oor(b, p, 1)
  oor(b, p, -1)
}
