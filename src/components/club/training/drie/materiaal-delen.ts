// ─── Fit Factory Club, 3D-oefenbeelden: gedeelde onderdelen voor materiaal ──
// Materialen, afgeronde blokken, buizen en schijven. Alles wat een stuk
// materiaal per beeld moet bijwerken, gaat via een `Zetter`.

import { CylinderGeometry, LatheGeometry, Mesh, Vector2, Vector3, type Material, type Object3D } from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import type { Figuur } from '@/lib/club/training/3d/kinematica'
import type { Houding } from '@/lib/club/training/3d/typen'
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

/** Zet een stuk materiaal in de stand van dit beeld. */
export type Zetter = (f: Figuur, h: Houding) => void

export const OMHOOG = new Vector3(0, 1, 0)

export function schaduw<T extends Object3D>(o: T): T {
  o.traverse((d) => {
    if (d instanceof Mesh) {
      d.castShadow = true
      d.receiveShadow = true
    }
  })
  return o
}

/** Draai een cilinder (as langs y) naar de x-as. */
export function opX<T extends Mesh>(m: T): T {
  m.rotation.z = Math.PI / 2
  return m
}

export function blok(bak: GeoBak, m: Material, maat: [number, number, number], pos: [number, number, number], ronding = 0.02): Mesh {
  const mesh = new Mesh(bak.houd(new RoundedBoxGeometry(maat[0], maat[1], maat[2], 3, ronding)), m)
  mesh.position.set(...pos)
  return mesh
}

export function cilinder(bak: GeoBak, m: Material, straal: number, lengte: number, segmenten = 20): Mesh {
  return new Mesh(bak.houd(new CylinderGeometry(straal, straal, lengte, segmenten)), m)
}

/** Een buis tussen twee vaste punten. */
export function buis(bak: GeoBak, m: Material, straal: number, van: Vector3, naar: Vector3): Mesh {
  const mesh = cilinder(bak, m, straal, van.distanceTo(naar), 16)
  legTussen(mesh, van, naar)
  return mesh
}

/** Een buis van lengte 1 die per beeld tussen twee punten wordt gelegd. */
export function rekbareBuis(bak: GeoBak, m: Material, straal: number): Mesh {
  return cilinder(bak, m, straal, 1, 12)
}

const richting = new Vector3()

/** Leg een cilinder van lengte 1 (of van de juiste lengte) tussen twee punten. */
export function legTussen(mesh: Mesh, van: Vector3, naar: Vector3, rek = false): void {
  mesh.position.copy(van).add(naar).multiplyScalar(0.5)
  richting.copy(naar).sub(van)
  const lengte = richting.length()
  if (lengte < 1e-6) return
  mesh.quaternion.setFromUnitVectors(OMHOOG, richting.multiplyScalar(1 / lengte))
  if (rek) mesh.scale.set(1, lengte, 1)
}

/** Een halterschijf met naaf en verdikte rand, as langs y. */
export function schijfVorm(bak: GeoBak, straal: number, dikte: number): LatheGeometry {
  const h = dikte / 2
  const p = [
    [0.026, -h * 0.7], [0.05, -h * 0.7], [0.058, -h * 0.45], [straal - 0.03, -h * 0.45],
    [straal - 0.018, -h], [straal - 0.004, -h], [straal, -h + 0.006], [straal, h - 0.006],
    [straal - 0.004, h], [straal - 0.018, h], [straal - 0.03, h * 0.45], [0.058, h * 0.45],
    [0.05, h * 0.7], [0.026, h * 0.7], [0.026, -h * 0.7],
  ].map(([x, y]) => new Vector2(x, y))
  return bak.houd(new LatheGeometry(p, 48))
}
