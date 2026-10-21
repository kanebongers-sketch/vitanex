// ─── Fit Factory Club, 3D-oefenbeelden: vrije gewichten ─────────────────────
// Olympische stang (2,2 m, knurling, verchroomde hulzen, sluiting) met rubberen
// bumperschijven (45 cm, stalen naaf, opdruk), korte curlstang, dumbbells met
// zeskantige rubberen koppen en een gekartelde chromen greep, en een
// kettlebell met een dikke greep. Schijven aan de kant van de camera worden
// doorzichtig zodra ze het lichaam afdekken (zie `doorzicht`).

import { Group, LatheGeometry, Mesh, MeshStandardMaterial, Quaternion, RingGeometry, Vector2, Vector3, type BufferGeometry } from 'three'
import type { Figuur } from '@/lib/club/training/3d/kinematica'
import type { GeoBak } from './vormen'
import { buisPad, cilinder, langsX, opX, OMHOOG, schaduw, type MateriaalMaterialen, type Zetter } from './materiaal-delen'
import { schijfOpdruk } from './materiaal-texturen'

const X = new Vector3(1, 0, 0)

/** Bumperschijven: alle 45 cm, dikte en opdruk per gewicht. */
const SCHIJVEN = [
  { dikte: 0.064, tekst: '20 KG' },
  { dikte: 0.052, tekst: '15 KG' },
  { dikte: 0.042, tekst: '10 KG' },
] as const

function lathe(bak: GeoBak, punten: readonly (readonly [number, number])[], segmenten: number): BufferGeometry {
  return bak.houd(new LatheGeometry(punten.map(([x, y]) => new Vector2(x, y)), segmenten))
}

/** Rubber van een bumperschijf: verzonken vlak, opstaande rand, ronde buitenkant. As langs y. */
function bumperVorm(bak: GeoBak, straal: number, dikte: number): BufferGeometry {
  const h = dikte / 2
  const R = straal
  return lathe(bak, [
    [0.07, -h * 0.84], [R - 0.04, -h * 0.84], [R - 0.026, -h], [R - 0.008, -h], [R, -h + 0.008],
    [R, h - 0.008], [R - 0.008, h], [R - 0.026, h], [R - 0.04, h * 0.84], [0.07, h * 0.84], [0.07, -h * 0.84],
  ], 56)
}

/** Stalen naaf in het midden van de schijf, steekt net boven het rubber uit. */
function naafVorm(bak: GeoBak, dikte: number): BufferGeometry {
  const h = dikte / 2
  return lathe(bak, [
    [0.0255, -h * 0.96], [0.066, -h * 0.96], [0.074, -h * 0.88], [0.074, h * 0.88], [0.066, h * 0.96], [0.0255, h * 0.96], [0.0255, -h * 0.96],
  ], 40)
}

const opdrukken = new WeakMap<MateriaalMaterialen, Map<string, MeshStandardMaterial>>()

function opdrukMateriaal(m: MateriaalMaterialen, tekst: string): MeshStandardMaterial {
  const per = opdrukken.get(m) ?? new Map<string, MeshStandardMaterial>()
  opdrukken.set(m, per)
  const bekend = per.get(tekst)
  if (bekend) return bekend
  const mat = m.kopie(new MeshStandardMaterial({
    map: m.houd(schijfOpdruk(m.accentKleur, tekst)),
    transparent: true,
    depthWrite: false,
    roughness: 0.6,
    polygonOffset: true,
    polygonOffsetFactor: -2,
  }))
  per.set(tekst, mat)
  return mat
}

/** Een complete bumperschijf, as langs y. */
function bumper(bak: GeoBak, m: MateriaalMaterialen, rubber: MeshStandardMaterial, naaf: MeshStandardMaterial, nummer: number, straal = 0.225): Group {
  const s = SCHIJVEN[Math.min(nummer, SCHIJVEN.length - 1)]
  const g = new Group()
  g.add(new Mesh(bumperVorm(bak, straal, s.dikte), rubber), new Mesh(naafVorm(bak, s.dikte), naaf))
  const opdruk = opdrukMateriaal(m, s.tekst)
  const ring = bak.houd(new RingGeometry(0.075, straal - 0.028, 48, 1))
  for (const kant of [1, -1]) {
    const vlak = new Mesh(ring, opdruk)
    vlak.rotation.x = -kant * Math.PI / 2
    vlak.position.y = kant * (s.dikte / 2) * 0.84 + kant * 0.0006
    vlak.castShadow = false
    vlak.userData.opdruk = true
    g.add(vlak)
  }
  g.userData.dikte = s.dikte
  return g
}

