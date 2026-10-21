// ─── Fit Factory Club, 3D-oefenbeelden: reverse fly machine ─────────────────
// Zittend met de borst tegen een kussen. Voor de sporter staat een zuil met
// het borstkussen; vanaf de top loopt een balk naar achteren tot boven de
// schouders. Daar zitten twee draaipunten met een verticale as, precies boven
// de schoudergewrichten, zodat de hefbomen dezelfde boog maken als de armen.
// Elke hefboom loopt horizontaal naar buiten en daalt dan naar een verticaal
// handvat in de hand (handpalmen naar elkaar). De gewichtsstapel staat voor de
// zuil en gaat omhoog naarmate de armen verder naar achteren zwaaien.
// Zitting, kussen en hefbomen volgen het lichaam (dat bij deze machine stilzit).

import { Group, Mesh, Quaternion, Vector3 } from 'three'
import type { Figuur } from '@/lib/club/training/3d/kinematica'
import type { GeoBak } from './vormen'
import { blok, cilinder, legTussen, rekbareBuis, schaduw, Slag, voegSamen, type MateriaalMaterialen, type Stuk } from './materiaal-delen'
import { gewichtsstapel, kabelStuk } from './materiaal-stapel'
import { maakAfdekker, zetAfdekker, type Zicht } from './materiaal-zicht'

/** Hoogte van de bovenbalk boven de schouders (vrij boven het hoofd). */
const BALK_BOVEN_SCHOUDER = 0.4
/** Plek van de stapel voor de sporter, ten opzichte van `plek`. */
const STAPEL = new Vector3(0, 0, 1.0)
const STAPEL_HOOGTE = 1.48
/** Borstkussen in het frame van de borst: midden, en het kussen zelf. */
const KUSSEN_MIDDEN = new Vector3(0, 0.04, 0.178)
const KUSSEN: [number, number, number] = [0.26, 0.36, 0.075]
/** Halve lengte van een handvat. */
const HANDVAT = 0.065

/** Naaf van een draaipunt met verticale as: frame-kleur met een ring in de accentkleur. */
function naaf(bak: GeoBak, m: MateriaalMaterialen): Group {
  const g = new Group()
  g.add(cilinder(bak, m.frame, 0.05, 0.07, 28))
  g.add(cilinder(bak, m.accent, 0.03, 0.078, 24))
  return g
}

function knik(bak: GeoBak, m: MateriaalMaterialen, straal: number): Mesh {
  const k = new Mesh(bak.bol(16), m.frame)
  k.scale.setScalar(straal)
  return k
}

interface Hefboom {
  readonly naaf: Group
  readonly arm: Mesh
  readonly bocht: Mesh
  readonly daal: Mesh
  readonly handvat: Mesh
  readonly kappen: readonly Mesh[]
}

function hefboom(bak: GeoBak, m: MateriaalMaterialen): Hefboom {
  return {
    naaf: naaf(bak, m),
    arm: rekbareBuis(bak, m.frame, 0.024, 14),
    bocht: knik(bak, m, 0.024),
    daal: rekbareBuis(bak, m.frame, 0.02, 14),
    handvat: cilinder(bak, m.greep, 0.0148, HANDVAT * 2, 16),
    kappen: [cilinder(bak, m.accent, 0.019, 0.012, 16), cilinder(bak, m.accent, 0.019, 0.012, 16)],
  }
}

