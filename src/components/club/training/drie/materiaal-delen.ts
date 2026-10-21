// ─── Fit Factory Club, 3D-oefenbeelden: gedeelde onderdelen voor materiaal ──
// Materialen (gepoedercoat frame, chroom, rubber, bekleding), afgeronde
// blokken, buizen met ronde bochten en schijven. Alles wat een stuk materiaal
// per beeld moet bijwerken, gaat via een `Zetter`.

import {
  Color,
  CurvePath,
  Group,
  CylinderGeometry,
  LineCurve3,
  Mesh,
  MeshStandardMaterial,
  QuadraticBezierCurve3,
  TubeGeometry,
  Vector3,
  Matrix4,
  type BufferGeometry,
  type Material,
  type Object3D,
  type Texture,
} from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { Figuur } from '@/lib/club/training/3d/kinematica'
import type { Houding } from '@/lib/club/training/3d/typen'
import type { GeoBak } from './vormen'
import { bekledingTextuur, gatenTextuur, knurlTextuur, korrelTextuur, touwTextuur } from './materiaal-texturen'

export interface MateriaalMaterialen {
  /** Gepolijst chroom: hulzen, geleidestangen, katrollen. */
  readonly staal: MeshStandardMaterial
  /** Satijnstaal: stang, hefbomen. */
  readonly staalMat: MeshStandardMaterial
  /** Staal met knurling (grip op stang en handvat). */
  readonly knurl: MeshStandardMaterial
  /** Rubber van bumperschijven en dumbbellkoppen. */
  readonly schijf: MeshStandardMaterial
  /** Gepoedercoat gietijzer (kettlebell, losse ijzeren schijven). */
  readonly gietijzer: MeshStandardMaterial
  readonly accent: MeshStandardMaterial
  /** Bekleding met nerf en naad. */
  readonly kussen: MeshStandardMaterial
  /** Rubberen handgrepen en eindkapjes. */
  readonly greep: MeshStandardMaterial
  /** Gepoedercoat frame van banken, rekken en machines. */
  readonly frame: MeshStandardMaterial
  /** Staander met gatenrij (rek). */
  readonly gaten: MeshStandardMaterial
  /** Kunststof kappen en panelen. */
  readonly kunststof: MeshStandardMaterial
  readonly stapel: MeshStandardMaterial
  readonly mat: MeshStandardMaterial
  readonly kabel: MeshStandardMaterial
  readonly touw: MeshStandardMaterial
  readonly accentKleur: string
  /** Eigen kopie van een materiaal dat apart moet kunnen veranderen; ruimOp ruimt hem mee op. */
  kopie<T extends Material>(m: T): T
  /** Bewaar een textuur die bij het opruimen weg moet. */
  houd<T extends Texture>(t: T): T
  ruimOp(): void
}

export type Thema = 'donker' | 'licht'

