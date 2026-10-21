// ─── Fit Factory Club, 3D-oefenbeelden: doorzicht door schijven ─────────────
// Een grote schijf aan de kant van de camera kan het lichaam afdekken (stang op
// de rug in 3/4-aanzicht, bankdrukken van opzij). Dan wordt die schijf
// doorzichtig, zodat de houding leesbaar blijft. Werkt vanzelf voor elk
// camerastandpunt: per beeld kijken we of de lijn van de camera naar romp,
// hoofd of knieen door de schijf gaat.

import { Box3, Mesh, Ray, Vector3, type Group, type Material, type Object3D } from 'three'
import type { Figuur } from '@/lib/club/training/3d/kinematica'
import type { StangKant } from './materiaal-vrij'

/** Gedeeld met de scene: waar de camera staat. */
export interface Zicht {
  readonly oog: Vector3
}

/** Zichtbaarheid van een afdekkende schijf (0 tot 1). */
export const DOORZICHT = 0.26

const as = new Vector3()
const midden = new Vector3()
const naar = new Vector3()
const raak = new Vector3()

/** Kleinste afstand (in schijfstralen) waarop de lijn oog naar lichaamspunt het schijfvlak raakt. */
function dekking(oog: Vector3, punten: readonly Vector3[], straal: number): number {
  let kleinste = Infinity
  for (const p of punten) {
    naar.copy(p).sub(oog)
    const noemer = as.dot(naar)
    if (Math.abs(noemer) < 1e-6) continue
    const t = as.dot(raak.copy(midden).sub(oog)) / noemer
    if (t <= 0.02 || t >= 0.97) continue
    raak.copy(oog).addScaledVector(naar, t)
    kleinste = Math.min(kleinste, raak.distanceTo(midden) / straal)
  }
  return kleinste
}

function lichaamspunten(f: Figuur): Vector3[] {
  return [f.hoofd.pos, f.borst.pos, f.lende.pos, f.bekken.pos, f.benen[0].midden, f.benen[1].midden, f.armen[0].midden, f.armen[1].midden]
}

/** Maak de schijven van een stangkant doorzichtig als ze het lichaam afdekken. */
export function zetDoorzicht(stang: Group, kanten: readonly StangKant[], f: Figuur, zicht: Zicht): void {
  const punten = lichaamspunten(f)
  as.set(1, 0, 0).applyQuaternion(stang.quaternion)
  for (const kant of kanten) {
    midden.copy(kant.midden).applyQuaternion(stang.quaternion).add(stang.position)
    const d = dekking(zicht.oog, punten, kant.straal)
    // Zachte overgang: volledig zichtbaar als de lijn net buiten de rand valt.
    const s = Math.min(1, Math.max(0, (d - 0.72) / 0.36))
    const zichtbaar = DOORZICHT + (1 - DOORZICHT) * s * s * (3 - 2 * s)
    for (const m of kant.materialen) {
      m.opacity = zichtbaar
      m.depthWrite = zichtbaar > 0.98
    }
    kant.groep.traverse((o) => {
      if (o.userData.opdruk) o.visible = zichtbaar > 0.9
    })
  }
}

// ── Grote vaste delen (kolom, stapeltoren) ──────────────────────────────────

/** Een groot vast stuk materiaal dat doorzichtig wordt als het tussen camera en lichaam staat. */
export interface Afdekker {
  readonly doos: Box3
  readonly materialen: readonly Material[]
}

/**
 * Geef een groep eigen kopieen van zijn materialen (altijd in de doorzichtige
 * laag, zodat vervagen geen nieuwe shader vraagt) en meet zijn ruimte.
 */
export function maakAfdekker(groep: Object3D, kopie: <T extends Material>(m: T) => T): Afdekker {
  const eigen = new Map<Material, Material>()
  groep.traverse((o) => {
    if (!(o instanceof Mesh) || Array.isArray(o.material)) return
    const bron = o.material as Material
    let k = eigen.get(bron)
    if (!k) {
      k = kopie(bron)
      k.transparent = true
      eigen.set(bron, k)
    }
    o.material = k
  })
  groep.updateMatrixWorld(true)
  const doos = new Box3().setFromObject(groep)
  // Iets krimpen: alleen echt afdekken telt, niet langs de rand scheren.
  doos.expandByScalar(-0.03)
  return { doos, materialen: [...eigen.values()] }
}

const straal = new Ray()
const raakpunt = new Vector3()

export function zetAfdekker(a: Afdekker, f: Figuur, zicht: Zicht): void {
  const punten = [f.hoofd.pos, f.borst.pos, f.bekken.pos]
  let bedekt = 0
  for (const p of punten) {
    straal.origin.copy(zicht.oog)
    straal.direction.copy(p).sub(zicht.oog)
    const afstand = straal.direction.length()
    straal.direction.multiplyScalar(1 / afstand)
    const raak = straal.intersectBox(a.doos, raakpunt)
    if (raak && raak.distanceTo(zicht.oog) < afstand - 0.15) bedekt++
  }
  const zichtbaar = bedekt === 0 ? 1 : bedekt === 1 ? 0.55 : DOORZICHT + 0.06
  for (const m of a.materialen) {
    m.opacity = zichtbaar
    m.depthWrite = zichtbaar > 0.98
  }
}
