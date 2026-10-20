// ─── Fit Factory Club, 3D-oefenbeelden: materiaal ────────────────────────────
// Stang met schijven, halters, vlakke bank met steunen, bank met rugleuning,
// kabelstation voor de lat pulldown en een mat. Alles uit eenvoudige vormen.

import {
  CylinderGeometry,
  Group,
  LatheGeometry,
  Mesh,
  Vector2,
  Vector3,
  type Material,
  type Object3D,
} from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import type { Figuur } from '@/lib/club/training/3d/kinematica'
import type { Houding, Materiaal } from '@/lib/club/training/3d/typen'
import type { GeoBak } from './vormen'

export interface MateriaalMaterialen {
  readonly staal: Material
  readonly staalMat: Material
  readonly schijf: Material
  readonly accent: Material
  readonly kussen: Material
  readonly frame: Material
  readonly mat: Material
  readonly kabel: Material
}

export interface MateriaalMeshes {
  readonly groep: Group
  zet(f: Figuur, h: Houding): void
}

function schaduw<T extends Object3D>(o: T): T {
  o.traverse((d) => {
    if (d instanceof Mesh) {
      d.castShadow = true
      d.receiveShadow = true
    }
  })
  return o
}

function opX<T extends Mesh>(m: T): T {
  m.rotation.z = Math.PI / 2
  return m
}

function blok(bak: GeoBak, m: Material, maat: [number, number, number], pos: [number, number, number], ronding = 0.02): Mesh {
  const mesh = new Mesh(bak.houd(new RoundedBoxGeometry(maat[0], maat[1], maat[2], 3, ronding)), m)
  mesh.position.set(...pos)
  return mesh
}

function buis(bak: GeoBak, m: Material, straal: number, van: Vector3, naar: Vector3): Mesh {
  const lengte = van.distanceTo(naar)
  const mesh = new Mesh(bak.houd(new CylinderGeometry(straal, straal, lengte, 16)), m)
  mesh.position.copy(van).add(naar).multiplyScalar(0.5)
  mesh.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), naar.clone().sub(van).normalize())
  return mesh
}

/** Een halterschijf met naaf en verdikte rand, as langs y. */
function schijfVorm(bak: GeoBak, straal: number, dikte: number): LatheGeometry {
  const h = dikte / 2
  const p = [
    [0.026, -h * 0.7], [0.05, -h * 0.7], [0.058, -h * 0.45], [straal - 0.03, -h * 0.45],
    [straal - 0.018, -h], [straal - 0.004, -h], [straal, -h + 0.006], [straal, h - 0.006],
    [straal - 0.004, h], [straal - 0.018, h], [straal - 0.03, h * 0.45], [0.058, h * 0.45],
    [0.05, h * 0.7], [0.026, h * 0.7], [0.026, -h * 0.7],
  ].map(([x, y]) => new Vector2(x, y))
  return bak.houd(new LatheGeometry(p, 48))
}

function stang(bak: GeoBak, m: MateriaalMaterialen, schijven: number): Group {
  const g = new Group()
  g.add(opX(new Mesh(bak.houd(new CylinderGeometry(0.0135, 0.0135, 1.32, 20)), m.staalMat)))
  for (const z of [1, -1]) {
    const huls = opX(new Mesh(bak.houd(new CylinderGeometry(0.025, 0.025, 0.42, 24)), m.staal))
    huls.position.x = 0.87 * z
    g.add(huls)
    const kraag = opX(new Mesh(bak.houd(new CylinderGeometry(0.036, 0.036, 0.03, 24)), m.staal))
    kraag.position.x = 0.645 * z
    g.add(kraag)
    let x = 0.675
    for (let i = 0; i < schijven; i++) {
      const straal = i === 0 ? 0.225 : i === 1 ? 0.2 : 0.16
      const dikte = i === 0 ? 0.05 : 0.04
      const s = opX(new Mesh(schijfVorm(bak, straal, dikte), m.schijf))
      s.position.x = (x + dikte / 2) * z
      g.add(s)
      x += dikte + 0.004
    }
    const slot = opX(new Mesh(bak.houd(new CylinderGeometry(0.034, 0.034, 0.028, 24)), m.accent))
    slot.position.x = (x + 0.016) * z
    g.add(slot)
  }
  return schaduw(g)
}

