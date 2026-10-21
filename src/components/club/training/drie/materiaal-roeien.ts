// ─── Fit Factory Club, 3D-oefenbeelden: materiaal voor roeioefeningen ──────
// Seated row machine (zitting, borstkussen, twee hefbomen die vanaf een as boven
// het hoofd naar de liggende grepen lopen, gewichtsstapel voorop die meegaat
// met de hoek van de hefbomen), een schuine
// roeibank om met de borst op te liggen en een T-bar (stang vanuit een scharnier
// op de vloer, kleine schijven voorop en een T-greep: een dwarsstang die onder
// de stang hangt). Zitting en kussens liggen tegen het stilliggende lichaam (bekken als
// vast punt), de bewegende delen volgen de handen.

import { Group, Matrix4, Quaternion, Vector3, type Object3D } from 'three'
import type { Figuur } from '@/lib/club/training/3d/kinematica'
import type { GeoBak } from './vormen'
import { blok, cilinder, legTussen, OMHOOG, opX, rekbareBuis, schaduw, Slag, voegSamen, type MateriaalMaterialen, type Stuk } from './materiaal-delen'
import { gewichtsstapel, kabelStuk } from './materiaal-stapel'
import { losseSchijf } from './materiaal-vrij'
import { maakAfdekker, zetAfdekker, type Zicht } from './materiaal-zicht'

const Z = new Vector3(0, 0, 1)

/** Kussen met bekleding op een kunststof plaat; bovenvlak op lokaal y = 0, lengte langs z. */
function kussen(bak: GeoBak, m: MateriaalMaterialen, breedte: number, lengte: number, dikte = 0.075): Group {
  const g = new Group()
  g.add(blok(bak, m.kussen, [breedte, dikte, lengte], [0, -dikte / 2, 0], 0.034))
  g.add(blok(bak, m.kunststof, [breedte - 0.03, 0.014, lengte - 0.03], [0, -dikte - 0.006, 0], 0.005))
  return g
}

/** Draaipunt: naaf in de framekleur met een smalle ring in de accentkleur, as langs x. */
function naaf(bak: GeoBak, m: MateriaalMaterialen): Group {
  const g = new Group()
  g.add(opX(cilinder(bak, m.frame, 0.05, 0.05, 28)))
  g.add(opX(cilinder(bak, m.accent, 0.028, 0.056, 20)))
  return g
}

/** Punt in het frame van het bekken (x opzij, y langs de rug, z naar voren). */
function inBekken(f: Figuur, x: number, y: number, z: number, uit = new Vector3()): Vector3 {
  return uit.set(x, y, z).applyQuaternion(f.bekken.rot).add(f.bekken.pos)
}

/** Kussen tegen de voorkant van de romp: bovenvlak naar het lichaam, lengte langs de rug. */
function zetTegenRomp(pad: Group, f: Figuur, voor: number, van: number, tot: number): void {
  inBekken(f, 0, (van + tot) / 2, voor, pad.position)
  const basis = new Matrix4().makeBasis(new Vector3(1, 0, 0), new Vector3(0, 0, -1), new Vector3(0, 1, 0))
  pad.quaternion.copy(f.bekken.rot).multiply(new Quaternion().setFromRotationMatrix(basis))
}

// ── Seated row machine ──────────────────────────────────────────────────────

/** Hoogte en plek van de as waar de hefbomen om draaien (boven en iets voor het hoofd). */
const AS = { x: 0.34, y: 1.8, z: 0.21 } as const

