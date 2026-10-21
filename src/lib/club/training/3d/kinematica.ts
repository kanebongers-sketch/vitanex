// ─── Fit Factory Club, 3D-oefenbeelden: kinematica (PUUR, alleen three-wiskunde) ─
// Van een houding (kanalen) naar de plek en stand van elk lichaamsdeel.
// Romp en hoofd: voorwaartse kinematica vanuit het bekken. Armen en benen:
// inverse kinematica met twee botten naar een vast punt (enkel op de vloer,
// greep aan de last), met een buigrichting voor knie en elleboog.

import { Euler, Matrix4, Quaternion, Vector3 } from 'three'
import { ARM_GREEP, BEEN, GRENZEN, MATEN } from './maten'
import type { Blik, HandModus, Houding, Oefening3d, Vec3 } from './typen'

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
  /**
   * As van de buiging (loodrecht op het vlak van het lid), ook goed bepaald als
   * het lid gestrekt is. Een axiale vector: voor rechts vanzelf goed gespiegeld.
   */
  readonly vlak: Vector3
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

/** Bekken: eerst de rol om de lengteas (y), dan de kanteling voorover (x). */
function bekkenRot(h: Houding): Quaternion {
  const q = rx(h.kantel)
  return h.rol ? q.multiply(new Quaternion().setFromAxisAngle(Y, h.rol * GRAAD)) : q
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
  const vlak = new Vector3().crossVectors(u, n).normalize()
  return { begin, midden, eind, buiging, reik: afstand / (l1 + l2), vlak }
}

export interface Romp {
  readonly bekken: Frame
  readonly lende: Frame
  readonly borst: Frame
  readonly hoofd: Frame
}

/** Voorwaartse kanteling van de borst in de wereld (graden): bekken plus onder- en bovenrug. */
export function rompHoek(h: Houding): number {
  return h.kantel + h.lende + h.borst
}

/**
 * De nekbuiging die het hoofd echt krijgt. Zonder blik is dat het kanaal nek. Met
 * blik vangt de nek de kanteling van de romp op zodat het hoofd de wereldhoek van
 * de blik houdt (gemengd met het kanaal volgens de sterkte), altijd binnen
 * GRENZEN.nek.
 */
export function nekMetBlik(h: Houding, blik?: Blik): number {
  if (!blik) return h.nek
  const s = Math.min(1, Math.max(0, blik.sterkte ?? 1))
  const doel = blik.hoek - rompHoek(h)
  const nek = h.nek + (doel - h.nek) * s
  return Math.min(GRENZEN.nek.max, Math.max(GRENZEN.nek.min, nek))
}

/** Romp en hoofd in een houding (voorwaartse kinematica vanuit het bekken). */
export function romp(h: Houding, blik?: Blik): Romp {
  const bekken: Frame = { pos: new Vector3(0, h.bekkenY, h.bekkenZ), rot: bekkenRot(h) }
  const lende = kind(bekken, new Vector3(0, MATEN.bekkenNaarLende.y, MATEN.bekkenNaarLende.z), h.lende)
  const borst = kind(lende, new Vector3(0, MATEN.lende, 0), h.borst)
  const hoofd = kind(borst, new Vector3(0, MATEN.borst, -0.005), nekMetBlik(h, blik))
  return { bekken, lende, borst, hoofd }
}

/** Hoe gestrekt hangende armen zijn (net niet op slot). */
export const HANG_STREK = 0.997

/** Het linker schoudergewricht in de wereld. */
export function schouderIn(h: Houding, r: Romp = romp(h)): Vector3 {
  return kind(r.borst, new Vector3(MATEN.schouder.x, MATEN.schouder.y + h.schouders, MATEN.schouder.z), 0).pos
}

/** Het linker heupgewricht in de wereld. */
export function heupIn(h: Houding, r: Romp = romp(h)): Vector3 {
  return kind(r.bekken, new Vector3(MATEN.heupBreedte, 0, 0), 0).pos
}

