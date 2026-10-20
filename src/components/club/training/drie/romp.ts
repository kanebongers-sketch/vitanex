// ─── Fit Factory Club, 3D-oefenbeelden: de romp als een doorlopende huid ─────
// Geen losse bollen maar een buis van ringen langs de wervelkolom, van kruis
// tot nekbasis. Elke ring hangt aan het bekken, de onderrug of de borst; bij de
// overgangen mengen we de twee frames, zodat de romp vloeiend buigt (zoals
// skinning in een animatieprogramma, maar dan met de hand).

import { BufferAttribute, BufferGeometry, Color, Matrix4, Vector3 } from 'three'
import type { Figuur, Frame } from '@/lib/club/training/3d/kinematica'
import { MATEN } from '@/lib/club/training/3d/maten'

interface Ring {
  /** Hoogte langs de wervelkolom vanaf de heupgewrichten (m). */
  readonly s: number
  /** Halve breedte, diepte naar voren en naar achteren, verschuiving voor/achter. */
  readonly breed: number
  readonly voor: number
  readonly achter: number
  readonly z: number
}

const RINGEN: readonly Ring[] = [
  { s: -0.1, breed: 0.07, voor: 0.04, achter: 0.05, z: -0.01 },
  { s: -0.085, breed: 0.13, voor: 0.07, achter: 0.095, z: -0.012 },
  { s: -0.05, breed: 0.163, voor: 0.088, achter: 0.122, z: -0.012 },
  { s: 0.0, breed: 0.172, voor: 0.095, achter: 0.12, z: -0.012 },
  { s: 0.06, breed: 0.162, voor: 0.095, achter: 0.098, z: -0.012 },
  { s: 0.12, breed: 0.148, voor: 0.098, achter: 0.085, z: -0.012 },
  { s: 0.18, breed: 0.148, voor: 0.102, achter: 0.085, z: -0.012 },
  { s: 0.25, breed: 0.158, voor: 0.108, achter: 0.09, z: -0.014 },
  { s: 0.32, breed: 0.17, voor: 0.118, achter: 0.098, z: -0.016 },
  { s: 0.39, breed: 0.182, voor: 0.124, achter: 0.104, z: -0.018 },
  { s: 0.45, breed: 0.19, voor: 0.112, achter: 0.104, z: -0.022 },
  { s: 0.49, breed: 0.178, voor: 0.085, achter: 0.092, z: -0.026 },
  { s: 0.515, breed: 0.13, voor: 0.06, achter: 0.075, z: -0.028 },
  { s: 0.535, breed: 0.062, voor: 0.045, achter: 0.05, z: -0.02 },
]

const ROND = 40
const MACHT = 2.6

/** Waar de broek ophoudt (s). */
const BROEK_TOT = 0.075

const LENDE_BEGIN = MATEN.bekkenNaarLende.y
const BORST_BEGIN = LENDE_BEGIN + MATEN.lende
const OVERGANG = 0.05

function vorm(hoek: number): [number, number] {
  const c = Math.cos(hoek)
  const s = Math.sin(hoek)
  return [Math.sign(c) * Math.abs(c) ** (2 / MACHT), Math.sign(s) * Math.abs(s) ** (2 / MACHT)]
}