/** Losse bumperschijf (as langs y), bijvoorbeeld op de hoorns van een leg press. */
export function losseSchijf(bak: GeoBak, m: MateriaalMaterialen, nummer: number, straal = 0.225): Group {
  return bumper(bak, m, m.schijf, m.staal, nummer, straal)
}

/** Een kant van de stang: hulsdelen en schijven, met eigen materialen om te kunnen vervagen. */
export interface StangKant {
  readonly groep: Group
  readonly materialen: readonly MeshStandardMaterial[]
  readonly midden: Vector3
  readonly straal: number
}

function knurlStuk(bak: GeoBak, m: MateriaalMaterialen, van: number, tot: number): Mesh {
  const k = opX(cilinder(bak, m.knurl, 0.0142, tot - van, 20))
  k.position.x = (van + tot) / 2
  return k
}

export function stang(bak: GeoBak, m: MateriaalMaterialen, schijven: number): { groep: Group; kanten: StangKant[] } {
  const g = new Group()
  g.add(opX(cilinder(bak, m.staalMat, 0.0139, 1.31, 20)))
  g.add(knurlStuk(bak, m, -0.08, 0.08))
  const kanten: StangKant[] = []
  for (const z of [1, -1]) {
    g.add(knurlStuk(bak, m, 0.2 * z, 0.45 * z), knurlStuk(bak, m, 0.46 * z, 0.63 * z))
    // Kraag van de huls, huls met afgeschuind einde.
    const kraag = opX(new Mesh(lathe(bak, [[0.014, -0.009], [0.036, -0.009], [0.04, -0.005], [0.04, 0.005], [0.036, 0.009], [0.014, 0.009]], 32), m.staal))
    kraag.position.x = 0.648 * z
    g.add(kraag)
    const huls = langsX(new Mesh(lathe(bak, [[0.014, -0.22], [0.025, -0.22], [0.025, 0.21], [0.023, 0.218], [0.015, 0.22]], 28), m.staal), z)
    huls.position.x = 0.877 * z
    g.add(huls)
    const kant = new Group()
    // Eigen materialen per kant, altijd in de doorzichtige laag (geen nieuwe shader bij vervagen).
    const rubber = m.kopie(m.schijf)
    const naaf = m.kopie(m.staal)
    rubber.transparent = true
    naaf.transparent = true
    let x = 0.664
    for (let i = 0; i < schijven; i++) {
      const s = bumper(bak, m, rubber, naaf, i)
      const dikte = s.userData.dikte as number
      opX(s)
      s.position.x = (x + dikte / 2) * z
      kant.add(s)
      x += dikte + 0.002
    }
    // Sluiting (lock-jaw) in de accentkleur, met hendel.
    const slot = new Group()
    slot.add(opX(new Mesh(lathe(bak, [[0.0255, -0.017], [0.038, -0.017], [0.041, -0.012], [0.041, 0.012], [0.038, 0.017], [0.0255, 0.017]], 32), m.accent)))
    const hendel = cilinder(bak, m.greep, 0.006, 0.05, 10)
    hendel.position.set(0, 0.058, 0)
    slot.add(hendel)
    slot.position.x = (x + 0.018) * z
    kant.add(slot)
    g.add(kant)
    kanten.push({ groep: kant, materialen: [rubber, naaf], midden: new Vector3(((0.664 + x) / 2) * z, 0, 0), straal: 0.225 })
  }
  return { groep: schaduw(g), kanten }
}

