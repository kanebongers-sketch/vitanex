// ─── Fit Factory Club, 3D-oefenbeelden: hoofd en haar ───────────────────────
// Een rustig, neutraal hoofd: schedel, kaaklijn en kin, wenkbrauwboog, zachte
// oogkassen, jukbeenderen, neus en lippen als lichte vormen, oren en kort haar
// (vol op de kruin, kort aan de zijkant). Geen ogen of uitdrukking.

import { Color, Vector3 } from 'three'
import { glad, raster, tabel, type Bouwer, type PuntInfo } from './bouwer'
import type { Palet } from './palet'
import { BOT, HOOFD_NAAR_BIND } from './skelet'

const MIDDEN = new Vector3(0, 0.16, 0.014)
const LIP = new Color('#8a4f47')

function macht(x: number, n: number): number {
  return Math.sign(x) * Math.abs(x) ** (2 / n)
}

function gauss(x: number, y: number, sx: number, sy: number): number {
  return Math.exp(-((x * x) / (sx * sx) + (y * y) / (sy * sy)))
}

/** Gezicht: alleen aan de voorkant. */
function voor(dz: number, vanaf = 0.55): number {
  return glad(vanaf, vanaf + 0.25, dz)
}

function vorm(dx: number, dy: number, dz: number): number {
  const ax = Math.abs(dx)
  const f = voor(dz)
  const onder = glad(0.15, 0.4, dz)
  // Neus: smalle rug die naar de punt toe voller wordt, daaronder terug.
  const neus = glad(0.1, -0.3, dy) * (1 - glad(-0.33, -0.42, dy))
  let r = 0.0145 * neus * gauss(dx, 0, 0.06 + 0.04 * glad(0, -0.3, dy), 1) * voor(dz, 0.78)
  r += 0.0065 * gauss(dx, dy - 0.16, 0.45, 0.07) * f
  r -= 0.008 * gauss(ax - 0.3, dy - 0.03, 0.12, 0.08) * f
  r += 0.005 * gauss(ax - 0.55, dy + 0.15, 0.16, 0.12) * f
  r += 0.008 * gauss(dx, dy + 0.88, 0.26, 0.12) * onder
  r += 0.004 * gauss(ax - 0.62, dy + 0.62, 0.2, 0.14)
  r -= 0.003 * gauss(ax - 0.82, dy - 0.25, 0.12, 0.15)
  r += 0.006 * gauss(dz + 0.9, dy, 0.3, 0.35)
  return r
}

/** Kleur van het gezicht: wenkbrauwen, schaduw in de oogkassen, lippen. */
function gezicht(p: Palet, dx: number, dy: number, dz: number): Color {
  const ax = Math.abs(dx)
  const f = voor(dz)
  const k = p.huid.clone()
  k.lerp(LIP, 0.16 * gauss(dx, dy + 0.65, 0.15, 0.05) * glad(0.15, 0.4, dz))
  k.lerp(p.haar, 0.55 * gauss(ax - 0.25, dy - 0.18, 0.12, 0.025) * f)
  const lijn = tabel(HAARLIJN, (Math.abs(Math.atan2(dx, dz)) * 180) / Math.PI, 1)
  k.lerp(p.haar, 0.55 * glad(lijn - 0.07, lijn + 0.01, dy))
  k.lerp(LIP, 0.25 * gauss(dx, dy + 0.645, 0.15, 0.014) * glad(0.15, 0.4, dz))
  const ao = 0.06 * gauss(ax - 0.29, dy - 0.05, 0.12, 0.07) * f + 0.12 * glad(-0.55, -0.9, dy) * glad(-0.2, 0.4, dz)
  return k.multiplyScalar(1 - ao)
}

/** Punt op de huid van het hoofd in de richting (dx, dy, dz), plus `extra`. */
function hoofdPunt(dx: number, dy: number, dz: number, extra: number, uit: Vector3): Vector3 {
  const kaak = 1 - 0.1 * glad(-0.35, -0.95, dy)
  const rx = 0.074 * kaak
  const ry = dy > 0 ? 0.106 : 0.116
  let rz = dz > 0 ? 0.09 : 0.1
  if (dz < 0) rz *= 1 - 0.3 * glad(-0.3, -0.9, dy)
  else rz *= 1 - 0.28 * glad(-0.84, -1, dy)
  // Onderste helft hoekiger (kaak en kin), het gezicht iets vlakker.
  const n = 2 + 0.75 * glad(-0.05, -0.6, dy)
  const nz = dz > 0 ? 2.25 : 2
  const r = vorm(dx, dy, dz) + extra
  return uit.set(rx * macht(dx, n) + dx * r, ry * macht(dy, n) + dy * r, rz * macht(dz, nz) + dz * r).add(MIDDEN)
}

