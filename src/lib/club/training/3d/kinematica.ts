// ─── Fit Factory Club, 3D-oefenbeelden: kinematica (PUUR, alleen three-wiskunde) ─
// Van een houding (kanalen) naar de plek en stand van elk lichaamsdeel.
// Romp en hoofd: voorwaartse kinematica vanuit het bekken. Armen en benen:
// inverse kinematica met twee botten naar een vast punt (enkel op de vloer,
// greep aan de last), met een buigrichting voor knie en elleboog.

import { Euler, Matrix4, Quaternion, Vector3 } from 'three'
import { ARM_GREEP, BEEN, MATEN } from './maten'
import type { Houding, Oefening3d, Vec3 } from './typen'

const GRAAD = Math.PI / 180
const X = new Vector3(1, 0, 0)
const Y = new Vector3(0, 1, 0)

export interface Frame {
  readonly pos: Vector3
  readonly rot: Quaternion
}

export interface Ledemaat {
  readonly begin: Vector3
  readonly midden: Vector3
  readonly eind: Vector3
  /** Buiging van knie of elleboog in graden (0 = gestrekt). */
  readonly buiging: number
  /** Afstand begin tot doel gedeeld door de lengte (boven 1 = niet te halen). */
  readonly reik: number
}

/** Index 0 is links (+x), 1 is rechts. */
export type Paar<T> = readonly [T, T]

export interface Figuur {
  readonly bekken: Frame
  readonly lende: Frame
  readonly borst: Frame
  readonly hoofd: Frame
  readonly benen: Paar<Ledemaat>
  readonly armen: Paar<Ledemaat>
  readonly voeten: Paar<Frame>
  readonly handen: Paar<Frame>
  readonly last: Frame
  /** Heupbuiging in graden ten opzichte van het bekken (positief = dij naar voren). */
  readonly heupbuiging: Paar<number>
}

export const ZIJDEN = [1, -1] as const

function v(p: Vec3, spiegel = 1): Vector3 {
  return new Vector3(p.x * spiegel, p.y, p.z)
}

function rx(graden: number): Quaternion {
  return new Quaternion().setFromAxisAngle(X, graden * GRAAD)
}

function kind(ouder: Frame, plek: Vector3, buiging: number): Frame {
  return {
    pos: plek.clone().applyQuaternion(ouder.rot).add(ouder.pos),
    rot: ouder.rot.clone().multiply(rx(buiging)),
  }
}

/**
 * Twee botten van `begin` naar `doel`. De buiging ligt in het vlak van de
 * lijn begin-doel en `richting`. Te ver weg: het lid strekt zich uit richting doel.
 */
export function tweeBotten(begin: Vector3, doel: Vector3, l1: number, l2: number, richting: Vector3): Ledemaat {
  const naar = doel.clone().sub(begin)
  const afstand = naar.length()
  const u = naar.clone().normalize()
  const d = Math.min(Math.max(afstand, Math.abs(l1 - l2) + 1e-4), l1 + l2 - 1e-5)
  const n = richting.clone().sub(u.clone().multiplyScalar(richting.dot(u)))
  if (n.lengthSq() < 1e-10) {
    const reserve = Math.abs(u.y) < 0.9 ? Y : X
    n.copy(reserve).sub(u.clone().multiplyScalar(u.dot(reserve)))
  }
  n.normalize()
  const cosA = (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d)
  const a = Math.acos(Math.min(1, Math.max(-1, cosA)))
  const midden = begin.clone().add(u.clone().multiplyScalar(l1 * Math.cos(a))).add(n.clone().multiplyScalar(l1 * Math.sin(a)))
  const eind = begin.clone().add(u.clone().multiplyScalar(d))
  const cosK = (l1 * l1 + l2 * l2 - d * d) / (2 * l1 * l2)
  const buiging = 180 - Math.acos(Math.min(1, Math.max(-1, cosK))) / GRAAD
  return { begin, midden, eind, buiging, reik: afstand / (l1 + l2) }
}

