// ─── Fit Factory Club, 3D-oefenbeelden: grepen aan de kabel ─────────────────
// Rechte stang, touw (twee helften met eindknoppen, door de vuist), V-greep en
// D-handvat. Elke greep geeft per beeld het haakpunt waar de kabel aangrijpt.

import { Group, Mesh, MeshStandardMaterial, Vector3 } from 'three'
import type { Figuur } from '@/lib/club/training/3d/kinematica'
import type { KabelGreep } from '@/lib/club/training/3d/typen'
import type { GeoBak } from './vormen'
import { buisPad, cilinder, legTussen, OMHOOG, opX, rekbareBuis, schaduw, type MateriaalMaterialen } from './materiaal-delen'
import { wartel } from './materiaal-stapel'

export interface Greep {
  readonly groep: Group
  /** Haakpunt van de kabel, bijgewerkt door `zet`. */
  readonly haak: Vector3
  /** Zet de greep in de handen; `katrol` is het wiel waar de kabel heen loopt. */
  zet(f: Figuur, katrol: Vector3): void
}

const midden = new Vector3()
const naar = new Vector3()
const as = new Vector3()

function richting(f: Figuur, katrol: Vector3): void {
  midden.copy(f.handen[0].pos).add(f.handen[1].pos).multiplyScalar(0.5)
  naar.copy(katrol).sub(midden).normalize()
}

function zetWartel(w: Group, plek: Vector3, dir: Vector3): void {
  w.position.copy(plek)
  w.quaternion.setFromUnitVectors(OMHOOG, dir)
}

/** Rechte stang (triceps pushdown) met knurling en een draaibare haak in het midden. */
function rechteStang(bak: GeoBak, m: MateriaalMaterialen): Greep {
  const g = new Group()
  const bar = new Group()
  bar.add(opX(cilinder(bak, m.staal, 0.0145, 0.5, 18)))
  for (const z of [1, -1]) {
    const k = opX(cilinder(bak, m.knurl, 0.0152, 0.15, 18))
    k.position.x = 0.15 * z
    const kap = opX(cilinder(bak, m.greep, 0.018, 0.016, 16))
    kap.position.x = 0.255 * z
    bar.add(k, kap)
  }
  const w = wartel(bak, m)
  g.add(bar, w)
  const haak = new Vector3()
  return {
    groep: schaduw(g),
    haak,
    zet(f, katrol) {
      richting(f, katrol)
      bar.position.copy(midden)
      zetWartel(w, midden, naar)
      haak.copy(midden).addScaledVector(naar, 0.055)
    },
  }
}

/** Brede latstang met gebogen uiteinden, rubberen grepen en een draaibare haak. */
function latStang(bak: GeoBak, m: MateriaalMaterialen): Greep {
  const g = new Group()
  const bar = new Group()
  const p = (x: number, y: number) => new Vector3(x, y, 0)
  bar.add(buisPad(bak, m.staal, [p(-0.64, -0.075), p(-0.5, 0), p(0.5, 0), p(0.64, -0.075)], 0.0135, 0.06))
  for (const z of [1, -1]) {
    const greep = opX(cilinder(bak, m.greep, 0.0185, 0.2, 18))
    greep.position.x = 0.36 * z
    bar.add(greep)
    const kap = cilinder(bak, m.greep, 0.016, 0.02, 14)
    kap.position.set(0.645 * z, -0.083, 0)
    kap.rotation.z = z * 0.49
    bar.add(kap)
  }
  const w = wartel(bak, m)
  g.add(bar, w)
  const haak = new Vector3()
  return {
    groep: schaduw(g),
    haak,
    zet(f, katrol) {
      richting(f, katrol)
      bar.position.copy(f.last.pos)
      zetWartel(w, f.last.pos, naar)
      haak.copy(f.last.pos).addScaledVector(naar, 0.055)
    },
  }
}