export function roeiMachine(bak: GeoBak, m: MateriaalMaterialen, plek: Vector3, zicht: Zicht): Stuk {
  const g = new Group()
  const torenZ = plek.z + 1.2
  const hoogte = 1.92
  // Vast frame: vloerbalk, stapel voorop, bovenbalk naar de as, as met naven.
  const vast = new Group()
  vast.add(blok(bak, m.frame, [0.09, 0.06, torenZ - plek.z + 0.2], [plek.x, 0.03, (plek.z - 0.1 + torenZ + 0.1) / 2], 0.02))
  vast.add(blok(bak, m.frame, [0.56, 0.05, 0.08], [plek.x, 0.025, plek.z - 0.12], 0.018))
  for (const x of [-0.25, 0.25]) vast.add(blok(bak, m.greep, [0.07, 0.014, 0.08], [plek.x + x, 0.007, plek.z - 0.12], 0.005))
  vast.add(blok(bak, m.frame, [0.1, 0.1, torenZ - AS.z - plek.z + 0.06], [plek.x, AS.y + 0.09, (AS.z + plek.z + torenZ) / 2], 0.025))
  vast.add(blok(bak, m.accent, [0.102, 0.012, 0.5], [plek.x, AS.y + 0.14, (AS.z + plek.z + torenZ) / 2], 0.004))
  vast.add(blok(bak, m.frame, [0.1, 0.16, 0.1], [plek.x, AS.y + 0.04, AS.z + plek.z], 0.02))
  const as = opX(cilinder(bak, m.staal, 0.03, AS.x * 2 + 0.08, 20))
  as.position.set(plek.x, AS.y, AS.z + plek.z)
  vast.add(as)
  const naven = [1, -1].map((x) => {
    const n = naaf(bak, m)
    n.position.set(plek.x + AS.x * x, AS.y, AS.z + plek.z)
    return n
  })
  vast.add(...naven)
  const stapel = gewichtsstapel(bak, m, new Vector3(plek.x, 0, torenZ), hoogte, Math.PI)
  // De kabel loopt van de as door de bovenbalk; zichtbaar is het stuk onder de kap.
  const kap = new Vector3(plek.x, hoogte - 0.03, torenZ)
  const kabel = kabelStuk(bak, m)
  // Bewegend: hefbomen, grepen, zitting en borstkussen (die volgen het lichaam).
  const hefbomen = [0, 1].map(() => rekbareBuis(bak, m.frame, 0.026, 14))
  const grepen = [0, 1].map(() => opX(cilinder(bak, m.greep, 0.019, 0.14, 16)))
  const kappen = [0, 1].map(() => opX(cilinder(bak, m.accent, 0.022, 0.012, 16)))
  const zit = kussen(bak, m, 0.38, 0.4, 0.075)
  const zitPaal = blok(bak, m.frame, [0.075, 1, 0.075], [0, 0, 0], 0.02)
  const borst = kussen(bak, m, 0.3, 0.3, 0.07)
  const borstArm = rekbareBuis(bak, m.frame, 0.024, 14)
  const borstPaal = blok(bak, m.frame, [0.08, 1, 0.08], [0, 0, 0], 0.02)
  g.add(vast, stapel.groep, kabel, ...hefbomen, ...grepen, ...kappen, zit, zitPaal, borst, borstArm, borstPaal)
  schaduw(g)
  voegSamen(vast, bak)
  const afdekker = maakAfdekker(stapel.groep, m.kopie)
  const slag = new Slag()
  const draaipunt = new Vector3()
  const eind = new Vector3()
  const hoekVan = (f: Figuur) => Math.atan2(f.handen[0].pos.z - (AS.z + plek.z), AS.y - f.handen[0].pos.y)
  return {
    groep: g,
    meet(f) {
      slag.meet(-hoekVan(f))
    },
    zet(f) {
      const deel = slag.deel(-hoekVan(f))
      stapel.til(deel * 0.3)
      // Zitting onder het bekken, paal naar de vloerbalk.
      zit.position.set(plek.x, f.bekken.pos.y - 0.105, f.bekken.pos.z + 0.06)
      zitPaal.scale.y = Math.max(0.05, zit.position.y - 0.13)
      zitPaal.position.set(plek.x, zitPaal.scale.y / 2 + 0.05, zit.position.z - 0.04)
      // Borstkussen tegen de borst, arm naar voren naar een paal op de vloerbalk.
      zetTegenRomp(borst, f, 0.125, 0.22, 0.48)
      const achter = inBekken(f, 0, 0.35, 0.235)
      const voorPaal = new Vector3(plek.x, achter.y, plek.z + 0.95)
      legTussen(borstArm, achter, voorPaal, true)
      borstPaal.scale.y = voorPaal.y + 0.03
      borstPaal.position.set(plek.x, borstPaal.scale.y / 2, voorPaal.z)
      // Hefbomen van de naaf naar het buitenste eind van de liggende greep.
      f.handen.forEach((hand, i) => {
        const kant = Math.sign(hand.pos.x || 1)
        grepen[i].position.copy(hand.pos)
        eind.copy(hand.pos).add(new Vector3(0.07 * kant, 0, 0))
        kappen[i].position.copy(eind).add(new Vector3(0.006 * kant, 0, 0))
        draaipunt.set(plek.x + AS.x * kant, AS.y, AS.z + plek.z)
        legTussen(hefbomen[i], draaipunt, eind, true)
      })
      kabel.leg(stapel.aangrijp, kap)
      zetAfdekker(afdekker, f, zicht)
    },
  }
}

