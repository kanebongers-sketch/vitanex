// ─── Fit Factory Club, 3D-oefenbeelden: geometrie-bouwer ────────────────────
// Verzamelt punten, kleuren, spiergloed en de botten waar een punt aan hangt,
// en maakt daar een geometrie voor een SkinnedMesh van. Vlakken worden als
// raster (ringen rond een as) of als buis langs een kromme opgebouwd. Alles
// gebeurt een keer bij het bouwen; per beeld rekent alleen het skelet.

import {
  BufferGeometry,
  CatmullRomCurve3,
  Color,
  Float32BufferAttribute,
  Uint16BufferAttribute,
  Vector3,
  type Matrix4,
} from 'three'

/** Kenmerken van een punt: kleur, gloed (0 tot 1) en botten (b met gewicht w). */
export interface PuntInfo {
  readonly kleur: Color
  readonly spier: number
  readonly a: number
  readonly b?: number
  readonly w?: number
}

export class Bouwer {
  private readonly pos: number[] = []
  private readonly kleur: number[] = []
  private readonly spier: number[] = []
  private readonly botten: number[] = []
  private readonly gewicht: number[] = []
  private readonly index: number[] = []

  get aantal(): number {
    return this.pos.length / 3
  }

  get driehoeken(): number {
    return this.index.length / 3
  }

  punt(p: Vector3, info: PuntInfo): number {
    this.pos.push(p.x, p.y, p.z)
    this.kleur.push(info.kleur.r, info.kleur.g, info.kleur.b)
    this.spier.push(info.spier)
    const w = info.w ?? 0
    this.botten.push(info.a, info.b ?? info.a, 0, 0)
    this.gewicht.push(1 - w, w, 0, 0)
    return this.aantal - 1
  }

  driehoek(a: number, b: number, c: number): void {
    this.index.push(a, b, c)
  }

  geometrie(): BufferGeometry {
    const g = new BufferGeometry()
    g.setAttribute('position', new Float32BufferAttribute(this.pos, 3))
    g.setAttribute('color', new Float32BufferAttribute(this.kleur, 3))
    g.setAttribute('spier', new Float32BufferAttribute(this.spier, 1))
    g.setAttribute('skinIndex', new Uint16BufferAttribute(this.botten, 4))
    g.setAttribute('skinWeight', new Float32BufferAttribute(this.gewicht, 4))
    g.setIndex(this.index)
    g.computeVertexNormals()
    return g
  }
}

/**
 * Een gesloten raster: `ringen` ringen van elk `rond` punten. De eerste en de
 * laatste ring krijgen een middenpunt (dop), tenzij `open` aan staat.
 */
export interface Raster {
  readonly ringen: number
  readonly rond: number
  punt(i: number, j: number, uit: Vector3): void
  info(i: number, j: number, p: Vector3): PuntInfo
  readonly openBegin?: boolean
  readonly openEind?: boolean
  /** Van de eigen ruimte van het onderdeel naar de bindruimte van het skelet. */
  readonly naarBind?: Matrix4
}

const P = new Vector3()
const A = new Vector3()
const B = new Vector3()
const C = new Vector3()

function midden(punten: readonly Vector3[], van: number, aantal: number, uit: Vector3): Vector3 {
  uit.set(0, 0, 0)
  for (let k = 0; k < aantal; k++) uit.add(punten[van + k])
  return uit.multiplyScalar(1 / aantal)
}

/** Kiest de draairichting zo dat de vlakken naar buiten wijzen. */
function moetOm(punten: readonly Vector3[], ringen: number, rond: number): boolean {
  const i = Math.floor(ringen / 2)
  const a = punten[i * rond]
  B.copy(punten[i * rond + 1]).sub(a)
  C.copy(punten[(i + 1) * rond]).sub(a)
  const n = B.cross(C)
  midden(punten, i * rond, rond, A)
  return n.dot(P.copy(a).sub(A)) < 0
}

