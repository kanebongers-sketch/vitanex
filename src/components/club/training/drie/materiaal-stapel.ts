// ─── Fit Factory Club, 3D-oefenbeelden: gewichtsstapel, katrol en kabel ────
// Een echte gewichtsstapel (platen tussen twee verchroomde geleidestangen,
// selectiepen in de accentkleur, rubberen buffers), katrollen met een groef
// en zijplaten, en kabelstukken die per beeld tussen twee punten worden
// gelegd. Het bovenste deel van de stapel gaat precies zo ver omhoog als de
// kabel wordt uitgetrokken.

import { Group, LatheGeometry, Mesh, Quaternion, Vector2, Vector3, type Material } from 'three'
import type { GeoBak } from './vormen'
import { blok, cilinder, legTussen, opX, rekbareBuis, schaduw, voegSamen, type MateriaalMaterialen } from './materiaal-delen'

const PLAAT = 0.026
const TUSSEN = 0.004
const AANTAL = 14
const MEE = 5
const X = new Vector3(1, 0, 0)

export interface Stapel {
  readonly groep: Group
  /** Wereldpunt waar de kabel aan de bovenplaat vastzit (bijgewerkt door `til`). */
  readonly aangrijp: Vector3
  /** Til het bovenste deel van de stapel `lift` meter op. */
  til(lift: number): void
}

/**
 * Gewichtsstapel in een open frame. `plek` is het midden op de vloer, `hoogte`
 * de hoogte van het frame, `draai` de draaiing om de verticale as (radialen).
 */
export function gewichtsstapel(bak: GeoBak, m: MateriaalMaterialen, plek: Vector3, hoogte: number, draai = 0): Stapel {
  const g = new Group()
  g.position.copy(plek)
  g.rotation.y = draai
  // Frame: twee staanders, kap, voetplaat en een achterpaneel.
  for (const x of [-0.19, 0.19]) g.add(blok(bak, m.frame, [0.07, hoogte, 0.08], [x, hoogte / 2, 0], 0.016))
  g.add(blok(bak, m.frame, [0.47, 0.06, 0.15], [0, hoogte, 0], 0.02))
  g.add(blok(bak, m.frame, [0.5, 0.05, 0.3], [0, 0.025, 0], 0.016))
  g.add(blok(bak, m.kunststof, [0.31, hoogte - 0.12, 0.012], [0, hoogte / 2, -0.07], 0.004))
  for (const x of [-0.095, 0.095]) {
    const stang = cilinder(bak, m.staal, 0.008, hoogte - 0.1, 12)
    stang.position.set(x, hoogte / 2, 0)
    g.add(stang)
    g.add(blok(bak, m.greep, [0.04, 0.035, 0.04], [x, 0.068, 0], 0.01))
  }
  const onder = 0.088
  const vast = AANTAL - MEE
  for (let i = 0; i < vast; i++) g.add(plaat(bak, m.stapel, onder + i * (PLAAT + TUSSEN)))
  // Bewegend deel: bovenste platen, bovenplaat, selectiestang en pen.
  const los = new Group()
  for (let i = vast; i < AANTAL; i++) los.add(plaat(bak, m.stapel, onder + i * (PLAAT + TUSSEN)))
  const top = onder + AANTAL * (PLAAT + TUSSEN)
  los.add(blok(bak, m.frame, [0.27, 0.04, 0.12], [0, top + 0.02, 0], 0.012))
  const kop = cilinder(bak, m.staal, 0.014, 0.04, 16)
  kop.position.set(0, top + 0.06, 0)
  los.add(kop)
  const pen = new Group()
  const steel = cilinder(bak, m.staal, 0.005, 0.09, 10)
  steel.rotation.x = Math.PI / 2
  steel.position.z = 0.06
  const knop = cilinder(bak, m.accent, 0.014, 0.03, 18)
  knop.rotation.x = Math.PI / 2
  knop.position.z = 0.11
  pen.add(steel, knop)
  pen.position.y = onder + vast * (PLAAT + TUSSEN) + PLAAT / 2
  los.add(pen)
  g.add(los)
  const aangrijp = new Vector3()
  const lokaal = new Vector3(0, top + 0.08, 0)
  const draaiQ = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), draai)
  const stapel: Stapel = {
    groep: voegSamen(schaduw(g), bak, false),
    aangrijp,
    til(lift: number) {
      los.position.y = lift
      aangrijp.copy(lokaal).setY(lokaal.y + lift).applyQuaternion(draaiQ).add(plek)
    },
  }
  stapel.til(0)
  return stapel
}

function plaat(bak: GeoBak, mat: Material, y: number): Mesh {
  return blok(bak, mat, [0.25, PLAAT, 0.11], [0, y + PLAAT / 2, 0], 0.006)
}

/** Katrolwiel met groef tussen twee zijplaten. As langs lokaal x. */
export function katrol(bak: GeoBak, m: MateriaalMaterialen, straal = 0.045): Group {
  const g = new Group()
  const r = straal
  const wiel = new Mesh(
    bak.houd(new LatheGeometry([[0.008, -0.012], [r, -0.012], [r, -0.008], [r - 0.008, -0.003], [r - 0.008, 0.003], [r, 0.008], [r, 0.012], [0.008, 0.012]].map(([x, y]) => new Vector2(x, y)), 32)),
    m.staal,
  )
  g.add(opX(wiel))
  for (const x of [-0.019, 0.019]) g.add(blok(bak, m.frame, [0.006, 2 * r + 0.02, 2 * r + 0.02], [x, 0, 0], 0.003))
  const as = opX(cilinder(bak, m.accent, 0.009, 0.05, 12))
  g.add(as)
  return schaduw(g)
}

const basis = new Vector3()
const draaiM = new Quaternion()

/** Zet een katrol zo dat zijn wiel in het vlak van twee kabelrichtingen ligt. */
export function richtKatrol(k: Group, a: Vector3, b: Vector3): void {
  basis.crossVectors(a, b)
  if (basis.lengthSq() < 1e-8) basis.set(1, 0, 0)
  basis.normalize()
  draaiM.setFromUnitVectors(X, basis)
  // Wiel om zijn as draaien heeft geen zichtbaar effect; alleen de as telt.
  k.quaternion.copy(draaiM)
}

/** Een stuk kabel dat per beeld tussen twee punten wordt gelegd. */
export function kabelStuk(bak: GeoBak, m: MateriaalMaterialen, dikte = 0.0042): Mesh & { leg(van: Vector3, naar: Vector3): void } {
  const mesh = rekbareBuis(bak, m.kabel, dikte, 8) as Mesh & { leg(van: Vector3, naar: Vector3): void }
  mesh.castShadow = true
  mesh.leg = (van, naar) => legTussen(mesh, van, naar, true)
  return mesh
}

/** Vaste kabel tussen twee punten. */
export function vasteKabel(bak: GeoBak, m: MateriaalMaterialen, van: Vector3, naar: Vector3): Mesh {
  const k = kabelStuk(bak, m)
  k.leg(van, naar)
  return k
}

/** Draaibare haak met karabiner waar de kabel aan een greep vastzit; aangrijppunt bovenaan. */
export function wartel(bak: GeoBak, m: MateriaalMaterialen): Group {
  const g = new Group()
  const huls = cilinder(bak, m.staal, 0.011, 0.04, 14)
  huls.position.y = 0.02
  g.add(huls)
  const oog = cilinder(bak, m.staal, 0.016, 0.008, 18)
  oog.position.y = 0.045
  g.add(oog)
  return g
}
