// ─── Fit Factory Club, 3D-oefenbeelden: banken, verhoging en mat ────────────
// Vlakke bank (met of zonder steunen, ook dwars voor de hip thrust), schuine
// verstelbare bank, bank met rechte rugleuning, verhoging en mat.

import { Group, Vector3 } from 'three'
import type { GeoBak } from './vormen'
import { blok, schaduw, type MateriaalMaterialen } from './materiaal-delen'

const GRAAD = Math.PI / 180

/** Vlakke bank, kussen bovenkant op 0,43 m. `rek`: steunen voor de stang aan het hoofdeinde. */
export function vlakkeBank(bak: GeoBak, m: MateriaalMaterialen, plek: Vector3, rek: boolean, draai = 0): Group {
  const g = new Group()
  g.position.copy(plek)
  g.rotation.y = draai * GRAAD
  g.add(blok(bak, m.kussen, [0.29, 0.075, 1.22], [0, 0.393, 0], 0.03))
  g.add(blok(bak, m.frame, [0.08, 0.05, 1.05], [0, 0.33, 0], 0.01))
  for (const z of [-0.45, 0.45]) {
    g.add(blok(bak, m.frame, [0.06, 0.3, 0.06], [0, 0.17, z], 0.01))
    g.add(blok(bak, m.frame, [0.42, 0.04, 0.07], [0, 0.02, z], 0.01))
  }
  if (rek) {
    for (const x of [-0.56, 0.56]) {
      g.add(blok(bak, m.frame, [0.06, 1.12, 0.06], [x, 0.56, -0.33], 0.01))
      g.add(blok(bak, m.frame, [0.06, 0.04, 0.42], [x, 0.02, -0.4], 0.01))
      g.add(blok(bak, m.accent, [0.07, 0.035, 0.09], [x, 1.03, -0.29], 0.008))
    }
  }
  return schaduw(g)
}

/**
 * Verstelbare bank: zitting voor het scharnier (op `plek`), rugleuning schuin
 * naar achteren op `hoek` graden boven horizontaal.
 */
export function schuineBank(bak: GeoBak, m: MateriaalMaterialen, plek: Vector3, hoek: number): Group {
  const g = new Group()
  g.position.copy(plek)
  const a = hoek * GRAAD
  // Zitting
  const zit = blok(bak, m.kussen, [0.3, 0.07, 0.36], [0, 0.415, 0.19], 0.03)
  zit.rotation.x = -0.08
  g.add(zit)
  // Rugleuning: langs (0, sin a, -cos a) vanaf het scharnier
  const lengte = 0.86
  const rug = blok(bak, m.kussen, [0.29, 0.07, lengte], [0, 0.43 + Math.sin(a) * (lengte / 2 + 0.02), -Math.cos(a) * (lengte / 2 + 0.02)], 0.03)
  rug.rotation.x = a
  g.add(rug)
  // Draagbalk onder de rugleuning en verstelsteun
  const balk = blok(bak, m.frame, [0.06, 0.05, lengte * 0.9], [0, 0.37 + Math.sin(a) * 0.4, -Math.cos(a) * 0.4], 0.01)
  balk.rotation.x = a
  g.add(balk)
  const steun = blok(bak, m.frame, [0.05, 0.05, 0.5], [0, 0.32 + Math.sin(a) * 0.22, -0.32], 0.01)
  steun.rotation.x = -Math.PI / 2 + a * 0.9
  g.add(steun)
  // Onderstel
  g.add(blok(bak, m.frame, [0.08, 0.05, 1.1], [0, 0.06, -0.15], 0.01))
  g.add(blok(bak, m.frame, [0.06, 0.34, 0.06], [0, 0.2, 0.18], 0.01))
  for (const z of [0.36, -0.68]) g.add(blok(bak, m.frame, [0.44, 0.04, 0.07], [0, 0.02, z], 0.01))
  g.add(blok(bak, m.accent, [0.07, 0.025, 0.05], [0, 0.39, -0.02], 0.006))
  return schaduw(g)
}

/** Bank met rechte rugleuning (schouderdrukken, zittende extensie). */
export function rugBank(bak: GeoBak, m: MateriaalMaterialen, plek: Vector3): Group {
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

/** Lage plank onder de voorvoeten (calf raise). */
export function verhoging(bak: GeoBak, m: MateriaalMaterialen, plek: Vector3): Group {
  const g = new Group()
  g.position.copy(plek)
  g.add(blok(bak, m.kussen, [0.62, 0.075, 0.24], [0, 0.0375, 0], 0.012))
  g.add(blok(bak, m.accent, [0.62, 0.006, 0.02], [0, 0.074, 0.11], 0.002))
  return schaduw(g)
}

export function mat(bak: GeoBak, m: MateriaalMaterialen, plek: Vector3): Group {
  const g = new Group()
  g.add(blok(bak, m.mat, [0.66, 0.012, 1.9], [plek.x, 0.006, plek.z], 0.005))
  return schaduw(g)
}