/** Touw: twee gevlochten helften vanuit een huls, door de vuist, met rubberen eindknoppen. */
function touw(bak: GeoBak, m: MateriaalMaterialen): Greep {
  const g = new Group()
  const kaart = m.touw.map
  const helften = [0, 1].map(() => {
    const mat = m.kopie(m.touw) as MeshStandardMaterial
    if (kaart) {
      const t = m.houd(kaart.clone())
      mat.map = t
      mat.bumpMap = t
    }
    return { mesh: rekbareBuis(bak, mat, 0.0135, 12), mat }
  })
  const knoppen = [0, 1].map(() => rekbareBuis(bak, m.greep, 0.021, 16))
  const huls = cilinder(bak, m.staal, 0.02, 1, 16)
  const w = wartel(bak, m)
  g.add(...helften.map((h) => h.mesh), ...knoppen, huls, w)
  const knoop = new Vector3()
  const haak = new Vector3()
  const a = new Vector3()
  const b = new Vector3()
  const staart = new Vector3()
  return {
    groep: schaduw(g),
    haak,
    zet(f, katrol) {
      richting(f, katrol)
      knoop.copy(midden).addScaledVector(naar, 0.16)
      f.handen.forEach((hand, i) => {
        as.set(1, 0, 0).applyQuaternion(hand.rot)
        a.copy(hand.pos).addScaledVector(as, 0.055)
        b.copy(hand.pos).addScaledVector(as, -0.055)
        const [inn, uit] = a.distanceToSquared(knoop) < b.distanceToSquared(knoop) ? [a, b] : [b, a]
        staart.copy(uit).sub(inn).normalize()
        const eind = uit.clone().addScaledVector(staart, 0.012)
        legTussen(helften[i].mesh, knoop, eind, true)
        const lengte = knoop.distanceTo(eind)
        const t = helften[i].mat.map
        if (t) t.repeat.set(2, Math.max(1, lengte / 0.022))
        legTussen(knoppen[i], eind, eind.clone().addScaledVector(staart, 0.05), true)
      })
      legTussen(huls, knoop, knoop.clone().addScaledVector(naar, 0.05), true)
      zetWartel(w, knoop.clone().addScaledVector(naar, 0.045), naar)
      haak.copy(knoop).addScaledVector(naar, 0.1)
    },
  }
}

/** V-greep: twee rubberen handvatten in een stalen driehoek. */
function vGreep(bak: GeoBak, m: MateriaalMaterialen): Greep {
  const g = new Group()
  const staven = [0, 1, 2, 3].map(() => rekbareBuis(bak, m.staalMat, 0.0085, 10))
  const grepen = [0, 1].map(() => cilinder(bak, m.greep, 0.0175, 0.13, 16))
  const w = wartel(bak, m)
  g.add(...staven, ...grepen, w)
  const knoop = new Vector3()
  const haak = new Vector3()
  return {
    groep: schaduw(g),
    haak,
    zet(f, katrol) {
      richting(f, katrol)
      knoop.copy(midden).addScaledVector(naar, 0.14)
      f.handen.forEach((hand, i) => {
        as.set(1, 0, 0).applyQuaternion(hand.rot)
        grepen[i].position.copy(hand.pos)
        grepen[i].quaternion.setFromUnitVectors(OMHOOG, as)
        legTussen(staven[i * 2], knoop, hand.pos.clone().addScaledVector(as, 0.068), true)
        legTussen(staven[i * 2 + 1], knoop, hand.pos.clone().addScaledVector(as, -0.068), true)
      })
      zetWartel(w, knoop, naar)
      haak.copy(knoop).addScaledVector(naar, 0.055)
    },
  }
}

/** D-handvat voor een hand: rubberen greep in een stalen beugel. */
function handvat(bak: GeoBak, m: MateriaalMaterialen): Greep {
  const g = new Group()
  const greep = cilinder(bak, m.greep, 0.0175, 0.12, 16)
  const beugels = [0, 1].map(() => rekbareBuis(bak, m.staalMat, 0.008, 10))
  const ring = new Mesh(bak.bol(16), m.staal)
  ring.scale.setScalar(0.012)
  g.add(greep, ...beugels, ring)
  const haak = new Vector3()
  return {
    groep: schaduw(g),
    haak,
    zet(f, katrol) {
      const hand = f.handen[0]
      naar.copy(katrol).sub(hand.pos).normalize()
      as.set(1, 0, 0).applyQuaternion(hand.rot)
      greep.position.copy(hand.pos)
      greep.quaternion.setFromUnitVectors(OMHOOG, as)
      haak.copy(hand.pos).addScaledVector(naar, 0.1)
      legTussen(beugels[0], hand.pos.clone().addScaledVector(as, 0.066), haak, true)
      legTussen(beugels[1], hand.pos.clone().addScaledVector(as, -0.066), haak, true)
      ring.position.copy(haak)
    },
  }
}

export function maakGreep(bak: GeoBak, m: MateriaalMaterialen, soort: KabelGreep | 'lat'): Greep {
  if (soort === 'lat') return latStang(bak, m)
  if (soort === 'stang') return rechteStang(bak, m)
  if (soort === 'touw') return touw(bak, m)
  if (soort === 'vgreep') return vGreep(bak, m)
  return handvat(bak, m)
}
