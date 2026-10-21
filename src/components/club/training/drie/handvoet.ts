// ─── Fit Factory Club, 3D-oefenbeelden: handen en schoenen ──────────────────
// De handen staan in hand.ts (hier doorgegeven). Schoenen: sneaker met lichte
// zool, bovenwerk en een hielstuk in de accentkleur.
//
// Voet: oorsprong in de enkel, y omhoog, z naar de tenen, vloer op 0,08 m
// onder de enkel.

import { Vector3 } from 'three'
import { glad, raster, tabel, type Bouwer, type PuntInfo } from './bouwer'
import { kleurMet, type Palet } from './palet'
import { BOT } from './skelet'

export { bouwHanden } from './hand'

function macht(x: number, n: number): number {
  return Math.sign(x) * Math.abs(x) ** (2 / n)
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
  /** Hoogte van de tong boven de wreef (m). */
  readonly tong?: number
  /** Ringen langs de voet en punten rond. */
  readonly n?: number
  readonly rond?: number
}

function schoenLaag(b: Bouwer, laag: Laag, info: (p: Vector3) => PuntInfo): void {
  const n = laag.n ?? 26
  const rond = laag.rond ?? 30
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
    const x = (tabel(laag.rijen, z, 1) + laag.breder) * macht(Math.cos(h), laag.macht) * kap
    const zijde = Math.sin(h)
    // Tong en veters liggen iets hoger dan de rest van de wreef.
    const tong = laag.tong ? laag.tong * Math.max(0, zijde) * glad(0.026, 0.008, Math.abs(x)) * glad(-0.005, 0.02, z) * glad(0.125, 0.1, z) : 0
    return uit.set(x, yc + hh * macht(zijde, laag.macht) + tong, z)
  }
  raster(b, {
    ringen: n,
    rond,
    punt,
    info: (i, j) => {
      return info(punt(i, j, new Vector3()))
    },
  })
}

/** Per plek op het bovenwerk: schaduw (negatief = lichter) en hoeveel veter er ligt. */
function bovenwerkTint(q: Vector3): { ao: number; veter: number } {
  const boven = tabel(BOVENWERK, q.z, 2)
  // Kraag rond de enkel: gevoerde, iets lichtere rand.
  const kraag = glad(-0.012, -0.004, q.y - boven) * glad(0.03, 0.0, q.z)
  // Vetervlak op de wreef met lichte veters dwars eroverheen.
  const wreef = glad(0.02, 0.012, Math.abs(q.x)) * glad(0.012, 0.03, q.z) * glad(0.125, 0.105, q.z) * glad(-0.008, 0.0, q.y - boven)
  const veter = Math.sin((q.z / 0.0135) * Math.PI * 2) > 0.35 ? 1 : 0
  // Onderste paneel (rondom, boven de zool) iets donkerder, neus ook.
  const paneel = glad(-0.058, -0.064, q.y)
  const neus = 0.1 * glad(0.17, 0.22, q.z)
  return { ao: 0.14 * paneel + neus - 0.22 * kraag - 0.12 * wreef, veter: wreef * veter }
}

export function bouwSchoenen(b: Bouwer, p: Palet): void {
  ;[0, 1].forEach((i) => {
    const a = BOT.voet[i]
    schoenLaag(b, { rijen: BOVENWERK, breder: 0, macht: 2.6, n: 42, rond: 36, tong: 0.005 }, (q) => {
      const hiel = glad(-0.055, -0.072, q.z) * glad(-0.035, -0.015, q.y)
      const { ao, veter } = bovenwerkTint(q)
      const kleur = kleurMet(p.schoen, p, hiel, true, ao).lerp(p.zool, 0.42 * veter)
      return { kleur, spier: hiel * 0.5, a }
    })
    // Zool: lichte tussenzool met een dunne, donkere loopzool eronder.
    schoenLaag(b, { rijen: BOVENWERK, breder: 0.006, macht: 5, boven: -0.061, onder: -0.0775 }, (q) => ({
      kleur: p.zool.clone().multiplyScalar(0.86 + 0.14 * glad(-0.076, -0.064, q.y)),
      spier: 0,
      a,
    }))
    schoenLaag(b, { rijen: BOVENWERK, breder: 0.0068, macht: 5, boven: -0.0755, onder: -0.0805, n: 20, rond: 24 }, () => ({
      kleur: p.schoen.clone().multiplyScalar(0.7),
      spier: 0,
      a,
    }))
  })
}