function lastFrame(o: Oefening3d, h: Houding, r: Romp, schouder: Vector3): Frame {
  if (o.last === 'romp') return kind(r.borst, new Vector3(0, h.lastY, h.lastZ), 0)
  if (o.last === 'bekken') return kind(r.bekken, new Vector3(0, h.lastY, h.lastZ), 0)
  if (o.last === 'hangend') {
    const arm = (MATEN.bovenarm + ARM_GREEP) * HANG_STREK
    const dx = h.greep - schouder.x
    const dz = h.lastZ - schouder.z
    const dy = Math.sqrt(Math.max(0, arm * arm - dx * dx - dz * dz))
    return { pos: new Vector3(0, schouder.y - dy, h.lastZ), rot: new Quaternion() }
  }
  return { pos: new Vector3(0, h.lastY, h.lastZ), rot: new Quaternion() }
}

function voetFrame(o: Oefening3d, h: Houding, zijde: number): Frame {
  const rechts = zijde < 0
  const eigen = rechts && o.enkelRechts !== undefined
  const voet = rechts && o.voetRechts ? o.voetRechts : o.voet
  const kanteling = voet.kanteling + h.voetKantel + (rechts ? h.stapKantel : 0)
  const rot = new Quaternion().setFromEuler(new Euler(kanteling * GRAAD, voet.uitdraai * GRAAD * zijde, (voet.rol ?? 0) * GRAAD * zijde, 'YXZ'))
  const basis = eigen && o.enkelRechts ? v(o.enkelRechts) : v(o.enkel, zijde)
  const pos = basis.add(new Vector3(0, h.voetY + (rechts ? h.stapY : 0), h.voetZ + (rechts ? h.stapZ : 0)))
  return { pos, rot }
}

/** Handmodus per kant (index 0 = links). */
export function handModus(o: Oefening3d, i: number): HandModus {
  return i === 1 && o.handenRechts ? o.handenRechts : o.handen
}

/** Polsdraai van een hand in graden: `draai`, rechts plus `draaiRechts`. */
export function polsDraai(h: Houding, i: number): number {
  return h.draai + (i === 1 ? h.draaiRechts : 0)
}

/**
 * De as van de greep (pink-kant, lokaal x) voordat de pols draait. Wereldrichting
 * voor links, voor rechts gespiegeld (de handen zijn elkaars spiegelbeeld), of
 * de as van de last (stang: beide handen dezelfde as).
 */
function greepAs(o: Oefening3d, arm: Ledemaat, last: Frame, zijde: number): Vector3 {
  if (o.greepAnatomisch) return arm.vlak.clone()
  if (!o.greepRichting) return X.clone().applyQuaternion(last.rot)
  const g = o.greepRichting
  return new Vector3(g.x, g.y * zijde, g.z * zijde).normalize()
}

function handFrame(o: Oefening3d, h: Houding, arm: Ledemaat, last: Frame, i: number): Frame {
  const zijde = ZIJDEN[i]
  const draai = polsDraai(h, i) * GRAAD
  if (handModus(o, i) === 'plat') {
    // Plat op een vlak: vingers naar voren (+z), handpalm naar beneden; de draai
    // zet de vingers om de verticale as naar buiten (positief) of binnen.
    const rot = new Quaternion().setFromAxisAngle(Y, draai * zijde).multiply(new Quaternion().setFromAxisAngle(X, Math.PI / 2))
    return { pos: arm.eind.clone(), rot }
  }
  const lengte = arm.eind.clone().sub(arm.midden).normalize()
  const as = greepAs(o, arm, last, zijde)
  if (Math.abs(as.dot(lengte)) > 0.98) as.copy(X)
  const x = as.sub(lengte.clone().multiplyScalar(as.dot(lengte))).normalize()
  // Supinatie draait de linkerhand negatief om de onderarm, de rechter positief.
  if (draai !== 0) x.applyAxisAngle(lengte, -draai * zijde)
  const z = new Vector3().crossVectors(x, lengte)
  const rot = new Quaternion().setFromRotationMatrix(new Matrix4().makeBasis(x, lengte, z))
  return { pos: arm.eind.clone(), rot }
}

