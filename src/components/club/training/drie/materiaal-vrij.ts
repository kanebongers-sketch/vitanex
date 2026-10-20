// ─── Fit Factory Club, 3D-oefenbeelden: vrije gewichten ─────────────────────
// Olympische stang met schijven, korte curlstang, dumbbells (los of verticaal
// in beide handen) en een kettlebell.

import { Group, LatheGeometry, Mesh, Quaternion, TorusGeometry, Vector2, Vector3 } from 'three'
import type { Figuur } from '@/lib/club/training/3d/kinematica'
import type { GeoBak } from './vormen'
import { cilinder, opX, OMHOOG, schaduw, schijfVorm, type MateriaalMaterialen, type Zetter } from './materiaal-delen'

export function stang(bak: GeoBak, m: MateriaalMaterialen, schijven: number): Group {
  const g = new Group()
  g.add(opX(cilinder(bak, m.staalMat, 0.0135, 1.32)))
  for (const z of [1, -1]) {
    const huls = opX(cilinder(bak, m.staal, 0.025, 0.42, 24))
    huls.position.x = 0.87 * z
    g.add(huls)
    const kraag = opX(cilinder(bak, m.staal, 0.036, 0.03, 24))
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
    const slot = opX(cilinder(bak, m.accent, 0.034, 0.028, 24))
    slot.position.x = (x + 0.016) * z
    g.add(slot)
  }
  return schaduw(g)
}

/** Korte vaste stang voor curls: 1,2 m met kleine schijven. */
export function curlStang(bak: GeoBak, m: MateriaalMaterialen): Group {
  const g = new Group()
  g.add(opX(cilinder(bak, m.staalMat, 0.0125, 1.0)))
  for (const z of [1, -1]) {
    const s = opX(new Mesh(schijfVorm(bak, 0.13, 0.04), m.schijf))
    s.position.x = 0.44 * z
    g.add(s)
    const kraag = opX(cilinder(bak, m.accent, 0.03, 0.022, 20))
    kraag.position.x = 0.405 * z
    g.add(kraag)
    const eind = opX(cilinder(bak, m.staal, 0.022, 0.06, 20))
    eind.position.x = 0.49 * z
    g.add(eind)
  }
  return schaduw(g)
}

/** Een dumbbell, as langs x. `maat` 1 is ongeveer 10 kg. */
export function halter(bak: GeoBak, m: MateriaalMaterialen, maat = 1): Group {
  const g = new Group()
  g.add(opX(cilinder(bak, m.staalMat, 0.016, 0.15, 16)))
  for (const z of [1, -1]) {
    const kop = opX(cilinder(bak, m.schijf, 0.062, 0.075, 6))
    kop.position.x = 0.11 * z
    kop.rotation.x = Math.PI / 6
    g.add(kop)
    const ring = opX(cilinder(bak, m.accent, 0.03, 0.012, 20))
    ring.position.x = 0.068 * z
    g.add(ring)
  }
  g.scale.setScalar(maat)
  return schaduw(g)
}

/** Kettlebell: bol met platte onderkant en een handvat, handvat in de oorsprong. */
export function kettlebell(bak: GeoBak, m: MateriaalMaterialen): Group {
  const g = new Group()
  const profiel = [
    [0.001, -0.205], [0.06, -0.205], [0.085, -0.195], [0.108, -0.17], [0.118, -0.13],
    [0.112, -0.09], [0.095, -0.06], [0.07, -0.045], [0.001, -0.04],
  ].map(([x, y]) => new Vector2(x, y))
  g.add(new Mesh(bak.houd(new LatheGeometry(profiel, 40)), m.schijf))
  const handvat = new Mesh(bak.houd(new TorusGeometry(0.06, 0.012, 12, 32, Math.PI)), m.staalMat)
  handvat.position.y = -0.06
  g.add(handvat)
  const band = cilinder(bak, m.accent, 0.1135, 0.012, 40)
  band.position.y = -0.12
  g.add(band)
  return schaduw(g)
}

const tijdelijk = new Vector3()
const draai = new Quaternion()

/** Een dumbbell in elke hand, mee met de stand van de hand. */
export function zetHalters(paar: readonly Group[]): Zetter {
  return (f: Figuur) => paar.forEach((d, i) => {
    d.position.copy(f.handen[i].pos)
    d.quaternion.copy(f.handen[i].rot)
  })
}

/** Een dumbbell verticaal in beide handen (goblet, extensie boven het hoofd). */
export function zetHalterStaand(d: Group): Zetter {
  return (f: Figuur) => {
    // As van de halter: langs de y van de last (borst bij goblet, wereld bij extensie).
    tijdelijk.copy(OMHOOG).applyQuaternion(f.last.rot)
    draai.setFromUnitVectors(new Vector3(1, 0, 0), tijdelijk)
    d.quaternion.copy(draai)
    // Handen onder de bovenste kop: het midden zit iets lager dan de handen.
    d.position.copy(f.handen[0].pos).add(f.handen[1].pos).multiplyScalar(0.5).addScaledVector(tijdelijk, -0.07)
  }
}

/** De kettlebell hangt in het verlengde van de armen. */
export function zetKettlebell(k: Group): Zetter {
  return (f: Figuur) => {
    const midden = tijdelijk.copy(f.handen[0].pos).add(f.handen[1].pos).multiplyScalar(0.5)
    k.position.copy(midden)
    const schouder = f.armen[0].begin.clone().add(f.armen[1].begin).multiplyScalar(0.5)
    const neer = midden.clone().sub(schouder).normalize()
    draai.setFromUnitVectors(new Vector3(0, -1, 0), neer)
    k.quaternion.copy(draai)
  }
}
