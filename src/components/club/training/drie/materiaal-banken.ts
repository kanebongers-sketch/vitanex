// ─── Fit Factory Club, 3D-oefenbeelden: banken, rek, verhoging en mat ──────
// Vlakke bank (los of als bankdrukstation met staanders, J-haken en
// veiligheidssteunen), verstelbare schuine bank, bank met hoge rugleuning,
// verhoging en mat. Bekleding met naad en een dikke rand, frames van
// afgeronde rechthoekige buis met rubberen voetdoppen.

import { ExtrudeGeometry, Group, Mesh, Shape, Vector3 } from 'three'
import type { GeoBak } from './vormen'
import { blok, cilinder, opX, schaduw, type MateriaalMaterialen } from './materiaal-delen'

const GRAAD = Math.PI / 180

/** Voet van een bank: ovale buis dwars, met rubberen doppen. */
function voet(bak: GeoBak, m: MateriaalMaterialen, z: number, breedte = 0.46, wieltjes = false): Group {
  const g = new Group()
  g.add(blok(bak, m.frame, [breedte, 0.05, 0.075], [0, 0.03, z], 0.022))
  for (const x of [-1, 1]) {
    g.add(blok(bak, m.greep, [0.05, 0.022, 0.085], [x * (breedte / 2 - 0.02), 0.011, z], 0.008))
    if (wieltjes) {
      const wiel = opX(cilinder(bak, m.greep, 0.034, 0.03, 20))
      wiel.position.set(x * (breedte / 2 + 0.018), 0.036, z)
      g.add(wiel)
    }
  }
  return g
}

/** Kussen met naad: bekleding op een kunststof plaat. Bovenkant op y = 0. */
function kussen(bak: GeoBak, m: MateriaalMaterialen, breedte: number, lengte: number, dikte = 0.075): Group {
  const g = new Group()
  g.add(blok(bak, m.kussen, [breedte, dikte, lengte], [0, -dikte / 2, 0], 0.034))
  g.add(blok(bak, m.kunststof, [breedte - 0.03, 0.014, lengte - 0.03], [0, -dikte - 0.006, 0], 0.005))
  return g
}

/** J-haak van plaatstaal met een kunststof inleg in de accentkleur. Zitvlak op y = 0. */
function jHaak(bak: GeoBak, m: MateriaalMaterialen): Group {
  const vorm = new Shape()
  // Profiel in het vlak (vooruit, omhoog): rugplaat, bodem en voorlip.
  vorm.moveTo(0, 0.13)
  vorm.lineTo(0, -0.025)
  vorm.lineTo(0.12, -0.025)
  vorm.lineTo(0.12, 0.035)
  vorm.lineTo(0.105, 0.035)
  vorm.lineTo(0.105, -0.008)
  vorm.lineTo(0.015, -0.008)
  vorm.lineTo(0.015, 0.13)
  vorm.closePath()
  const geo = bak.houd(new ExtrudeGeometry(vorm, { depth: 0.06, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.003, bevelSegments: 2 }))
  geo.translate(0, 0, -0.03)
  const haak = new Mesh(geo, m.frame)
  haak.rotation.y = -Math.PI / 2
  const g = new Group()
  g.add(haak)
  g.add(blok(bak, m.accent, [0.062, 0.007, 0.088], [0, -0.0045, 0.06], 0.003))
  return g
}

/** Staander met gatenrij, J-haak en veiligheidssteun. `z` is de voorkant van de staander. */
function staander(bak: GeoBak, m: MateriaalMaterialen, x: number, z: number, haakY: number, steunY: number, steunLengte: number): Group {
  const g = new Group()
  const hoogte = 1.3
  const paal = blok(bak, m.gaten, [0.075, hoogte, 0.075], [x, hoogte / 2, z - 0.0375], 0.012)
  g.add(paal)
  g.add(blok(bak, m.frame, [0.085, 0.012, 0.085], [x, hoogte + 0.006, z - 0.0375], 0.005))
  const haak = jHaak(bak, m)
  haak.position.set(x, haakY, z)
  g.add(haak)
  // Veiligheidssteun: buis naar voren met een kunststof strip erop.
  g.add(blok(bak, m.frame, [0.055, 0.055, steunLengte], [x, steunY - 0.03, z + steunLengte / 2], 0.012))
  g.add(blok(bak, m.accent, [0.045, 0.008, steunLengte - 0.03], [x, steunY + 0.001, z + steunLengte / 2 + 0.005], 0.003))
  g.add(blok(bak, m.frame, [0.09, 0.1, 0.09], [x, steunY - 0.03, z - 0.0375], 0.01))
  return g
}

/**
 * Vlakke bank, kussen bovenkant op 0,43 m. `rek`: bankdrukstation met
 * staanders aan het hoofdeinde, J-haken (stang in rust op 1,06 m) en
 * veiligheidssteunen net onder borsthoogte.
 */
export function vlakkeBank(bak: GeoBak, m: MateriaalMaterialen, plek: Vector3, rek: boolean, draai = 0): Group {
  const g = new Group()
  g.position.copy(plek)
  g.rotation.y = draai * GRAAD
  const k = kussen(bak, m, 0.3, 1.2)
  k.position.y = 0.43
  g.add(k)
  // Ruggengraat onder het kussen en twee poten.
  g.add(blok(bak, m.frame, [0.08, 0.055, 1.02], [0, 0.315, 0], 0.02))
  for (const z of [-0.43, 0.43]) {
    const poot = blok(bak, m.frame, [0.075, 0.29, 0.055], [0, 0.18, z], 0.018)
    poot.rotation.x = z > 0 ? -0.08 : 0.08
    g.add(poot)
    g.add(voet(bak, m, z * 1.05, 0.46, z > 0))
  }
  if (rek) {
    const voorkant = -0.16
    for (const x of [-0.56, 0.56]) {
      g.add(staander(bak, m, x, voorkant, 1.046, 0.63, 0.5))
      g.add(blok(bak, m.frame, [0.1, 0.05, 0.7], [x, 0.025, voorkant - 0.08], 0.018))
      g.add(blok(bak, m.greep, [0.1, 0.012, 0.05], [x, 0.006, voorkant + 0.25], 0.004))
    }
    g.add(blok(bak, m.frame, [1.12, 0.06, 0.06], [0, 0.06, voorkant - 0.38], 0.018))
    g.add(blok(bak, m.frame, [0.06, 0.05, 0.46], [0, 0.04, voorkant - 0.2], 0.015))
  }
  return schaduw(g)
}