function halter(bak: GeoBak, m: MateriaalMaterialen): Group {
  const g = new Group()
  g.add(opX(new Mesh(bak.houd(new CylinderGeometry(0.016, 0.016, 0.15, 16)), m.staalMat)))
  for (const z of [1, -1]) {
    const kop = opX(new Mesh(bak.houd(new CylinderGeometry(0.062, 0.062, 0.075, 6)), m.schijf))
    kop.position.x = 0.11 * z
    kop.rotation.x = Math.PI / 6
    g.add(kop)
    const ring = opX(new Mesh(bak.houd(new CylinderGeometry(0.03, 0.03, 0.012, 20)), m.accent))
    ring.position.x = 0.068 * z
    g.add(ring)
  }
  return schaduw(g)
}

function vlakkeBank(bak: GeoBak, m: MateriaalMaterialen, plek: Vector3): Group {
  const g = new Group()
  g.position.copy(plek)
  g.add(blok(bak, m.kussen, [0.29, 0.075, 1.22], [0, 0.393, 0], 0.03))
  g.add(blok(bak, m.frame, [0.08, 0.05, 1.05], [0, 0.33, 0], 0.01))
  for (const z of [-0.45, 0.45]) {
    g.add(blok(bak, m.frame, [0.06, 0.3, 0.06], [0, 0.17, z], 0.01))
    g.add(blok(bak, m.frame, [0.42, 0.04, 0.07], [0, 0.02, z], 0.01))
  }
  // Steunen voor de stang aan het hoofdeinde
  for (const x of [-0.56, 0.56]) {
    g.add(blok(bak, m.frame, [0.06, 1.12, 0.06], [x, 0.56, -0.33], 0.01))
    g.add(blok(bak, m.frame, [0.06, 0.04, 0.42], [x, 0.02, -0.4], 0.01))
    g.add(blok(bak, m.accent, [0.07, 0.035, 0.09], [x, 1.03, -0.29], 0.008))
  }
  return schaduw(g)
}

function rugBank(bak: GeoBak, m: MateriaalMaterialen, plek: Vector3): Group {
  const g = new Group()
  g.position.copy(plek)
  g.add(blok(bak, m.kussen, [0.32, 0.07, 0.38], [0, 0.425, 0.06], 0.03))
  const rug = blok(bak, m.kussen, [0.29, 0.75, 0.07], [0, 0.88, -0.165], 0.03)
  rug.rotation.x = -0.07
  g.add(rug)
  g.add(blok(bak, m.frame, [0.06, 0.38, 0.06], [0, 0.2, 0.06], 0.01))
  g.add(blok(bak, m.frame, [0.06, 0.95, 0.06], [0, 0.5, -0.22], 0.01))
  g.add(blok(bak, m.frame, [0.44, 0.04, 0.07], [0, 0.02, 0.08], 0.01))
  g.add(blok(bak, m.frame, [0.44, 0.04, 0.07], [0, 0.02, -0.24], 0.01))
  g.add(blok(bak, m.frame, [0.06, 0.04, 0.4], [0, 0.02, -0.08], 0.01))
  return schaduw(g)
}

interface Station {
  readonly groep: Group
  readonly katrol: Vector3
}

