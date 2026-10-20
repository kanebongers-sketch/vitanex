// ─── Fit Factory Club, 3D-oefenbeelden: het figuur ───────────────────────────
// Een glad, neutraal figuur uit afgeronde vormen. Elk deel hangt aan een frame
// uit de kinematica (bekken, lende, borst, hoofd) of wordt tussen twee
// gewrichtspunten gelegd (dij, scheen, bovenarm, onderarm).

import { Group, Mesh, Quaternion, Vector3, type Color, type Material } from 'three'
import type { Figuur, Frame, Ledemaat } from '@/lib/club/training/3d/kinematica'
import { MATEN } from '@/lib/club/training/3d/maten'
import type { HandModus, Lichaamsdeel } from '@/lib/club/training/3d/typen'
import { bouwRomp } from './romp'
import type { GeoBak, Profiel } from './vormen'

export interface FiguurMaterialen {
  /** Materiaal met vertexkleuren voor de romp. */
  readonly romp: Material
  readonly kleuren: { readonly huid: Color; readonly kleding: Color; readonly accent: Color }
  readonly huid: Material
  readonly spier: Material
  readonly kleding: Material
  readonly schoen: Material
  readonly haar: Material
}

const Y = new Vector3(0, 1, 0)

const DIJ: Profiel = [[0, 0.084], [0.18, 0.083], [0.55, 0.07], [0.85, 0.056], [1, 0.05]]
const BROEK: Profiel = [[0, 0.09], [0.5, 0.084], [1, 0.077]]
const SCHEEN: Profiel = [[0, 0.05], [0.2, 0.055], [0.45, 0.047], [0.8, 0.033], [1, 0.031]]
const BOVENARM: Profiel = [[0, 0.05], [0.35, 0.047], [0.75, 0.04], [1, 0.036]]
const ONDERARM: Profiel = [[0, 0.037], [0.22, 0.04], [0.7, 0.03], [1, 0.026]]

type Ouder = 'bekken' | 'lende' | 'borst' | 'hoofd' | 'wereld'

function ellips(bak: GeoBak, m: Material, pos: [number, number, number], straal: [number, number, number]): Mesh {
  const mesh = new Mesh(bak.bol(), m)
  mesh.position.set(...pos)
  mesh.scale.set(...straal)
  return mesh
}

function schaduw<T extends Mesh>(m: T): T {
  m.castShadow = true
  m.receiveShadow = true
  return m
}

/** Een groep die met een frame meebeweegt. */
function frameGroep(): Group {
  const g = new Group()
  g.matrixAutoUpdate = true
  return g
}

function zetFrame(g: Group, f: Frame): void {
  g.position.copy(f.pos)
  g.quaternion.copy(f.rot)
}

const tijdelijk = new Vector3()
const draai = new Quaternion()

function tussen(mesh: Mesh, van: Vector3, naar: Vector3): void {
  mesh.position.copy(van)
  tijdelijk.copy(naar).sub(van).normalize()
  draai.setFromUnitVectors(Y, tijdelijk)
  mesh.quaternion.copy(draai)
}

export interface FiguurMeshes {
  readonly groep: Group
  zet(f: Figuur): void
}

