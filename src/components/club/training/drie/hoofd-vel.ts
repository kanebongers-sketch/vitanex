// ─── Fit Factory Club, 3D-oefenbeelden: open vel voor gezichtsdetails ───────
// Een raster van rijen en kolommen zonder doppen, voor dunne delen als
// oogleden en wenkbrauwen. De draairichting volgt uit een punt dat aan de
// binnenkant ligt, zodat de voorkant van de vlakken altijd naar buiten wijst.

import { Vector3, type Matrix4 } from 'three'
import type { Bouwer, PuntInfo } from './bouwer'

export interface Vel {
  readonly rijen: number
  readonly kolommen: number
  punt(i: number, j: number, uit: Vector3): void
  info(i: number, j: number, p: Vector3): PuntInfo
  /** Een punt aan de binnenkant; de vlakken wijzen ervan af. */
  readonly binnen: Vector3
  /** Rij en kolom van een vlak dat zeker aan de buitenkant ligt. */
  readonly ijk: readonly [number, number]
  /** Kolommen sluiten rond (laatste kolom aan de eerste). */
  readonly rond?: boolean
  readonly naarBind?: Matrix4
}

const A = new Vector3()
const B = new Vector3()

export function vel(b: Bouwer, v: Vel): void {
  const punten: Vector3[] = []
  for (let i = 0; i < v.rijen; i++) {
    for (let j = 0; j < v.kolommen; j++) {
      const p = new Vector3()
      v.punt(i, j, p)
      punten.push(p)
    }
  }
  const pt = (i: number, j: number) => punten[i * v.kolommen + (j % v.kolommen)]
  const [ci, cj] = v.ijk
  const p0 = pt(ci, cj)
  A.copy(pt(ci, cj + 1)).sub(p0)
  B.copy(pt(ci + 1, cj)).sub(p0)
  const om = A.cross(B).dot(B.copy(p0).sub(v.binnen)) < 0
  const nummer = punten.map((p, k) => {
    const info = v.info(Math.floor(k / v.kolommen), k % v.kolommen, p)
    if (v.naarBind) p.applyMatrix4(v.naarBind)
    return b.punt(p, info)
  })
  const n = (i: number, j: number) => nummer[i * v.kolommen + (j % v.kolommen)]
  const eind = v.rond ? v.kolommen : v.kolommen - 1
  for (let i = 0; i < v.rijen - 1; i++) {
    for (let j = 0; j < eind; j++) {
      const [a, bb, c, d] = [n(i, j), n(i, j + 1), n(i + 1, j), n(i + 1, j + 1)]
      if (om) {
        b.driehoek(a, c, bb)
        b.driehoek(bb, c, d)
      } else {
        b.driehoek(a, bb, c)
        b.driehoek(bb, d, c)
      }
    }
  }
}