function glad(a: number, b: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

export interface RompKleuren {
  readonly huid: Color
  readonly kleding: Color
  readonly accent: Color
  /** Accent op buik, borst, rug en billen. */
  readonly romp: boolean
  readonly borst: boolean
  readonly rug: boolean
  readonly bil: boolean
}

function kleurVan(k: RompKleuren, s: number, voorkant: number): Color {
  if (s < BROEK_TOT) {
    const bil = k.bil && voorkant < -0.2 && s < 0.03
    return bil ? k.kleding.clone().lerp(k.accent, 0.55) : k.kleding
  }
  const spier =
    (k.romp && s < BORST_BEGIN && voorkant > 0.1) ||
    (k.borst && s > 0.3 && s < 0.48 && voorkant > 0.25) ||
    (k.rug && s > 0.22 && s < 0.5 && voorkant < -0.1)
  return spier ? k.huid.clone().lerp(k.accent, 0.62) : k.huid
}

export interface RompHuid {
  readonly geometrie: BufferGeometry
  zet(f: Figuur): void
}

export function bouwRomp(kleuren: RompKleuren): RompHuid {
  const aantal = RINGEN.length * ROND + 2
  const posities = new Float32Array(aantal * 3)
  const kleur = new Float32Array(aantal * 3)
  const index: number[] = []
  RINGEN.forEach((r, i) => {
    for (let j = 0; j < ROND; j++) {
      const voorkant = Math.sin((j / ROND) * Math.PI * 2)
      kleurVan(kleuren, r.s, voorkant).toArray(kleur, (i * ROND + j) * 3)
      if (i < RINGEN.length - 1) {
        const a = i * ROND + j
        const b = i * ROND + ((j + 1) % ROND)
        index.push(a, b, a + ROND, b, b + ROND, a + ROND)
      }
    }
  })
  const onder = RINGEN.length * ROND
  const boven = onder + 1
  kleuren.kleding.toArray(kleur, onder * 3)
  kleuren.huid.toArray(kleur, boven * 3)
  const laatste = (RINGEN.length - 1) * ROND
  for (let j = 0; j < ROND; j++) {
    const j2 = (j + 1) % ROND
    index.push(onder, j2, j)
    index.push(boven, laatste + j, laatste + j2)
  }
  const geometrie = new BufferGeometry()
  geometrie.setAttribute('position', new BufferAttribute(posities, 3))
  geometrie.setAttribute('color', new BufferAttribute(kleur, 3))
  geometrie.setIndex(index)

  const mats = [new Matrix4(), new Matrix4(), new Matrix4()]
  const a = new Vector3()
  const b = new Vector3()
  const zetMat = (m: Matrix4, f: Frame) => m.makeRotationFromQuaternion(f.rot).setPosition(f.pos)
  const inFrame = (uit: Vector3, k: number, x: number, s: number, z: number) => {
    const basis = k === 0 ? 0 : k === 1 ? LENDE_BEGIN : BORST_BEGIN
    const dz = k === 0 ? 0 : -MATEN.bekkenNaarLende.z
    return uit.set(x, s - basis, z + dz).applyMatrix4(mats[k])
  }
  const punt = (uit: Vector3, x: number, s: number, z: number) => {
    const t1 = glad(LENDE_BEGIN - OVERGANG, LENDE_BEGIN + OVERGANG, s)
    const t2 = glad(BORST_BEGIN - OVERGANG, BORST_BEGIN + OVERGANG, s)
    if (t2 > 0) {
      inFrame(a, 1, x, s, z)
      inFrame(b, 2, x, s, z)
      return uit.copy(a).lerp(b, t2)
    }
    inFrame(a, 0, x, s, z)
    inFrame(b, 1, x, s, z)
    return uit.copy(a).lerp(b, t1)
  }
  const p = new Vector3()

  return {
    geometrie,
    zet(f: Figuur) {
      zetMat(mats[0], f.bekken)
      zetMat(mats[1], f.lende)
      zetMat(mats[2], f.borst)
      RINGEN.forEach((r, i) => {
        for (let j = 0; j < ROND; j++) {
          const [c, s] = vorm((j / ROND) * Math.PI * 2)
          const diepte = s > 0 ? r.voor : r.achter
          punt(p, -c * r.breed, r.s, r.z + s * diepte).toArray(posities, (i * ROND + j) * 3)
        }
      })
      const eerste = RINGEN[0]
      const top = RINGEN[RINGEN.length - 1]
      punt(p, 0, eerste.s - 0.012, eerste.z).toArray(posities, onder * 3)
      punt(p, 0, top.s + 0.01, top.z).toArray(posities, boven * 3)
      geometrie.attributes.position.needsUpdate = true
      geometrie.computeVertexNormals()
      geometrie.computeBoundingSphere()
    },
  }
}