function heupbuiging(bekken: Frame, been: Ledemaat): number {
  const dij = been.midden.clone().sub(been.begin).applyQuaternion(bekken.rot.clone().invert())
  return Math.atan2(dij.z, -dij.y) / GRAAD
}

/** Buigrichting van knie of elleboog: links zoals gegeven, rechts gespiegeld of een eigen wereldrichting. */
function buigRichting(links: Vec3, rechts: Vec3 | undefined, i: number): Vector3 {
  if (i === 1 && rechts) return v(rechts)
  return v(links, ZIJDEN[i])
}

/**
 * Waar de handen heen reiken: links op `greep` langs de as van de last, rechts
 * gespiegeld plus de eigen verschuiving (handRechtsX, -Y, -Z).
 */
function handDoelenBij(h: Houding, last: Frame): Paar<Vector3> {
  const as = X.clone().applyQuaternion(last.rot)
  const links = last.pos.clone().addScaledVector(as, h.greep)
  const rechts = last.pos.clone().addScaledVector(as, -h.greep).add(new Vector3(h.handRechtsX, h.handRechtsY, h.handRechtsZ))
  return [links, rechts]
}

/** De punten waar beide handen heen reiken (index 0 = links), voor bouwstenen. */
export function handDoelen(o: Oefening3d, h: Houding): Paar<Vector3> {
  const r = romp(h, o.blik)
  return handDoelenBij(h, lastFrame(o, h, r, schouderIn(h, r)))
}

/** Het hele figuur in een houding. */
export function figuurIn(o: Oefening3d, h: Houding): Figuur {
  const r = romp(h, o.blik)
  const schouders = ZIJDEN.map(
    (z) => kind(r.borst, new Vector3(MATEN.schouder.x * z, MATEN.schouder.y + h.schouders, MATEN.schouder.z), 0).pos,
  )
  const last = lastFrame(o, h, r, schouders[0])
  const doelen = handDoelenBij(h, last)
  const voeten = ZIJDEN.map((z) => voetFrame(o, h, z)) as unknown as Paar<Frame>
  const benen = ZIJDEN.map((z, i) => {
    const heup = kind(r.bekken, new Vector3(MATEN.heupBreedte * z, 0, 0), 0).pos
    return tweeBotten(heup, voeten[i].pos, MATEN.dij, MATEN.scheen, buigRichting(o.knieRichting, o.knieRichtingRechts, i))
  }) as unknown as Paar<Ledemaat>
  const armen = ZIJDEN.map((z, i) => {
    const schouder = schouders[i]
    const plat = handModus(o, i) === 'plat'
    const pool = buigRichting(o.elleboogRichting, o.elleboogRichtingRechts, i)
    if (h.elleboog) pool.applyAxisAngle(doelen[i].clone().sub(schouder).normalize(), h.elleboog * GRAAD * z)
    const arm = (doel: Vector3) => tweeBotten(schouder, doel, MATEN.bovenarm, plat ? MATEN.onderarm : ARM_GREEP, pool)
    if (plat) return arm(doelen[i])
    // De onderarm wijst naar het midden van de vuist, de greep ligt er net voor.
    const eerst = handFrame(o, h, arm(doelen[i]), last, i)
    const palm = new Vector3(0, 0, 1).applyQuaternion(eerst.rot)
    return arm(doelen[i].clone().addScaledVector(palm, -MATEN.greepVoor))
  }) as unknown as Paar<Ledemaat>
  const handen = armen.map((a, i) => {
    const frame = handFrame(o, h, a, last, i)
    if (handModus(o, i) === 'plat') return frame
    return { ...frame, pos: frame.pos.addScaledVector(new Vector3(0, 0, 1).applyQuaternion(frame.rot), MATEN.greepVoor) }
  }) as unknown as Paar<Frame>
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