export function raster(b: Bouwer, r: Raster): void {
  const punten: Vector3[] = []
  for (let i = 0; i < r.ringen; i++) {
    for (let j = 0; j < r.rond; j++) {
      const p = new Vector3()
      r.punt(i, j, p)
      punten.push(p)
    }
  }
  const om = moetOm(punten, r.ringen, r.rond)
  const nummer: number[] = punten.map((p, k) => {
    const i = Math.floor(k / r.rond)
    const info = r.info(i, k % r.rond, p)
    if (r.naarBind) p.applyMatrix4(r.naarBind)
    return b.punt(p, info)
  })
  const n = (i: number, j: number) => nummer[i * r.rond + (j % r.rond)]
  for (let i = 0; i < r.ringen - 1; i++) {
    for (let j = 0; j < r.rond; j++) {
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
  const dop = (ring: number, begin: boolean) => {
    const m = midden(punten, ring * r.rond, r.rond, new Vector3())
    const info = r.info(ring, 0, m)
    const pool = b.punt(m, info)
    for (let j = 0; j < r.rond; j++) {
      const [x, y] = [n(ring, j), n(ring, j + 1)]
      if (begin !== om) b.driehoek(pool, y, x)
      else b.driehoek(pool, x, y)
    }
  }
  // Het middenpunt wordt in bindruimte berekend (de punten zijn al omgezet).
  if (!r.openBegin) dop(0, true)
  if (!r.openEind) dop(r.ringen - 1, false)
}

/** Een buis langs een vloeiende kromme door `punten`, met ronde doppen. */
export interface Buis {
  readonly punten: readonly Vector3[]
  /** Straal op fractie t (0 bij het begin, 1 bij de top). */
  straal(t: number): number
  readonly stappen?: number
  readonly rond?: number
  info(t: number, p: Vector3): PuntInfo
  readonly naarBind?: Matrix4
  /** Plat drukken van de doorsnede (1 = rond). */
  readonly plat?: number
}

export function buis(b: Bouwer, def: Buis): void {
  const kromme = new CatmullRomCurve3(def.punten as Vector3[], false, 'centripetal')
  const stappen = def.stappen ?? 10
  const rond = def.rond ?? 12
  const kap = 4
  const frames = kromme.computeFrenetFrames(stappen, false)
  const lijst: { t: number; c: Vector3; n: Vector3; bn: Vector3; r: number }[] = []
  const r0 = def.straal(0)
  const r1 = def.straal(1)
  const raak0 = frames.tangents[0]
  const raak1 = frames.tangents[stappen]
  for (let k = kap; k >= 1; k--) {
    const a = (k / kap) * (Math.PI / 2)
    const c = kromme.getPointAt(0).addScaledVector(raak0, -Math.sin(a) * r0 * 0.9)
    lijst.push({ t: 0, c, n: frames.normals[0], bn: frames.binormals[0], r: Math.max(1e-4, Math.cos(a) * r0) })
  }
  for (let s = 0; s <= stappen; s++) {
    const t = s / stappen
    lijst.push({ t, c: kromme.getPointAt(t), n: frames.normals[s], bn: frames.binormals[s], r: def.straal(t) })
  }
  for (let k = 1; k <= kap; k++) {
    const a = (k / kap) * (Math.PI / 2)
    const c = kromme.getPointAt(1).addScaledVector(raak1, Math.sin(a) * r1 * 0.9)
    lijst.push({ t: 1, c, n: frames.normals[stappen], bn: frames.binormals[stappen], r: Math.max(1e-4, Math.cos(a) * r1) })
  }
  const plat = def.plat ?? 1
  raster(b, {
    ringen: lijst.length,
    rond,
    naarBind: def.naarBind,
    punt(i, j, uit) {
      const l = lijst[i]
      const h = (j / rond) * Math.PI * 2
      uit.copy(l.c).addScaledVector(l.n, Math.cos(h) * l.r).addScaledVector(l.bn, Math.sin(h) * l.r * plat)
    },
    info(i, _j, p) {
      return def.info(lijst[i].t, p)
    },
  })
}

/** Gladde stap van 0 naar 1 tussen a en b. */
export function glad(a: number, b: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

/** Klokvorm: 1 in het midden, 0 vanaf afstand 1. */
export function klok(x: number): number {
  if (x <= -1 || x >= 1) return 0
  const k = 1 - x * x
  return k * k
}

/** Kleinste hoekverschil in graden. */
export function hoekVerschil(a: number, b: number): number {
  const d = (((a - b) % 360) + 540) % 360 - 180
  return d
}

/** Waarde uit een tabel [x, waarde] met gladde overgangen. */
export function tabel(rijen: readonly (readonly number[])[], x: number, kolom: number): number {
  if (x <= rijen[0][0]) return rijen[0][kolom]
  for (let i = 1; i < rijen.length; i++) {
    const a = rijen[i - 1]
    const b = rijen[i]
    if (x <= b[0]) {
      const s = (x - a[0]) / (b[0] - a[0] || 1)
      const g = s * s * (3 - 2 * s)
      return a[kolom] + (b[kolom] - a[kolom]) * g
    }
  }
  return rijen[rijen.length - 1][kolom]
}