function romp(h: Houding): { bekken: Frame; lende: Frame; borst: Frame; hoofd: Frame } {
  const bekken: Frame = { pos: new Vector3(0, h.bekkenY, h.bekkenZ), rot: rx(h.kantel) }
  const lende = kind(bekken, new Vector3(0, MATEN.bekkenNaarLende.y, MATEN.bekkenNaarLende.z), h.lende)
  const borst = kind(lende, new Vector3(0, MATEN.lende, 0), h.borst)
  const hoofd = kind(borst, new Vector3(0, MATEN.borst, -0.005), h.nek)
  return { bekken, lende, borst, hoofd }
}

/** Hoe gestrekt hangende armen zijn (net niet op slot). */
export const HANG_STREK = 0.997

function lastFrame(o: Oefening3d, h: Houding, borst: Frame, schouder: Vector3): Frame {
  if (o.last === 'romp') return kind(borst, new Vector3(0, h.lastY, h.lastZ), 0)
  if (o.last === 'hangend') {
    const arm = (MATEN.bovenarm + ARM_GREEP) * HANG_STREK
    const dx = h.greep - schouder.x
    const dz = h.lastZ - schouder.z
    const dy = Math.sqrt(Math.max(0, arm * arm - dx * dx - dz * dz))
    return { pos: new Vector3(0, schouder.y - dy, h.lastZ), rot: new Quaternion() }
  }
  return { pos: new Vector3(0, h.lastY, h.lastZ), rot: new Quaternion() }
}

function voetFrame(o: Oefening3d, zijde: number): Frame {
  const rot = new Quaternion().setFromEuler(new Euler(o.voet.kanteling * GRAAD, o.voet.uitdraai * GRAAD * zijde, 0, 'YXZ'))
  return { pos: v(o.enkel, zijde), rot }
}

function handFrame(o: Oefening3d, arm: Ledemaat, last: Frame): Frame {
  if (o.handen === 'plat') {
    // Plat op de vloer: vingers naar voren (+z), handpalm naar beneden.
    return { pos: arm.eind.clone(), rot: new Quaternion().setFromAxisAngle(X, Math.PI / 2) }
  }
  const lengte = arm.eind.clone().sub(arm.midden).normalize()
  const as = X.clone().applyQuaternion(last.rot)
  const x = as.sub(lengte.clone().multiplyScalar(as.dot(lengte))).normalize()
  const z = new Vector3().crossVectors(x, lengte)
  const rot = new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(x, lengte, z))
  return { pos: arm.eind.clone(), rot }
}

function heupbuiging(bekken: Frame, been: Ledemaat): number {
  const dij = been.midden.clone().sub(been.begin).applyQuaternion(bekken.rot.clone().invert())
  return Math.atan2(dij.z, -dij.y) / GRAAD
}

/** Het hele figuur in een houding. */
export function figuurIn(o: Oefening3d, h: Houding): Figuur {
  const r = romp(h)
  const schouders = ZIJDEN.map(
    (z) => kind(r.borst, new Vector3(MATEN.schouder.x * z, MATEN.schouder.y + h.schouders, MATEN.schouder.z), 0).pos,
  )
  const last = lastFrame(o, h, r.borst, schouders[0])
  const lastAs = X.clone().applyQuaternion(last.rot)
  const voeten = ZIJDEN.map((z) => voetFrame(o, z)) as unknown as Paar<Frame>
  const benen = ZIJDEN.map((z, i) => {
    const heup = kind(r.bekken, new Vector3(MATEN.heupBreedte * z, 0, 0), 0).pos
    return tweeBotten(heup, voeten[i].pos, MATEN.dij, MATEN.scheen, v(o.knieRichting, z))
  }) as unknown as Paar<Ledemaat>
  const onder = o.handen === 'plat' ? MATEN.onderarm : ARM_GREEP
  const armen = ZIJDEN.map((z, i) => {
    const schouder = schouders[i]
    const doel = last.pos.clone().add(lastAs.clone().multiplyScalar(h.greep * z))
    return tweeBotten(schouder, doel, MATEN.bovenarm, onder, v(o.elleboogRichting, z))
  }) as unknown as Paar<Ledemaat>
  const handen = armen.map((a) => handFrame(o, a, last)) as unknown as Paar<Frame>
  return {
    ...r,
    benen,
    armen,
    voeten,
    handen,
    last,
    heupbuiging: [heupbuiging(r.bekken, benen[0]), heupbuiging(r.bekken, benen[1])],
  }
}

export { BEEN, ARM_GREEP }
