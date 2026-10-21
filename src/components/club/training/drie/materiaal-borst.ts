// ─── Fit Factory Club, 3D-oefenbeelden: borstmachines ───────────────────────
// Pec deck (butterfly) en kabel-crossover. De pec deck heeft een zitting en
// een hoge rugleuning tot achter het hoofd, twee armen die om een verticale
// as recht boven de schouders draaien en verticale handgrepen op
// schouderhoogte; de gewichtsstapel staat achter de sporter en gaat mee
// omhoog met de hoek van de armen. De crossover is een station met twee
// torens, elk met een hoge katrol op een verstelbare slede, een eigen
// gewichtsstapel en een D-handvat aan de kabel.

import { Group, Quaternion, Vector3 } from 'three'
import type { Figuur } from '@/lib/club/training/3d/kinematica'
import type { GeoBak } from './vormen'
import { blok, cilinder, legTussen, OMHOOG, opZ, raakPunt, rekbareBuis, schaduw, Slag, voegSamen, type MateriaalMaterialen, type Stuk } from './materiaal-delen'
import { gewichtsstapel, katrol, kabelStuk, richtKatrol, type Stapel } from './materiaal-stapel'
import { maakAfdekker, zetAfdekker, type Zicht } from './materiaal-zicht'

const VOOROVER = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), Math.PI / 2)

/** Kussen met bekleding op een kunststof plaat; bovenvlak op lokaal y = 0. */
function kussen(bak: GeoBak, m: MateriaalMaterialen, breedte: number, lengte: number, dikte = 0.075): Group {
  const g = new Group()
  g.add(blok(bak, m.kussen, [breedte, dikte, lengte], [0, -dikte / 2, 0], 0.034))
  g.add(blok(bak, m.kunststof, [breedte - 0.03, 0.014, lengte - 0.03], [0, -dikte - 0.006, 0], 0.005))
  return g
}

/** Verticale handgreep met een kapje in de accentkleur. */
function handgreep(bak: GeoBak, m: MateriaalMaterialen): Group {
  const g = new Group()
  g.add(cilinder(bak, m.greep, 0.019, 0.15, 16))
  const kap = cilinder(bak, m.accent, 0.022, 0.012, 16)
  kap.position.y = -0.081
  g.add(kap)
  return g
}

// ── Pec deck ────────────────────────────────────────────────────────────────