export function maakMateriaalMaterialen(accent: Color, thema: Thema): MateriaalMaterialen {
  const texturen: Texture[] = []
  const extra: Material[] = []
  const houd = <T extends Texture>(t: T): T => {
    texturen.push(t)
    return t
  }
  const knurl = houd(knurlTextuur())
  const nerf = houd(bekledingTextuur())
  const korrel = houd(korrelTextuur())
  const touw = houd(touwTextuur())
  const gaten = houd(gatenTextuur())
  const donker = thema === 'donker'
  const metaal = (kleur: string, ruw: number, env = 1.25) =>
    new MeshStandardMaterial({ color: kleur, roughness: ruw, metalness: 1, envMapIntensity: env })
  const frameKleur = donker ? '#4a4e56' : '#3b3e45'
  const basis = {
    staal: metaal('#e6e8ec', 0.13, 1.5),
    staalMat: metaal('#c7cace', 0.3),
    knurl: new MeshStandardMaterial({ color: '#b9bcc1', roughness: 0.48, metalness: 1, bumpMap: knurl, bumpScale: 1.6, roughnessMap: knurl, envMapIntensity: 1.2 }),
    schijf: new MeshStandardMaterial({ color: donker ? '#2c2d32' : '#202125', roughness: 0.6, metalness: 0, bumpMap: korrel, bumpScale: 0.6, envMapIntensity: 1.1 }),
    gietijzer: new MeshStandardMaterial({ color: donker ? '#33353a' : '#2a2c30', roughness: 0.55, metalness: 0.45, bumpMap: korrel, bumpScale: 0.5, envMapIntensity: 0.9 }),
    accent: new MeshStandardMaterial({ color: accent, roughness: 0.35, metalness: 0.55, envMapIntensity: 1.1 }),
    kussen: new MeshStandardMaterial({ color: donker ? '#2b2c31' : '#232428', roughness: 0.58, metalness: 0, bumpMap: nerf, bumpScale: 1.2, envMapIntensity: 0.7 }),
    greep: new MeshStandardMaterial({ color: '#17181b', roughness: 0.75, metalness: 0, bumpMap: korrel, bumpScale: 0.8 }),
    frame: new MeshStandardMaterial({ color: frameKleur, roughness: 0.36, metalness: 0.6, envMapIntensity: 1.0 }),
    gaten: new MeshStandardMaterial({ color: frameKleur, map: gaten, roughness: 0.36, metalness: 0.6, envMapIntensity: 1.0 }),
    kunststof: new MeshStandardMaterial({ color: donker ? '#2e3036' : '#26282d', roughness: 0.42, metalness: 0.1, envMapIntensity: 0.8 }),
    stapel: new MeshStandardMaterial({ color: donker ? '#3a3c42' : '#2f3136', roughness: 0.3, metalness: 0.75, envMapIntensity: 1.1 }),
    mat: new MeshStandardMaterial({ color: '#303237', roughness: 0.92, metalness: 0, bumpMap: korrel, bumpScale: 0.8 }),
    kabel: new MeshStandardMaterial({ color: '#141517', roughness: 0.32, metalness: 0.25 }),
    touw: new MeshStandardMaterial({ map: touw, roughness: 0.85, metalness: 0, bumpMap: touw, bumpScale: 1.2 }),
  }
  return {
    ...basis,
    accentKleur: `#${accent.getHexString()}`,
    kopie<T extends Material>(m: T): T {
      const k = m.clone() as T
      extra.push(k)
      return k
    },
    houd,
    ruimOp() {
      for (const m of [...Object.values(basis), ...extra]) m.dispose()
      for (const t of texturen) t.dispose()
    },
  }
}

/** Zet een stuk materiaal in de stand van dit beeld. */
export type Zetter = (f: Figuur, h: Houding) => void

/** Een stuk materiaal: meshes, per beeld zetten en (optioneel) vooraf de hele beweging meten. */
export interface Stuk {
  readonly groep: Group
  readonly zet: Zetter
  /** Wordt vooraf voor een reeks standen over de hele lus aangeroepen (slag van een kabel of hefboom). */
  readonly meet?: Zetter
}

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
export function opX<T extends Object3D>(m: T): T {
  m.rotation.z = Math.PI / 2
  return m
}

/** Leg de y-as van een draaivorm langs +x (`kant` 1) of -x (`kant` -1). */
export function langsX<T extends Object3D>(m: T, kant: number): T {
  m.rotation.z = (-kant * Math.PI) / 2
  return m
}

/** Draai een cilinder (as langs y) naar de z-as. */
export function opZ<T extends Object3D>(m: T): T {
  m.rotation.x = Math.PI / 2
  return m
}

