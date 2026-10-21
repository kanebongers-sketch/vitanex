// ─── Fit Factory Club, 3D-oefenbeelden: EZ-curlstang ────────────────────────
// Een EZ-stang van 1,2 m: recht middenstuk, dan per kant een binnenste en een
// buitenste schuine greep (de W-knik, 10 tot 20 graden), recht stuk naar
// de kraag en een korte huls met een kleine schijf. De knik ligt in het vlak
// loodrecht op de onderarmen, zodat de handen de schuine grepen half
// gedraaid vasthouden; de stang draait mee met de onderarmen tijdens de curl.

import { Group, Matrix4, Vector3 } from 'three'
import type { Figuur } from '@/lib/club/training/3d/kinematica'
import type { GeoBak } from './vormen'
import { buisPad, cilinder, legTussen, opX, schaduw, type MateriaalMaterialen, type Stuk } from './materiaal-delen'
import { losseSchijf } from './materiaal-vrij'

/** Profiel van een helft: [x, knik naar de handrug] in meter. */
const PROFIEL: readonly (readonly [number, number])[] = [
  [0, 0],
  [0.045, 0],
  [0.12, 0.026],
  [0.25, 0],
  [0.43, 0],
]

const STRAAL = 0.0135
const HULS = { van: 0.42, tot: 0.6, straal: 0.025 } as const

/** De knik (lokaal z) op afstand x van het midden. */
export function ezKnik(x: number): number {
  const a = Math.abs(x)
  for (let i = 1; i < PROFIEL.length; i++) {
    const [x0, z0] = PROFIEL[i - 1]
    const [x1, z1] = PROFIEL[i]
    if (a <= x1) return z0 + ((z1 - z0) * (a - x0)) / (x1 - x0)
  }
  return 0
}

function stangVorm(bak: GeoBak, m: MateriaalMaterialen): Group {
  const g = new Group()
  const punten = [...PROFIEL].reverse().map(([x, z]) => new Vector3(-x, 0, z))
  for (const [x, z] of PROFIEL.slice(1)) punten.push(new Vector3(x, 0, z))
  g.add(buisPad(bak, m.staalMat, punten, STRAAL, 0.018))
  for (const kant of [1, -1]) {
    // Knurling op beide schuine grepen.
    for (let i = 1; i <= 2; i++) {
      const [x0, z0] = PROFIEL[i]
      const [x1, z1] = PROFIEL[i + 1]
      const van = new Vector3(kant * (x0 + (x1 - x0) * 0.18), 0, z0 + (z1 - z0) * 0.18)
      const naar = new Vector3(kant * (x0 + (x1 - x0) * 0.82), 0, z0 + (z1 - z0) * 0.82)
      const k = cilinder(bak, m.knurl, STRAAL + 0.0008, van.distanceTo(naar), 18)
      legTussen(k, van, naar)
      g.add(k)
    }
    // Kraag, huls met schijf en sluiting, eindkap.
    const kraag = opX(cilinder(bak, m.accent, 0.032, 0.02, 24))
    kraag.position.x = kant * (HULS.van - 0.01)
    const huls = opX(cilinder(bak, m.staal, HULS.straal, HULS.tot - HULS.van, 24))
    huls.position.x = (kant * (HULS.van + HULS.tot)) / 2
    const schijf = opX(losseSchijf(bak, m, 2, 0.14))
    const dikte = schijf.userData.dikte as number
    schijf.position.x = kant * (HULS.van + 0.012 + dikte / 2)
    const sluiting = opX(cilinder(bak, m.greep, 0.034, 0.024, 20))
    sluiting.position.x = kant * (HULS.van + 0.012 + dikte + 0.014)
    const kap = opX(cilinder(bak, m.staal, HULS.straal + 0.002, 0.008, 24))
    kap.position.x = kant * (HULS.tot - 0.004)
    g.add(kraag, huls, schijf, sluiting, kap)
  }
  return schaduw(g)
}

/** De EZ-stang in de handen: knik loodrecht op de onderarmen, grepen precies in de vuisten. */
export function ezStang(bak: GeoBak, m: MateriaalMaterialen): Stuk {
  const g = stangVorm(bak, m)
  const x = new Vector3(1, 0, 0)
  const y = new Vector3()
  const z = new Vector3()
  const basis = new Matrix4()
  return {
    groep: g,
    zet(f: Figuur) {
      y.set(0, 1, 0).applyQuaternion(f.handen[0].rot).setX(0)
      if (y.lengthSq() < 1e-8) y.set(0, -1, 0)
      y.normalize()
      z.crossVectors(x, y)
      g.quaternion.setFromRotationMatrix(basis.makeBasis(x, y, z))
      const knik = ezKnik(f.handen[0].pos.x - f.last.pos.x)
      g.position.copy(f.last.pos).addScaledVector(z, -knik)
    },
  }
}
