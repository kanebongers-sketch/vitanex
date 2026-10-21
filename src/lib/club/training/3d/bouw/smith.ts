// ─── Fit Factory Club, 3D-oefenbeelden: bouwsteen smith machine (PUUR) ──────
// Drukken in de smith machine: de stang loopt over geleidestangen, dus de baan
// is recht omhoog en omlaag. De bank ligt zo dat de stang op de juiste plek van
// de borst uitkomt (middenborst plat, bovenste borst schuin). Bovenin zijn de
// armen gestrekt maar niet op slot; onderin raakt de stang de borst bijna.

import { schouderIn } from '../kinematica'
import { ARM_GREEP, MATEN } from '../maten'
import type { Camera, Houding, Lichaamsdeel, Materiaal, Oefening3d, Vec3 } from '../typen'
import { houding, lus, metMoment, TEMPO, type Tempo } from './basis'

export interface SmithOpties {
  readonly naam: string
  /** Romp op de bank, inclusief `greep` (halve afstand tussen de handen). */
  readonly romp: Partial<Houding>
  /** Z van de stang: de geleiding loopt recht, de bank bepaalt waar hij uitkomt. */
  readonly stangZ: number
  /** Hoogte van de stang onderin, net boven de borst. */
  readonly onderY: number
  /** Hoe ver de armen bovenin strekken (fractie van de armlengte, net niet op slot). */
  readonly strek?: number
  readonly bank: Materiaal
  readonly schijven?: number
  readonly enkel: Vec3
  readonly voet: { readonly kanteling: number; readonly uitdraai: number }
  readonly knieRichting: Vec3
  readonly elleboogRichting: Vec3
  readonly spieren: readonly Lichaamsdeel[]
  readonly spierenSecundair?: readonly Lichaamsdeel[]
  readonly camera: Camera
  readonly tempo?: Tempo
}

/** Hoogte van de stang met (bijna) gestrekte armen recht boven `stangZ`. */
export function smithBovenY(romp: Houding, stangZ: number, strek: number): number {
  const s = schouderIn(romp)
  const arm = (MATEN.bovenarm + ARM_GREEP) * strek
  const dx = romp.greep - s.x
  const dz = stangZ - s.z
  return s.y + Math.sqrt(arm * arm - dx * dx - dz * dz)
}

export function smithDrukken(op: SmithOpties): Oefening3d {
  const romp = houding(op.romp)
  const boven = smithBovenY(romp, op.stangZ, op.strek ?? 0.985)
  const maak = (p: { y: number }) => ({ ...romp, lastY: p.y, lastZ: op.stangZ })
  const o: Oefening3d = {
    naam: op.naam,
    sleutels: lus({ y: boven }, { y: op.onderY }, maak, op.tempo ?? TEMPO.zakken, 1),
    last: 'wereld',
    handen: 'greep',
    enkel: op.enkel,
    voet: op.voet,
    knieRichting: op.knieRichting,
    elleboogRichting: op.elleboogRichting,
    materiaal: [
      { soort: 'smith', plek: { x: 0, y: 0, z: op.stangZ } },
      { soort: 'stang', schijven: op.schijven ?? 1 },
      op.bank,
    ],
    spieren: op.spieren,
    ...(op.spierenSecundair ? { spierenSecundair: op.spierenSecundair } : {}),
    camera: op.camera,
  }
  return metMoment(o)
}