/** Korte vaste curlstang: 1,2 m met kleine rubberen schijven. */
export function curlStang(bak: GeoBak, m: MateriaalMaterialen): Group {
  const g = new Group()
  g.add(opX(cilinder(bak, m.staalMat, 0.0128, 1.0)))
  for (const z of [1, -1]) {
    g.add(knurlStuk(bak, m, 0.05 * z, 0.3 * z))
    const s = bumper(bak, m, m.schijf, m.staal, 2, 0.14)
    opX(s)
    s.position.x = 0.44 * z
    g.add(s)
    const kraag = opX(cilinder(bak, m.accent, 0.03, 0.022, 24))
    kraag.position.x = 0.405 * z
    g.add(kraag)
    const eind = langsX(new Mesh(lathe(bak, [[0.001, -0.03], [0.024, -0.03], [0.024, 0.024], [0.02, 0.03], [0.001, 0.03]], 24), m.staal), z)
    eind.position.x = 0.49 * z
    g.add(eind)
  }
  return schaduw(g)
}

/** Zeskantige rubberen kop met afgeschuinde randen en vlakke zijden. */
function hexKop(bak: GeoBak, straal: number, lengte: number): BufferGeometry {
  const h = lengte / 2
  const geo = new LatheGeometry([[0.0005, -h], [straal * 0.8, -h], [straal, -h + 0.01], [straal, h - 0.01], [straal * 0.8, h], [0.0005, h]].map(([x, y]) => new Vector2(x, y)), 6)
  const plat = geo.toNonIndexed()
  geo.dispose()
  plat.computeVertexNormals()
  return bak.houd(plat)
}

/** Een dumbbell, as langs x. `maat` 1 is ongeveer 10 kg. */
export function halter(bak: GeoBak, m: MateriaalMaterialen, maat = 1): Group {
  const g = new Group()
  g.add(opX(cilinder(bak, m.knurl, 0.0165, 0.13, 20)))
  const kop = hexKop(bak, 0.066, 0.082)
  for (const z of [1, -1]) {
    const ring = opX(cilinder(bak, m.staal, 0.026, 0.014, 24))
    ring.position.x = 0.071 * z
    g.add(ring)
    const k = opX(new Mesh(kop, m.schijf))
    k.position.x = 0.119 * z
    g.add(k)
    const plaat = opX(cilinder(bak, m.staal, 0.03, 0.004, 24))
    plaat.position.x = 0.1615 * z
    g.add(plaat)
  }
  g.scale.setScalar(maat)
  return schaduw(g)
}

/** Kettlebell: bol met platte onderkant en een dikke greep, greep in de oorsprong. */
export function kettlebell(bak: GeoBak, m: MateriaalMaterialen): Group {
  const g = new Group()
  // Bol (straal 10,6 cm) met een vlakke voet waar de bol de vloer zou raken.
  const profiel: [number, number][] = [[0.0005, -0.262], [0.05, -0.262]]
  for (let i = 0; i <= 16; i++) {
    const a = -1.0 + (i / 16) * 2.5
    profiel.push([0.106 * Math.cos(a), -0.172 + 0.106 * Math.sin(a)])
  }
  profiel.push([0.0005, -0.07])
  g.add(new Mesh(lathe(bak, profiel, 44), m.gietijzer))
  const p = (x: number, y: number) => new Vector3(x, y, 0)
  const greep = buisPad(bak, m.gietijzer, [p(-0.07, -0.13), p(-0.078, -0.03), p(-0.064, 0), p(0.064, 0), p(0.078, -0.03), p(0.07, -0.13)], 0.0175, 0.04)
  g.add(greep)
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
    draai.setFromUnitVectors(X, tijdelijk)
    d.quaternion.copy(draai)
    // Handen onder de bovenste kop: het midden zit iets lager dan de handen.
    d.position.copy(f.handen[0].pos).add(f.handen[1].pos).multiplyScalar(0.5).addScaledVector(tijdelijk, -0.07)
  }
}

/** De kettlebell hangt in het verlengde van de armen. */
export function zetKettlebell(k: Group): Zetter {
  const neer = new Vector3()
  const schouder = new Vector3()
  const omlaag = new Vector3(0, -1, 0)
  return (f: Figuur) => {
    const midden = tijdelijk.copy(f.handen[0].pos).add(f.handen[1].pos).multiplyScalar(0.5)
    k.position.copy(midden)
    schouder.copy(f.armen[0].begin).add(f.armen[1].begin).multiplyScalar(0.5)
    neer.copy(midden).sub(schouder).normalize()
    draai.setFromUnitVectors(omlaag, neer)
    k.quaternion.copy(draai)
  }
}