const RINGEN = 60
const ROND = 96

/** Verdeling met meer punten rond het gezicht (u van 0 tot 1). */
function dichter(u: number, midden: number, c: number): number {
  const w = (x: number) => x - (c * Math.sin(2 * Math.PI * (x - midden))) / (2 * Math.PI)
  return (w(u) - w(0)) / (w(1) - w(0))
}

function richting(i: number, j: number, eind: number): [number, number, number] {
  const a = (0.04 + (eind - 0.04) * dichter(i / (RINGEN - 1), 0.6, 0.55)) * Math.PI
  const b = dichter(j / ROND, 0, 0.55) * Math.PI * 2
  return [Math.sin(a) * Math.sin(b), Math.cos(a), Math.sin(a) * Math.cos(b)]
}

/** Haarlijn (hoogte dy) per hoek vanaf de voorkant. */
const HAARLIJN: readonly (readonly number[])[] = [
  [0, 0.68],
  [30, 0.62],
  [55, 0.47],
  [80, 0.26],
  [95, 0.12],
  [112, 0.0],
  [125, -0.12],
  [140, -0.28],
  [180, -0.45],
]

/** Hoek vanaf de kruin (radialen) waar het haar ophoudt, per richting om het hoofd. */
function haarGrens(b: number): number {
  const hoek = (Math.abs(((b * 180) / Math.PI + 540) % 360 - 180))
  return Math.acos(tabel(HAARLIJN, hoek, 1))
}

function haarDikte(dy: number, u: number): number {
  const dik = 0.0025 + 0.0065 * glad(0.1, 0.9, dy)
  return 0.0016 + dik * glad(1, 0.8, u)
}

function oor(b: Bouwer, p: Palet, kant: number): void {
  const n = 14
  const rond = 18
  raster(b, {
    ringen: n,
    rond,
    naarBind: HOOFD_NAAR_BIND,
    punt: (i, j, uit) => {
      const a = (0.06 + (0.88 * i) / (n - 1)) * Math.PI
      const h = (j / rond) * Math.PI * 2
      const x = Math.sin(a) * Math.cos(h) * 0.008
      const y = Math.cos(a) * 0.026
      const z = Math.sin(a) * Math.sin(h) * 0.016
      // Licht naar achteren gekanteld, de achterkant iets van het hoofd af.
      return uit.set(kant * (0.07 + x + Math.max(0, -z) * 0.22), 0.15 + y - z * 0.15, -0.006 + z + y * 0.12)
    },
    info: (): PuntInfo => ({ kleur: p.huid.clone().multiplyScalar(0.94), spier: 0, a: BOT.hoofd }),
  })
}

export function bouwHoofd(b: Bouwer, p: Palet): void {
  raster(b, {
    ringen: RINGEN,
    rond: ROND,
    naarBind: HOOFD_NAAR_BIND,
    punt: (i, j, uit) => hoofdPunt(...richting(i, j, 0.96), 0, uit),
    info: (i, j): PuntInfo => {
      const [dx, dy, dz] = richting(i, j, 0.96)
      return { kleur: gezicht(p, dx, dy, dz), spier: 0, a: BOT.hoofd }
    },
  })
  oor(b, p, 1)
  oor(b, p, -1)
}

export function bouwHaar(b: Bouwer, p: Palet): void {
  const n = 26
  const richtingHaar = (i: number, j: number): [number, number, number, number] => {
    const u = i / (n - 1)
    const be = (j / ROND) * Math.PI * 2
    const a = 0.03 * Math.PI + (haarGrens(be) - 0.03 * Math.PI) * Math.min(1, u)
    return [Math.sin(a) * Math.sin(be), Math.cos(a), Math.sin(a) * Math.cos(be), u]
  }
  raster(b, {
    ringen: n,
    rond: ROND,
    openEind: true,
    naarBind: HOOFD_NAAR_BIND,
    punt: (i, j, uit) => {
      const [dx, dy, dz, u] = richtingHaar(i, j)
      return hoofdPunt(dx, dy, dz, haarDikte(dy, u), uit)
    },
    info: (i, j): PuntInfo => {
      const [, dy, , u] = richtingHaar(i, j)
      const licht = 0.82 + 0.18 * glad(-0.3, 0.8, dy) - 0.1 * glad(0.75, 1, u)
      return { kleur: p.haar.clone().multiplyScalar(licht), spier: 0, a: BOT.hoofd }
    },
  })
}
