// ─── Fit Factory Club, 3D-oefenbeelden: biceps curl machine ─────────────────
// Zitting zonder rugleuning, een schuin armkussen met een ronde bovenrand
// (de borst rust ertegen, de bovenarmen liggen er plat op) en een hefboom
// waarvan de draaipunten precies in lijn met de ellebogen liggen. Twee
// hefboomarmen buiten de onderarmen lopen evenwijdig aan de onderarmen naar de
// handvatten. Rechts staat de gewichtsstapel, verbonden met een bovenbalk; de
// stapel gaat mee omhoog met de buiging van de ellebogen. Alles wordt per beeld
// uit het lichaam gerekend (de romp ligt stil), zodat kussen en draaipunt altijd
// kloppen met de houding in de data.

import { Group, Matrix4, Vector3, type Mesh } from 'three'
import type { Figuur } from '@/lib/club/training/3d/kinematica'
import type { GeoBak } from './vormen'
import { blok, cilinder, legTussen, opX, rekbareBuis, schaduw, Slag, type MateriaalMaterialen, type Stuk } from './materiaal-delen'
import { gewichtsstapel, kabelStuk } from './materiaal-stapel'
import { maakAfdekker, zetAfdekker, type Zicht } from './materiaal-zicht'

/** Maten van het armkussen langs de bovenarm (m vanaf het schoudergewricht). */
const KUSSEN = { van: 0.165, tot: 0.36, breedte: 0.52, dikte: 0.075, onderArm: 0.042 } as const
/** Halve breedte van de hefboomarmen en van het frame. */
const HEFBOOM_X = 0.35
const FRAME_X = 0.42
const TOREN = new Vector3(-0.8, 0, 0.12)
const TOREN_HOOGTE = 1.45

/** Kussen met bekleding op een kunststof plaat; bovenvlak op lokaal y = 0, lengte langs z. */
function kussen(bak: GeoBak, m: MateriaalMaterialen, breedte: number, lengte: number, dikte: number): Group {
  const g = new Group()
  g.add(blok(bak, m.kussen, [breedte, dikte, lengte], [0, -dikte / 2, 0], 0.032))
  g.add(blok(bak, m.kunststof, [breedte - 0.03, 0.014, lengte - 0.03], [0, -dikte - 0.006, 0], 0.005))
  return g
}

/** Naaf van een draaipunt in de framekleur met een ring in de accentkleur, as langs x. */
function naaf(bak: GeoBak, m: MateriaalMaterialen): Group {
  const g = new Group()
  g.add(opX(cilinder(bak, m.frame, 0.052, 0.05, 28)))
  g.add(opX(cilinder(bak, m.accent, 0.03, 0.054, 24)))
  return g
}

interface Delen {
  readonly vast: Group
  readonly armKussen: Group
  readonly rol: Group
  readonly steun: Mesh
  readonly zit: Group
  readonly zitPaal: Mesh
  readonly palen: readonly Mesh[]
  readonly naven: readonly Group[]
  readonly hefbomen: readonly Mesh[]
  readonly verbinders: readonly Mesh[]
  readonly grepen: readonly Mesh[]
  readonly bovenbalk: Mesh
}

function maakDelen(bak: GeoBak, m: MateriaalMaterialen): Delen {
  const vast = new Group()
  // Onderstel: middenbalk onder zitting en kussen, voorbalk en twee zijbalken buiten de voeten.
  vast.add(blok(bak, m.frame, [0.09, 0.06, 1.3], [0, 0.03, 0.27], 0.022))
  vast.add(blok(bak, m.frame, [FRAME_X * 2 + 0.08, 0.06, 0.08], [0, 0.03, 0.92], 0.022))
  for (const k of [1, -1]) {
    vast.add(blok(bak, m.frame, [0.08, 0.06, 0.82], [k * FRAME_X, 0.03, 0.55], 0.022))
    for (const z of [0.18, 0.9]) vast.add(blok(bak, m.greep, [0.09, 0.012, 0.07], [k * FRAME_X, 0.006, z], 0.004))
  }
  vast.add(blok(bak, m.greep, [0.1, 0.012, 0.07], [0, 0.006, -0.36], 0.004))
  const armKussen = kussen(bak, m, KUSSEN.breedte, KUSSEN.tot - KUSSEN.van, KUSSEN.dikte)
  const rol = new Group()
  rol.add(opX(cilinder(bak, m.kussen, KUSSEN.dikte / 2 + 0.006, KUSSEN.breedte, 28)))
  const zit = kussen(bak, m, 0.38, 0.36, 0.075)
  return {
    vast,
    armKussen,
    rol,
    steun: rekbareBuis(bak, m.frame, 0.034, 16),
    zit,
    zitPaal: blok(bak, m.frame, [0.075, 1, 0.075], [0, 0, 0], 0.02),
    palen: [1, -1].map(() => blok(bak, m.frame, [0.075, 1, 0.075], [0, 0, 0], 0.02)),
    naven: [1, -1].map(() => naaf(bak, m)),
    hefbomen: [1, -1].map(() => rekbareBuis(bak, m.frame, 0.022, 14)),
    verbinders: [1, -1].map(() => rekbareBuis(bak, m.staalMat, 0.012, 12)),
    grepen: [1, -1].map(() => opX(cilinder(bak, m.greep, 0.019, 0.12, 16))),
    bovenbalk: rekbareBuis(bak, m.frame, 0.03, 14),
  }
}