function kabelstation(bak: GeoBak, m: MateriaalMaterialen, plek: Vector3): Station {
  const g = new Group()
  g.position.copy(plek)
  // Zitting en kussens boven de dijen
  g.add(blok(bak, m.kussen, [0.36, 0.07, 0.36], [0, 0.445, 0.02], 0.03))
  g.add(blok(bak, m.frame, [0.07, 0.42, 0.07], [0, 0.21, 0.08], 0.01))
  for (const x of [-0.11, 0.11]) {
    const rol = opX(new Mesh(bak.houd(new CylinderGeometry(0.055, 0.055, 0.17, 24)), m.kussen))
    rol.position.set(x, 0.71, 0.33)
    g.add(rol)
  }
  g.add(blok(bak, m.frame, [0.05, 0.05, 0.4], [0, 0.71, 0.53], 0.01))
  // Zuil met gewichtsblok, bovenarm met katrol
  g.add(blok(bak, m.frame, [0.05, 2.25, 0.05], [-0.11, 1.125, 0.78], 0.01))
  g.add(blok(bak, m.frame, [0.05, 2.25, 0.05], [0.11, 1.125, 0.78], 0.01))
  g.add(blok(bak, m.schijf, [0.16, 0.5, 0.1], [0, 0.3, 0.78], 0.012))
  g.add(blok(bak, m.accent, [0.17, 0.012, 0.11], [0, 0.42, 0.78], 0.004))
  g.add(blok(bak, m.frame, [0.32, 0.05, 0.62], [0, 0.03, 0.62], 0.01))
  g.add(blok(bak, m.frame, [0.07, 0.07, 0.95], [0, 2.25, 0.33], 0.012))
  const katrol = new Vector3(0, 2.18, -0.06).add(plek)
  const wiel = new Mesh(bak.houd(new CylinderGeometry(0.05, 0.05, 0.03, 24)), m.staal)
  wiel.rotation.z = Math.PI / 2
  wiel.position.set(0, 2.2, -0.08)
  g.add(wiel)
  return { groep: schaduw(g), katrol }
}

function latStang(bak: GeoBak, m: MateriaalMaterialen): Group {
  const g = new Group()
  g.add(opX(new Mesh(bak.houd(new CylinderGeometry(0.014, 0.014, 0.82, 16)), m.staalMat)))
  for (const z of [1, -1]) {
    const greep = opX(new Mesh(bak.houd(new CylinderGeometry(0.018, 0.018, 0.2, 16)), m.kussen))
    greep.position.x = 0.4 * z
    g.add(greep)
    const eind = buis(bak, m.staalMat, 0.014, new Vector3(0.5 * z, 0, 0), new Vector3(0.62 * z, -0.06, 0))
    g.add(eind)
  }
  return schaduw(g)
}

export function bouwMateriaal(bak: GeoBak, m: MateriaalMaterialen, lijst: readonly Materiaal[]): MateriaalMeshes {
  const groep = new Group()
  const zetters: ((f: Figuur, h: Houding) => void)[] = []
  for (const item of lijst) {
    const plek = new Vector3(item.plek?.x ?? 0, item.plek?.y ?? 0, item.plek?.z ?? 0)
    if (item.soort === 'stang') {
      const s = stang(bak, m, item.schijven ?? 2)
      groep.add(s)
      zetters.push((f) => {
        s.position.copy(f.last.pos)
        s.quaternion.copy(f.last.rot)
      })
    } else if (item.soort === 'halters') {
      const paar = [halter(bak, m), halter(bak, m)]
      groep.add(...paar)
      zetters.push((f) => paar.forEach((d, i) => d.position.copy(f.handen[i].pos)))
    } else if (item.soort === 'bank') {
      groep.add(vlakkeBank(bak, m, plek))
    } else if (item.soort === 'bankRug') {
      groep.add(rugBank(bak, m, plek))
    } else if (item.soort === 'mat') {
      groep.add(blok(bak, m.mat, [0.66, 0.012, 1.9], [plek.x, 0.006, plek.z], 0.005))
    } else {
      const st = kabelstation(bak, m, plek)
      const bar = latStang(bak, m)
      const kabel = new Mesh(bak.houd(new CylinderGeometry(0.004, 0.004, 1, 8)), m.kabel)
      groep.add(st.groep, bar, kabel)
      zetters.push((f) => {
        bar.position.copy(f.last.pos)
        const van = f.last.pos
        kabel.position.copy(van).add(st.katrol).multiplyScalar(0.5)
        kabel.scale.y = van.distanceTo(st.katrol)
        kabel.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), st.katrol.clone().sub(van).normalize())
      })
    }
  }
  return {
    groep,
    zet(f, h) {
      for (const z of zetters) z(f, h)
    },
  }
}