export function reverseFly(bak: GeoBak, m: MateriaalMaterialen, plek: Vector3, zicht: Zicht): Stuk {
  const g = new Group()
  // Vast: stapel voor de zuil en een vloerbalk van zitting tot stapel.
  const vast = new Group()
  vast.add(blok(bak, m.frame, [0.09, 0.055, 1.45], [0, 0.03, 0.42], 0.022))
  vast.add(blok(bak, m.frame, [0.5, 0.055, 0.09], [0, 0.03, -0.22], 0.022))
  for (const x of [-0.22, 0.22]) vast.add(blok(bak, m.greep, [0.08, 0.012, 0.08], [x, 0.006, -0.22], 0.004))
  vast.position.copy(plek)
  const stapelPlek = STAPEL.clone().add(plek)
  const stapel = gewichtsstapel(bak, m, stapelPlek, STAPEL_HOOGTE, Math.PI)
  const kabel = kabelStuk(bak, m)
  const kap = new Vector3(0, STAPEL_HOOGTE - 0.03, 0).add(stapelPlek)
  const toren = new Group()
  toren.add(stapel.groep, kabel)
  const afdekker = maakAfdekker(schaduw(toren), m.kopie)
  // Volgt het lichaam: zitting, zuilen, borstkussen, bovenbalk en hefbomen.
  const zit = blok(bak, m.kussen, [0.36, 0.075, 0.38], [0, 0, 0], 0.034)
  const zitZuil = rekbareBuis(bak, m.frame, 0.035, 16)
  const zuil = blok(bak, m.frame, [0.09, 1, 0.09], [0, 0, 0], 0.022)
  const kussen = new Group()
  kussen.add(blok(bak, m.kussen, KUSSEN, [0, 0, 0], 0.034))
  kussen.add(blok(bak, m.kunststof, [KUSSEN[0] - 0.03, KUSSEN[1] - 0.03, 0.014], [0, 0, KUSSEN[2] / 2 + 0.006], 0.005))
  const kussenSteun = rekbareBuis(bak, m.frame, 0.026, 14)
  const balk = rekbareBuis(bak, m.frame, 0.035, 16)
  const dwars = rekbareBuis(bak, m.frame, 0.03, 16)
  const naarStapel = rekbareBuis(bak, m.frame, 0.03, 16)
  const hoeken = [knik(bak, m, 0.035), knik(bak, m, 0.035)]
  const hefbomen = [hefboom(bak, m), hefboom(bak, m)]
  g.add(vast, toren, zit, zitZuil, zuil, kussen, kussenSteun, balk, dwars, naarStapel, ...hoeken)
  for (const h of hefbomen) g.add(h.naaf, h.arm, h.bocht, h.daal, h.handvat, ...h.kappen)
  schaduw(g)
  voegSamen(vast, bak)

  const slag = new Slag()
  /** Hoe ver de linkerarm naar achteren is gezwaaid (radialen om de schouder). */
  const waarde = (f: Figuur) => {
    const s = f.armen[0].begin
    const hand = f.handen[0].pos
    return Math.atan2(hand.x - s.x, hand.z - s.z)
  }
  const kussenRot = new Quaternion()
  const kussenPlek = new Vector3()
  const steunVan = new Vector3()
  const top = new Vector3()
  const achter = new Vector3()
  const as = new Vector3()
  const bocht = new Vector3()
  const greepTop = new Vector3()

  return {
    groep: g,
    meet(f) {
      slag.meet(waarde(f))
    },
    zet(f) {
      // Zitting onder het bekken, zuil eronder tot de vloerbalk.
      const zitY = f.bekken.pos.y - 0.105
      zit.position.set(0, zitY - 0.0375, f.bekken.pos.z + 0.06)
      legTussen(zitZuil, new Vector3(0, 0.05, f.bekken.pos.z + 0.06), new Vector3(0, zitY - 0.075, f.bekken.pos.z + 0.06), true)
      // Borstkussen kantelt mee met de borst; steun horizontaal naar de zuil.
      kussenRot.copy(f.borst.rot)
      kussenPlek.copy(KUSSEN_MIDDEN).applyQuaternion(kussenRot).add(f.borst.pos)
      kussen.position.copy(kussenPlek)
      kussen.quaternion.copy(kussenRot)
      const schouder = f.armen[0].begin
      const zuilZ = kussenPlek.z + 0.17
      const balkY = schouder.y + BALK_BOVEN_SCHOUDER
      zuil.scale.y = balkY
      zuil.position.set(0, balkY / 2, zuilZ)
      steunVan.set(0, kussenPlek.y, kussenPlek.z + KUSSEN[2] / 2)
      legTussen(kussenSteun, steunVan, new Vector3(0, kussenPlek.y, zuilZ), true)
      // Bovenbalk van de zuil naar achteren tot boven de schouders, dwarsbalk met de draaipunten.
      top.set(0, balkY, zuilZ)
      achter.set(0, balkY, schouder.z)
      legTussen(balk, top, achter, true)
      legTussen(dwars, new Vector3(schouder.x, balkY, schouder.z), new Vector3(-schouder.x, balkY, schouder.z), true)
      legTussen(naarStapel, top, kap, true)
      hoeken[0].position.copy(top)
      hoeken[1].position.copy(achter)
      // Hefbomen: draaipunt recht boven de schouder, horizontaal naar buiten, dan omlaag naar het handvat.
      f.handen.forEach((hand, i) => {
        const h = hefbomen[i]
        const s = f.armen[i].begin
        as.set(s.x, balkY, s.z)
        h.naaf.position.copy(as)
        bocht.set(hand.pos.x, balkY, hand.pos.z)
        legTussen(h.arm, as, bocht, true)
        h.bocht.position.copy(bocht)
        greepTop.copy(hand.pos).add(new Vector3(0, HANDVAT, 0))
        legTussen(h.daal, bocht, greepTop, true)
        h.handvat.position.copy(hand.pos)
        h.kappen[0].position.copy(greepTop)
        h.kappen[1].position.copy(hand.pos).add(new Vector3(0, -HANDVAT, 0))
      })
      stapel.til(slag.deel(waarde(f)) * 0.24)
      kabel.leg(stapel.aangrijp, kap)
      zetAfdekker(afdekker, f, zicht)
    },
  }
}