export function bouwFiguur(
  bak: GeoBak,
  m: FiguurMaterialen,
  spieren: readonly Lichaamsdeel[],
  handModus: HandModus,
): FiguurMeshes {
  const kies = (deel: Lichaamsdeel, anders: Material = m.huid) => (spieren.includes(deel) ? m.spier : anders)
  const groep = new Group()
  const bekken = frameGroep()
  const lende = frameGroep()
  const borst = frameGroep()
  const hoofd = frameGroep()
  groep.add(bekken, lende, borst, hoofd)
  const ouders: Record<Ouder, Group> = { bekken, lende, borst, hoofd, wereld: groep }
  const voeg = (ouder: Ouder, mesh: Mesh) => {
    ouders[ouder].add(schaduw(mesh))
    return mesh
  }

  // Romp als doorlopende huid, schouders als losse ronde spieren
  const romp = bouwRomp({
    huid: m.kleuren.huid,
    kleding: m.kleuren.kleding,
    accent: m.kleuren.accent,
    romp: spieren.includes('romp'),
    borst: spieren.includes('borst'),
    rug: spieren.includes('rug'),
    bil: spieren.includes('bil'),
  })
  voeg('wereld', new Mesh(bak.houd(romp.geometrie), m.romp)).frustumCulled = false
  for (const z of [1, -1]) {
    voeg('borst', ellips(bak, kies('schouder'), [(MATEN.schouder.x + 0.008) * z, MATEN.schouder.y - 0.012, MATEN.schouder.z], [0.058, 0.064, 0.062]))
  }
  // Nek en hoofd
  const nek = voeg('hoofd', new Mesh(bak.spoel([[0, 0.05], [1, 0.044]], 0.1), m.huid))
  nek.position.set(0, -0.02, -0.005)
  voeg('hoofd', ellips(bak, m.huid, [0, 0.158, 0.012], [0.08, 0.104, 0.096]))
  voeg('hoofd', ellips(bak, m.huid, [0, 0.112, 0.03], [0.062, 0.06, 0.07]))
  voeg('hoofd', ellips(bak, m.haar, [0, 0.185, -0.012], [0.084, 0.086, 0.094]))
  for (const z of [1, -1]) voeg('hoofd', ellips(bak, m.huid, [0.079 * z, 0.148, -0.004], [0.013, 0.027, 0.02]))

  // Ledematen: per zijde dij (met broekspijp), scheen, voet, bovenarm, onderarm, hand
  const dijen = [0, 1].map(() => voeg('wereld', new Mesh(bak.spoel(DIJ, MATEN.dij), kies('dij'))))
  const pijpen = [0, 1].map(() => voeg('wereld', new Mesh(bak.spoel(BROEK, MATEN.dij * 0.38), m.kleding)))
  const schenen = [0, 1].map(() => voeg('wereld', new Mesh(bak.spoel(SCHEEN, MATEN.scheen), kies('kuit'))))
  const bovenarmen = [0, 1].map(() => voeg('wereld', new Mesh(bak.spoel(BOVENARM, MATEN.bovenarm), kies('bovenarm'))))
  const onderarmen = [0, 1].map(() => voeg('wereld', new Mesh(bak.spoel(ONDERARM, MATEN.onderarm), kies('onderarm'))))
  const voeten = [0, 1].map(() => {
    const g = new Group()
    g.add(schaduw(ellips(bak, m.schoen, [0, -0.046, 0.058], [0.05, 0.036, 0.128])))
    g.add(schaduw(ellips(bak, m.schoen, [0, -0.03, -0.01], [0.046, 0.05, 0.06])))
    g.add(schaduw(ellips(bak, m.huid, [0, 0.0, 0.0], [0.04, 0.045, 0.042])))
    groep.add(g)
    return g
  })
  const handen = [1, -1].map((zijde) => {
    const g = new Group()
    if (handModus === 'plat') {
      g.add(schaduw(ellips(bak, m.huid, [0, 0.065, 0.016], [0.044, 0.07, 0.019])))
      g.add(schaduw(ellips(bak, m.huid, [-0.045 * zijde, 0.035, 0.016], [0.014, 0.034, 0.014])))
      g.add(schaduw(ellips(bak, m.huid, [0, 0.0, 0.0], [0.03, 0.03, 0.024])))
    } else {
      // Vuist om de stang: knokkels, duim aan de binnenkant, pols
      g.add(schaduw(ellips(bak, m.huid, [0, 0.0, 0.0], [0.045, 0.05, 0.036])))
      g.add(schaduw(ellips(bak, m.huid, [0, 0.03, 0.012], [0.042, 0.022, 0.03])))
      g.add(schaduw(ellips(bak, m.huid, [-0.04 * zijde, -0.012, 0.022], [0.016, 0.03, 0.017])))
      g.add(schaduw(ellips(bak, m.huid, [0, -0.06, 0.0], [0.03, 0.03, 0.024])))
    }
    groep.add(g)
    return g
  })

  const zetBeen = (b: Ledemaat, i: number) => {
    tussen(dijen[i], b.begin, b.midden)
    tussen(pijpen[i], b.begin, b.midden)
    tussen(schenen[i], b.midden, b.eind)
  }
  const zetArm = (a: Ledemaat, i: number) => {
    tussen(bovenarmen[i], a.begin, a.midden)
    const pols = handModus === 'plat'
      ? a.eind
      : a.eind.clone().sub(a.midden).normalize().multiplyScalar(-MATEN.hand).add(a.eind)
    tussen(onderarmen[i], a.midden, pols)
  }

  return {
    groep,
    zet(f: Figuur) {
      romp.zet(f)
      zetFrame(bekken, f.bekken)
      zetFrame(lende, f.lende)
      zetFrame(borst, f.borst)
      zetFrame(hoofd, f.hoofd)
      f.benen.forEach(zetBeen)
      f.armen.forEach(zetArm)
      f.voeten.forEach((v, i) => zetFrame(voeten[i], v))
      f.handen.forEach((h, i) => zetFrame(handen[i], h))
    },
  }
}