// ── Schuine roeibank (row met borststeun) ───────────────────────────────────

/** Een vast blok van lengte 1 (langs z) tussen twee punten leggen. */
function balkTussen(mesh: Object3D, van: Vector3, naar: Vector3): void {
  mesh.position.copy(van).add(naar).multiplyScalar(0.5)
  mesh.quaternion.setFromUnitVectors(Z, naar.clone().sub(van).normalize())
  mesh.scale.set(1, 1, van.distanceTo(naar))
}

/**
 * Roeibank: kussen onder dezelfde hoek als de romp (die ligt er stil op), een
 * draagbalk eronder en twee palen naar een vloerframe. Het kussen loopt van het
 * bekken tot net onder de oksels, zodat de armen vrij langs de zijkant hangen.
 */
export function buikBank(bak: GeoBak, m: MateriaalMaterialen): Stuk {
  const g = new Group()
  const pad = kussen(bak, m, 0.28, 0.5, 0.075)
  const balk = blok(bak, m.frame, [0.07, 0.05, 1], [0, 0, 0], 0.018)
  const knop = blok(bak, m.accent, [0.075, 0.03, 0.05], [0, 0, 0], 0.008)
  const vloer = blok(bak, m.frame, [0.08, 0.055, 1], [0, 0, 0], 0.02)
  const delen = [0, 1].map(() => ({
    paal: blok(bak, m.frame, [0.07, 1, 0.06], [0, 0, 0], 0.018),
    voet: blok(bak, m.frame, [0.5, 0.05, 0.075], [0, 0, 0], 0.02),
    doppen: [-1, 1].map((x) => blok(bak, m.greep, [0.05, 0.022, 0.085], [0.23 * x, 0.011, 0], 0.008)),
  }))
  g.add(pad, balk, knop, vloer)
  for (const d of delen) g.add(d.paal, d.voet, ...d.doppen)
  schaduw(g)
  const onder = new Vector3()
  const boven = new Vector3()
  return {
    groep: g,
    zet(f) {
      zetTegenRomp(pad, f, 0.125, 0.0, 0.5)
      inBekken(f, 0, 0.03, 0.235, onder)
      inBekken(f, 0, 0.47, 0.235, boven)
      balkTussen(balk, onder, boven)
      knop.position.copy(onder).lerp(boven, 0.5)
      knop.quaternion.copy(balk.quaternion)
      const plekken = [
        { top: onder, z: onder.z - 0.02 },
        { top: boven, z: boven.z + 0.06 },
      ]
      plekken.forEach(({ top, z }, i) => {
        const d = delen[i]
        d.paal.scale.y = top.y
        d.paal.position.set(0, top.y / 2, z)
        d.voet.position.set(0, 0.03, z)
        d.doppen.forEach((dop) => (dop.position.z = z))
      })
      vloer.scale.z = plekken[1].z - plekken[0].z
      vloer.position.set(0, 0.04, (plekken[0].z + plekken[1].z) / 2)
    },
  }
}

// ── T-bar ───────────────────────────────────────────────────────────────────

/** Afstand van de as van de stang tot het midden van de handen (de greep hangt onder de stang). */
const ONDER_STANG = 0.065