interface VerstelOpties {
  /** Hoek van de rugleuning boven horizontaal (graden). */
  readonly hoek: number
  /** Plek van het scharnier ten opzichte van de bank, bovenkant kussen. */
  readonly scharnier: Vector3
  readonly rugLengte: number
  readonly zitDiepte: number
  readonly zitHoogte: number
}

/** Verstelbare bank: zitting voor het scharnier, rugleuning schuin naar achteren. */
function verstelBank(bak: GeoBak, m: MateriaalMaterialen, plek: Vector3, o: VerstelOpties): Group {
  const g = new Group()
  g.position.copy(plek)
  const a = o.hoek * GRAAD
  const s = o.scharnier
  const zit = kussen(bak, m, 0.31, o.zitDiepte, 0.07)
  zit.position.set(0, o.zitHoogte, s.z + o.zitDiepte / 2 + 0.01)
  zit.rotation.x = -0.06
  g.add(zit)
  // Rugleuning: langs (0, sin a, -cos a) vanaf het scharnier, het kussen ligt ervoor.
  const rug = kussen(bak, m, 0.29, o.rugLengte, 0.075)
  const langs = new Vector3(0, Math.sin(a), -Math.cos(a))
  rug.position.copy(s).addScaledVector(langs, o.rugLengte / 2 + 0.015)
  rug.rotation.x = a
  g.add(rug)
  // Draagbalk achter de rugleuning en de ladder die hem steunt.
  const normaal = new Vector3(0, Math.cos(a), Math.sin(a))
  const balk = blok(bak, m.frame, [0.06, 0.05, o.rugLengte * 0.82], [0, 0, 0], 0.018)
  balk.position.copy(s).addScaledVector(langs, o.rugLengte * 0.45).addScaledVector(normaal, -0.11)
  balk.rotation.x = a
  g.add(balk)
  const steunVan = s.clone().addScaledVector(langs, o.rugLengte * 0.55).addScaledVector(normaal, -0.13)
  const steunNaar = new Vector3(0, 0.09, s.z - 0.5)
  const steun = blok(bak, m.frame, [0.05, 0.05, steunVan.distanceTo(steunNaar)], [0, 0, 0], 0.016)
  steun.position.copy(steunVan).add(steunNaar).multiplyScalar(0.5)
  steun.quaternion.setFromUnitVectors(new Vector3(0, 0, 1), steunNaar.clone().sub(steunVan).normalize())
  g.add(steun)
  // Ruggengraat op de vloer, zitpaal en twee voeten.
  g.add(blok(bak, m.frame, [0.085, 0.06, 1.05], [0, 0.07, s.z - 0.2], 0.022))
  g.add(blok(bak, m.frame, [0.07, o.zitHoogte - 0.14, 0.06], [0, (o.zitHoogte - 0.14) / 2 + 0.08, s.z + 0.12], 0.018))
  g.add(voet(bak, m, s.z + 0.33, 0.46, true), voet(bak, m, s.z - 0.72, 0.5))
  g.add(blok(bak, m.accent, [0.07, 0.022, 0.05], [0, s.y - 0.07, s.z - 0.02], 0.006))
  return schaduw(g)
}

/** Schuine verstelbare bank, scharnier op `plek` op 0,43 m. */
export function schuineBank(bak: GeoBak, m: MateriaalMaterialen, plek: Vector3, hoek: number): Group {
  return verstelBank(bak, m, plek, { hoek, scharnier: new Vector3(0, 0.43, 0), rugLengte: 0.86, zitDiepte: 0.36, zitHoogte: 0.45 })
}

/** Bank met (bijna) rechte, hoge rugleuning: schouderdrukken en zittende extensie. */
export function rugBank(bak: GeoBak, m: MateriaalMaterialen, plek: Vector3): Group {
  return verstelBank(bak, m, plek, { hoek: 86, scharnier: new Vector3(0, 0.47, -0.13), rugLengte: 0.88, zitDiepte: 0.38, zitHoogte: 0.465 })
}

/** Lage plank onder de voorvoeten (calf raise). */
export function verhoging(bak: GeoBak, m: MateriaalMaterialen, plek: Vector3): Group {
  const g = new Group()
  g.position.copy(plek)
  g.add(blok(bak, m.frame, [0.62, 0.06, 0.24], [0, 0.03, 0], 0.012))
  g.add(blok(bak, m.mat, [0.6, 0.016, 0.22], [0, 0.068, 0], 0.006))
  g.add(blok(bak, m.accent, [0.6, 0.006, 0.014], [0, 0.074, 0.112], 0.002))
  return schaduw(g)
}

export function mat(bak: GeoBak, m: MateriaalMaterialen, plek: Vector3): Group {
  const g = new Group()
  const vlak = blok(bak, m.mat, [0.66, 0.014, 1.9], [plek.x, 0.007, plek.z], 0.007)
  vlak.castShadow = false
  g.add(vlak)
  g.traverse((o) => {
    if (o instanceof Mesh) o.receiveShadow = true
  })
  return g
}