export function curlMachine(bak: GeoBak, m: MateriaalMaterialen, zicht: Zicht): Stuk {
  const d = maakDelen(bak, m)
  const stapel = gewichtsstapel(bak, m, TOREN, TOREN_HOOGTE)
  const kabel = kabelStuk(bak, m)
  const toren = new Group()
  toren.add(stapel.groep, kabel)
  const afdekker = maakAfdekker(schaduw(toren), m.kopie)
  const g = new Group()
  g.add(d.vast, d.armKussen, d.rol, d.steun, d.zit, d.zitPaal, ...d.palen, ...d.naven, ...d.hefbomen, ...d.verbinders, ...d.grepen, d.bovenbalk, toren)
  schaduw(g)
  const kap = new Vector3(TOREN.x, TOREN_HOOGTE - 0.03, TOREN.z)
  const slag = new Slag()
  const X = new Vector3(1, 0, 0)
  const u = new Vector3()
  const n = new Vector3()
  const a = new Vector3()
  const b = new Vector3()
  const basis = new Matrix4()
  const buiging = (f: Figuur) => f.armen[0].buiging
  return {
    groep: g,
    meet(f) {
      slag.meet(buiging(f))
    },
    zet(f) {
      const schouder = f.armen[0].begin
      const elleboog = f.armen[0].midden
      // Kussenvlak onder de bovenarm (in het zijvlak), normaal schuin omhoog naar voren.
      u.copy(elleboog).sub(schouder).setX(0).normalize()
      n.set(0, u.z, -u.y)
      const lengte = elleboog.distanceTo(schouder)
      const punt = (t: number, uit: Vector3) => uit.copy(schouder).setX(0).addScaledVector(u, (t / 0.3) * lengte).addScaledVector(n, -KUSSEN.onderArm)
      d.armKussen.quaternion.setFromRotationMatrix(basis.makeBasis(X, n, u))
      d.armKussen.position.copy(punt((KUSSEN.van + KUSSEN.tot) / 2, a))
      // Ronde bovenrand waar de borst tegenaan rust.
      d.rol.position.copy(punt(KUSSEN.van, a)).addScaledVector(n, -KUSSEN.dikte / 2)
      // Schuine steun van onder het kussen naar de middenbalk voor de voeten.
      punt(KUSSEN.tot - 0.04, a).addScaledVector(n, -KUSSEN.dikte - 0.01)
      legTussen(d.steun, a, b.set(0, 0.06, 0.86), true)
      // Zitting zonder rugleuning onder het bekken.
      const zitY = f.bekken.pos.y - 0.105
      const zitZ = f.bekken.pos.z + 0.04
      d.zit.position.set(0, zitY, zitZ)
      d.zitPaal.scale.y = zitY - 0.14
      d.zitPaal.position.set(0, (zitY - 0.14) / 2 + 0.06, zitZ)
      // Draaipunten in lijn met de ellebogen, hefbomen evenwijdig aan de onderarmen.
      f.armen.forEach((arm, i) => {
        const k = i === 0 ? 1 : -1
        const hand = f.handen[i].pos
        d.naven[i].position.set(k * HEFBOOM_X, arm.midden.y, arm.midden.z)
        const paal = d.palen[i]
        paal.scale.y = arm.midden.y - 0.06
        paal.position.set(k * FRAME_X, (arm.midden.y - 0.06) / 2 + 0.06, arm.midden.z)
        a.set(k * HEFBOOM_X, arm.midden.y, arm.midden.z)
        b.set(k * HEFBOOM_X, hand.y, hand.z)
        legTussen(d.hefbomen[i], a, b, true)
        d.grepen[i].position.copy(hand)
        legTussen(d.verbinders[i], b, a.copy(hand).setX(hand.x + k * 0.06), true)
      })
      // Balk van het rechter draaipunt naar de toren, kabel van de stapel naar de kap.
      a.set(-FRAME_X, f.armen[1].midden.y, f.armen[1].midden.z)
      legTussen(d.bovenbalk, a, b.set(TOREN.x + 0.19, a.y, TOREN.z), true)
      stapel.til(slag.deel(buiging(f)) * 0.3)
      kabel.leg(stapel.aangrijp, kap)
      zetAfdekker(afdekker, f, zicht)
    },
  }
}