export function tBar(bak: GeoBak, m: MateriaalMaterialen, plek: Vector3, schijven: number): Stuk {
  const g = new Group()
  const scharnier = new Vector3(plek.x, 0.06, plek.z)
  // Vloerplaat met een kantelbare huls waar de stang in steekt.
  const voet = new Group()
  voet.add(blok(bak, m.frame, [0.36, 0.02, 0.36], [plek.x, 0.01, plek.z], 0.006))
  voet.add(blok(bak, m.frame, [0.14, 0.05, 0.1], [plek.x, 0.045, plek.z], 0.012))
  const pen = opX(cilinder(bak, m.accent, 0.014, 0.16, 14))
  pen.position.copy(scharnier)
  voet.add(pen)
  const huls = cilinder(bak, m.frame, 0.034, 0.26, 20)
  const stang = rekbareBuis(bak, m.staalMat, 0.014, 18)
  const kraag = cilinder(bak, m.staal, 0.04, 0.018, 28)
  const mouw = cilinder(bak, m.staal, 0.025, 0.4, 24)
  const platen: Group[] = []
  for (let i = 0; i < Math.max(1, schijven); i++) platen.push(losseSchijf(bak, m, 2, 0.125))
  const slot = cilinder(bak, m.accent, 0.041, 0.034, 28)
  // T-greep: zadel om de stang, een korte steel omlaag en een dwarsstang met rubberen handvatten.
  const zadel = opX(cilinder(bak, m.staalMat, 0.022, 0.07, 16))
  const steel = rekbareBuis(bak, m.staalMat, 0.012, 12)
  const dwars = opX(cilinder(bak, m.staalMat, 0.0135, 0.46, 16))
  const grepen = [0, 1].map(() => opX(cilinder(bak, m.greep, 0.0175, 0.12, 16)))
  const doppen = [0, 1].map(() => opX(cilinder(bak, m.accent, 0.019, 0.012, 16)))
  g.add(voet, huls, stang, kraag, mouw, ...platen, slot, zadel, steel, dwars, ...grepen, ...doppen)
  schaduw(g)
  voegSamen(voet, bak)
  const midden = new Vector3()
  const langs = new Vector3()
  const loodrecht = new Vector3()
  const haak = new Vector3()
  const zet = (mesh: Object3D, afstand: number) => {
    mesh.position.copy(haak).addScaledVector(langs, afstand)
    mesh.quaternion.setFromUnitVectors(OMHOOG, langs)
  }
  return {
    groep: g,
    zet(f) {
      midden.copy(f.handen[0].pos).add(f.handen[1].pos).multiplyScalar(0.5)
      // De stang loopt van het scharnier over de greep; de greep hangt er loodrecht onder.
      haak.copy(midden).add(new Vector3(0, ONDER_STANG, 0))
      for (let i = 0; i < 2; i++) {
        langs.copy(haak).sub(scharnier).normalize()
        loodrecht.set(0, langs.z, -langs.y)
        haak.copy(midden).addScaledVector(loodrecht, ONDER_STANG)
      }
      langs.copy(haak).sub(scharnier).normalize()
      legTussen(huls, scharnier.clone().addScaledVector(langs, -0.04), scharnier.clone().addScaledVector(langs, 0.22))
      legTussen(stang, scharnier, haak.clone().addScaledVector(langs, 0.07), true)
      zet(kraag, 0.075)
      zet(mouw, 0.285)
      let x = 0.095
      for (const p of platen) {
        const dikte = p.userData.dikte as number
        zet(p, x + dikte / 2)
        x += dikte + 0.002
      }
      zet(slot, x + 0.019)
      zadel.position.copy(haak).addScaledVector(loodrecht, -0.02)
      zadel.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), new Vector3(1, 0, 0))
      legTussen(steel, haak.clone().addScaledVector(loodrecht, -0.03), midden, true)
      dwars.position.copy(midden)
      f.handen.forEach((hand, i) => {
        const kant = Math.sign(hand.pos.x || 1)
        grepen[i].position.copy(hand.pos)
        doppen[i].position.set(midden.x + 0.236 * kant, midden.y, midden.z)
      })
    },
  }
}