export function blok(bak: GeoBak, m: Material, maat: [number, number, number], pos: [number, number, number], ronding = 0.02): Mesh {
  const r = Math.min(ronding, Math.min(...maat) / 2 - 1e-4)
  const mesh = new Mesh(bak.houd(new RoundedBoxGeometry(maat[0], maat[1], maat[2], 3, r)), m)
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
export function rekbareBuis(bak: GeoBak, m: Material, straal: number, segmenten = 12): Mesh {
  return cilinder(bak, m, straal, 1, segmenten)
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

/**
 * Een frame van buis langs een reeks punten, met ronde bochten zoals bij
 * gebogen gymframes. `bocht` is de straal van een bocht in meters.
 */
export function buisPad(bak: GeoBak, m: Material, punten: readonly Vector3[], straal: number, bocht = 0.09): Mesh {
  const pad = new CurvePath<Vector3>()
  let vorige = punten[0].clone()
  for (let i = 1; i < punten.length; i++) {
    const hoek = punten[i]
    const volgende = punten[i + 1]
    if (!volgende) {
      pad.add(new LineCurve3(vorige, hoek.clone()))
      break
    }
    const inKort = Math.min(bocht, hoek.distanceTo(punten[i - 1]) / 2)
    const uitKort = Math.min(bocht, hoek.distanceTo(volgende) / 2)
    const a = hoek.clone().add(punten[i - 1].clone().sub(hoek).setLength(inKort))
    const b = hoek.clone().add(volgende.clone().sub(hoek).setLength(uitKort))
    pad.add(new LineCurve3(vorige, a))
    pad.add(new QuadraticBezierCurve3(a, hoek.clone(), b))
    vorige = b
  }
  const lengte = pad.getLength()
  const geo = new TubeGeometry(pad, Math.max(8, Math.round(lengte * 40) + punten.length * 6), straal, 14, false)
  return new Mesh(bak.houd(geo), m)
}

/** Rubberen eindkap op een open buiseinde, `richting` wijst naar buiten. */
export function eindkap(bak: GeoBak, m: MateriaalMaterialen, plek: Vector3, naar: Vector3, straal: number): Mesh {
  const kap = cilinder(bak, m.greep, straal * 1.08, 0.012, 16)
  legTussen(kap, plek, plek.clone().add(naar.clone().setLength(0.012)))
  return kap
}

/**
 * Punt waar een kabel van een katrolwiel loskomt: het wiel ligt in de bocht,
 * de kabel loopt over de buitenkant. `naar` wijst langs de kabel van dit
 * stuk, `ander` langs het andere stuk dat over hetzelfde wiel loopt.
 */
export function raakPunt(midden: Vector3, straal: number, naar: Vector3, ander: Vector3, uit = new Vector3()): Vector3 {
  const a = naar.clone().normalize()
  const b = ander.clone().normalize()
  const loodrecht = b.sub(a.clone().multiplyScalar(b.dot(a)))
  if (loodrecht.lengthSq() < 1e-8) return uit.copy(midden)
  return uit.copy(midden).addScaledVector(loodrecht.normalize(), -straal)
}

/**
 * Meet hoe ver iets over de hele beweging gaat (een kabel, een hefboom), zodat
 * de gewichtsstapel precies zo ver omhoog gaat als de beweging vraagt.
 */
export class Slag {
  private min = Infinity
  private max = -Infinity

  meet(waarde: number): void {
    this.min = Math.min(this.min, waarde)
    this.max = Math.max(this.max, waarde)
  }

  /** Deel van de slag (0 in rust, 1 op het verste punt). */
  deel(waarde: number): number {
    if (!(this.max > this.min + 1e-4)) return 0
    return Math.min(1, Math.max(0, (waarde - this.min) / (this.max - this.min)))
  }

  /** Lengte van de slag in meters (bij een kabel). */
  get lengte(): number {
    return this.max > this.min ? this.max - this.min : 0
  }
}

/**
 * Voeg vaste meshes met hetzelfde materiaal samen tot een mesh (minder
 * tekenopdrachten: soepeler op een telefoon). `diep`: ook in subgroepen; zet
 * hem uit als een subgroep beweegt (zoals het bewegende deel van een stapel).
 */
export function voegSamen<T extends Group>(groep: T, bak: GeoBak, diep = true): T {
  groep.updateMatrixWorld(true)
  const terug = new Matrix4().copy(groep.matrixWorld).invert()
  const perMateriaal = new Map<Material, BufferGeometry[]>()
  const weg: Mesh[] = []
  const bekijk = (o: Object3D) => {
    if (o instanceof Mesh && !Array.isArray(o.material) && o.castShadow !== false) {
      const geo = (o.geometry as BufferGeometry).index ? (o.geometry as BufferGeometry).toNonIndexed() : (o.geometry as BufferGeometry).clone()
      for (const naam of Object.keys(geo.attributes)) if (!['position', 'normal', 'uv'].includes(naam)) geo.deleteAttribute(naam)
      geo.applyMatrix4(new Matrix4().multiplyMatrices(terug, o.matrixWorld))
      const lijst = perMateriaal.get(o.material as Material) ?? []
      lijst.push(geo)
      perMateriaal.set(o.material as Material, lijst)
      weg.push(o)
    } else if (diep || o === groep) {
      for (const kind of o.children) bekijk(kind)
    }
  }
  bekijk(groep)
  if (weg.length < 2) return groep
  for (const mesh of weg) mesh.removeFromParent()
  for (const [mat, lijst] of perMateriaal) {
    const samen = mergeGeometries(lijst, false)
    for (const g of lijst) g.dispose()
    if (!samen) continue
    const mesh = new Mesh(bak.houd(samen), mat)
    mesh.castShadow = true
    mesh.receiveShadow = true
    groep.add(mesh)
  }
  return groep
}