export function pecDeck(bak: GeoBak, m: MateriaalMaterialen, zicht: Zicht): Stuk {
  const g = new Group()
  const zit = kussen(bak, m, 0.4, 0.4)
  const rug = kussen(bak, m, 0.32, 0.86)
  const zitPaal = blok(bak, m.frame, [0.075, 1, 0.075], [0, 0, 0], 0.02)
  const zuil = blok(bak, m.frame, [0.11, 1, 0.11], [0, 0, 0], 0.03)
  const voet = new Group()
  // Voorste voetligger onder de dijen, ruim achter de voeten.
  voet.add(blok(bak, m.frame, [0.62, 0.05, 0.1], [0, 0.03, 0.22], 0.02))
  voet.add(blok(bak, m.frame, [0.1, 0.05, 0.74], [0, 0.03, -0.12], 0.02))
  voet.add(blok(bak, m.frame, [1.1, 0.05, 0.1], [-0.25, 0.03, -0.42], 0.02))
  for (const [x, z] of [[-0.27, 0.22], [0.27, 0.22], [-0.76, -0.42], [0.26, -0.42]]) voet.add(blok(bak, m.greep, [0.07, 0.012, 0.07], [x, 0.006, z], 0.004))
  const ligger = blok(bak, m.frame, [0.09, 0.09, 1], [0, 0, 0], 0.025)
  const rugSteun = blok(bak, m.frame, [0.07, 1, 0.07], [0, 0, 0], 0.02)
  const brug = blok(bak, m.frame, [0.07, 1, 0.07], [0, 0, 0], 0.02)
  const dwars = blok(bak, m.frame, [1, 0.08, 0.08], [0, 0, 0], 0.022)
  const huizen = [0, 1].map(() => cilinder(bak, m.frame, 0.06, 0.12, 28))
  const ringen = [0, 1].map(() => cilinder(bak, m.accent, 0.062, 0.016, 28))
  const hefbomen = [0, 1].map(() => rekbareBuis(bak, m.frame, 0.026, 14))
  const staven = [0, 1].map(() => rekbareBuis(bak, m.frame, 0.022, 14))
  const bochten = [0, 1].map(() => blok(bak, m.frame, [0.056, 0.056, 0.056], [0, 0, 0], 0.026))
  const grepen = [0, 1].map(() => handgreep(bak, m))
  const stapel = gewichtsstapel(bak, m, new Vector3(-0.62, 0, -0.42), 1.62)
  const kabel = kabelStuk(bak, m)
  const toren = new Group()
  toren.add(stapel.groep, kabel)
  g.add(zit, rug, zitPaal, zuil, voet, ligger, rugSteun, brug, dwars, ...huizen, ...ringen, ...hefbomen, ...staven, ...bochten, ...grepen, toren)
  schaduw(g)
  voegSamen(voet, bak)
  const afdekker = maakAfdekker(toren, m.kopie)
  const slag = new Slag()
  const waarde = (f: Figuur) => -f.handen[0].pos.x
  const p = new Vector3()
  const as = new Vector3()
  const boven = new Vector3()
  return {
    groep: g,
    meet(f) {
      slag.meet(waarde(f))
    },
    zet(f) {
      // Zitting onder het bekken, rugleuning tegen rug en hoofd.
      zit.position.set(0, f.bekken.pos.y - 0.105, f.bekken.pos.z + 0.07)
      p.set(0, 0.16, -0.126).applyQuaternion(f.borst.rot).add(f.borst.pos)
      rug.position.copy(p)
      rug.quaternion.copy(f.borst.rot).multiply(VOOROVER)
      const zuilZ = f.borst.pos.z - 0.3
      zitPaal.scale.y = zit.position.y - 0.13
      zitPaal.position.set(0, zitPaal.scale.y / 2 + 0.05, zit.position.z - 0.04)
      voet.position.set(0, 0, zit.position.z - 0.02)
      // Draaiassen recht boven de schoudergewrichten, boven het hoofd uit.
      const schouder = f.armen[0].begin
      const asY = schouder.y + 0.44
      const top = asY + 0.1
      zuil.scale.y = top
      zuil.position.set(0, top / 2, zuilZ)
      ligger.scale.z = schouder.z - zuilZ + 0.06
      ligger.position.set(0, top, (schouder.z + zuilZ) / 2)
      // Rugleuning op een steun aan de zuil, bovenin een brug naar de stapel.
      p.set(0, 0.16, -0.21).applyQuaternion(f.borst.rot).add(f.borst.pos)
      legTussen(rugSteun, p, new Vector3(0, p.y, zuilZ), true)
      const brugY = top - 0.06
      legTussen(brug, new Vector3(0, brugY, zuilZ), new Vector3(-0.62, brugY, -0.42), true)
      dwars.scale.x = 2 * schouder.x + 0.12
      dwars.position.set(0, top, schouder.z)
      f.armen.forEach((arm, i) => {
        const hand = f.handen[i].pos
        as.set(arm.begin.x, asY, arm.begin.z)
        huizen[i].position.copy(as)
        ringen[i].position.copy(as).setY(asY - 0.066)
        // Hefboom horizontaal naar een punt recht boven de greep, dan omlaag naar de greep.
        boven.set(hand.x, asY - 0.02, hand.z)
        legTussen(hefbomen[i], as.clone().setY(asY - 0.02), boven, true)
        bochten[i].position.copy(boven)
        legTussen(staven[i], boven, hand.clone().setY(hand.y + 0.075), true)
        grepen[i].position.copy(hand)
      })
      stapel.til(slag.deel(waarde(f)) * 0.3)
      kabel.leg(stapel.aangrijp, new Vector3(-0.62, 1.6, -0.42))
      zetAfdekker(afdekker, f, zicht)
    },
  }
}

// ── Kabel-crossover ─────────────────────────────────────────────────────────

/** Halve breedte van het station: de katrollen staan net binnen de torens. */
const TOREN_X = 1.3
const KATROL_Y = 2.06
const TOP = 2.36
const R = 0.045

interface Kant {
  readonly toren: Group
  readonly stapel: Stapel
  readonly katrol: Group
  readonly midden: Vector3
  readonly kabels: ReturnType<typeof kabelStuk>[]
  readonly greep: Group
  readonly beugels: ReturnType<typeof rekbareBuis>[]
  readonly ring: Group
  readonly slag: Slag
}

/** Een toren: kolom met slede en katrol, stapel erachter, kap bovenop. `s` = 1 links, -1 rechts. */
function crossoverKant(bak: GeoBak, m: MateriaalMaterialen, s: number, z: number): Kant {
  const toren = new Group()
  const kolomX = s * (TOREN_X - 0.02)
  const stapelX = s * (TOREN_X + 0.3)
  toren.add(blok(bak, m.frame, [0.1, TOP, 0.1], [kolomX, TOP / 2, z], 0.025))
  toren.add(blok(bak, m.frame, [0.1, TOP, 0.1], [s * (TOREN_X + 0.58), TOP / 2, z], 0.025))
  toren.add(blok(bak, m.frame, [0.72, 0.09, 0.5], [s * (TOREN_X + 0.29), TOP, z], 0.025))
  toren.add(blok(bak, m.frame, [0.72, 0.05, 0.5], [s * (TOREN_X + 0.29), 0.025, z], 0.02))
  // Slede op de kolom met verstelpen en zwenkbeugel naar binnen.
  toren.add(blok(bak, m.frame, [0.14, 0.18, 0.15], [kolomX, KATROL_Y + 0.07, z], 0.025))
  const pen = opZ(cilinder(bak, m.accent, 0.013, 0.05, 16))
  pen.position.set(kolomX, KATROL_Y + 0.07, z + 0.09)
  toren.add(pen)
  toren.add(blok(bak, m.frame, [0.1, 0.05, 0.05], [s * (TOREN_X - 0.1), KATROL_Y + 0.07, z], 0.012))
  const stapel = gewichtsstapel(bak, m, new Vector3(stapelX, 0, z), TOP - 0.05, -s * (Math.PI / 2))
  const midden = new Vector3(s * (TOREN_X - 0.14), KATROL_Y, z)
  const wiel = katrol(bak, m, R)
  wiel.position.copy(midden)
  const kabels = [0, 1, 2].map(() => kabelStuk(bak, m))
  const greep = new Group()
  greep.add(cilinder(bak, m.greep, 0.0175, 0.12, 16))
  const beugels = [0, 1].map(() => rekbareBuis(bak, m.staalMat, 0.008, 10))
  const ring = new Group().add(blok(bak, m.staal, [0.024, 0.024, 0.024], [0, 0, 0], 0.012))
  return { toren, stapel, katrol: wiel, midden, kabels, greep, beugels, ring, slag: new Slag() }
}

export function kabelCrossover(bak: GeoBak, m: MateriaalMaterialen, plek: Vector3, zicht: Zicht): Stuk {
  const g = new Group()
  const kanten = [crossoverKant(bak, m, 1, plek.z), crossoverKant(bak, m, -1, plek.z)]
  const balk = blok(bak, m.frame, [2 * TOREN_X, 0.09, 0.09], [0, TOP - 0.02, plek.z], 0.025)
  const afdekkers = kanten.map((k) => {
    const hoog = new Group()
    hoog.add(k.toren, k.stapel.groep)
    g.add(hoog, k.katrol, ...k.kabels, k.greep, ...k.beugels, k.ring)
    schaduw(hoog)
    voegSamen(k.toren, bak)
    return maakAfdekker(hoog, m.kopie)
  })
  g.add(balk)
  schaduw(g)
  const naar = new Vector3()
  const as = new Vector3()
  const haak = new Vector3()
  const los = new Vector3()
  const a = new Vector3()
  const b = new Vector3()
  const omhoog = new Vector3()
  const zetGreep = (k: Kant, f: Figuur, i: number) => {
    const hand = f.handen[i]
    naar.copy(k.midden).sub(hand.pos).normalize()
    as.set(1, 0, 0).applyQuaternion(hand.rot)
    k.greep.position.copy(hand.pos)
    k.greep.quaternion.setFromUnitVectors(OMHOOG, as)
    haak.copy(hand.pos).addScaledVector(naar, 0.1)
    legTussen(k.beugels[0], hand.pos.clone().addScaledVector(as, 0.066), haak, true)
    legTussen(k.beugels[1], hand.pos.clone().addScaledVector(as, -0.066), haak, true)
    k.ring.position.copy(haak)
  }
  return {
    groep: g,
    meet(f) {
      kanten.forEach((k, i) => {
        zetGreep(k, f, i)
        k.slag.meet(haak.distanceTo(k.midden))
      })
    },
    zet(f) {
      kanten.forEach((k, i) => {
        zetGreep(k, f, i)
        const uit = haak.distanceTo(k.midden)
        k.stapel.til(Math.min(0.42, k.slag.deel(uit) * k.slag.lengte * 0.5))
        // Katrol draait mee in het vlak van de kabel: van de greep, over het wiel, omhoog de kolom in.
        omhoog.set(0, 1, 0)
        a.copy(haak).sub(k.midden)
        richtKatrol(k.katrol, a, omhoog)
        raakPunt(k.midden, R, a, omhoog, los)
        k.kabels[0].leg(haak, los)
        raakPunt(k.midden, R, omhoog, b.copy(a), los)
        k.kabels[1].leg(los, los.clone().setY(TOP - 0.06))
        k.kabels[2].leg(k.stapel.aangrijp, k.stapel.aangrijp.clone().setY(TOP - 0.06))
        zetAfdekker(afdekkers[i], f, zicht)
      })
    },
  }
}
