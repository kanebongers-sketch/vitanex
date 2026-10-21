// ─── Fit Factory Club, 3D-oefenbeelden: shoulder press machine ─────────────
// Zitting en hoge rugleuning onder het stilliggende lichaam, een achterframe
// met een dwarsbalk achter het hoofd en aan beide kanten een hefboom die om die
// balk draait. Aan de hefboom zit een horizontale greep precies waar de hand
// zit; de hand volgt de boog uit bouw/schouderpress, dus de hefboom blijft even
// lang. Een gewichtsstapel naast de machine gaat mee met de hoogte van de
// grepen.

import { Group, Quaternion, Vector3 } from 'three'
import type { Figuur } from '@/lib/club/training/3d/kinematica'
import { MATEN } from '@/lib/club/training/3d/maten'
import { SCHOUDERPRESS } from '@/lib/club/training/3d/bouw/schouderpress'
import type { GeoBak } from './vormen'
import { blok, cilinder, legTussen, opX, rekbareBuis, schaduw, Slag, type MateriaalMaterialen, type Stuk } from './materiaal-delen'
import { gewichtsstapel, kabelStuk } from './materiaal-stapel'
import { maakAfdekker, zetAfdekker, type Zicht } from './materiaal-zicht'

/** Lengte van de greep langs x en de hoogte van de stapeltoren. */
const GREEP_LENGTE = 0.15
const TOREN_HOOGTE = 1.6
/** Halve breedte van de dwarsbalk: tot net buiten de draaipunten. */
const BALK = SCHOUDERPRESS.draaipunt.dx + MATEN.schouder.x + 0.05

/** Kussen met bekleding op een kunststof plaat; bovenvlak op lokaal y = 0. */
function kussen(bak: GeoBak, m: MateriaalMaterialen, breedte: number, lengte: number): Group {
  const g = new Group()
  g.add(blok(bak, m.kussen, [breedte, 0.075, lengte], [0, -0.0375, 0], 0.034))
  g.add(blok(bak, m.kunststof, [breedte - 0.03, 0.014, lengte - 0.03], [0, -0.081, 0], 0.005))
  return g
}

/** Naaf op het draaipunt: frame-kleur met een smalle ring in de accentkleur. */
function naaf(bak: GeoBak, m: MateriaalMaterialen): Group {
  const g = new Group()
  g.add(opX(cilinder(bak, m.frame, 0.05, 0.05, 28)))
  g.add(opX(cilinder(bak, m.accent, 0.028, 0.056, 20)))
  return g
}

/** Een greep met hefboom: rubberen handvat langs x, kapje aan de binnenkant, buis naar de naaf. */
function hefboom(bak: GeoBak, m: MateriaalMaterialen) {
  const greep = opX(cilinder(bak, m.greep, 0.019, GREEP_LENGTE, 18))
  const kap = opX(cilinder(bak, m.accent, 0.022, 0.012, 18))
  const arm = rekbareBuis(bak, m.frame, 0.026, 14)
  const uitloop = rekbareBuis(bak, m.frame, 0.024, 14)
  const n = naaf(bak, m)
  return { delen: [greep, kap, arm, uitloop, n], greep, kap, arm, uitloop, naaf: n }
}

export function schouderPress(bak: GeoBak, m: MateriaalMaterialen, zicht: Zicht): Stuk {
  const g = new Group()
  const zit = kussen(bak, m, 0.4, 0.42)
  const rug = kussen(bak, m, 0.34, 0.86)
  const zitZuil = blok(bak, m.frame, [0.075, 1, 0.075], [0, 0, 0], 0.02)
  const rugSteun = rekbareBuis(bak, m.frame, 0.032, 16)
  const achterZuil = blok(bak, m.frame, [0.09, 1, 0.09], [0, 0, 0], 0.024)
  const balk = opX(cilinder(bak, m.staal, 0.032, 1, 20))
  const voetRail = blok(bak, m.frame, [0.09, 0.06, 1], [0, 0, 0], 0.02)
  const voetDwars = [blok(bak, m.frame, [0.6, 0.06, 0.08], [0, 0, 0], 0.02), blok(bak, m.frame, [0.6, 0.06, 0.08], [0, 0, 0], 0.02)]
  const verbinding = rekbareBuis(bak, m.frame, 0.03, 14)
  const hefbomen = [hefboom(bak, m), hefboom(bak, m)]
  g.add(zit, rug, zitZuil, rugSteun, achterZuil, balk, voetRail, ...voetDwars, verbinding)
  for (const h of hefbomen) g.add(...h.delen)
  schaduw(g)

  // Stapeltoren rechts naast en achter de machine, met de kabel tot onder de kap.
  const toren = new Group()
  const stapelPlek = new Vector3(-0.78, 0, -0.62)
  const stapel = gewichtsstapel(bak, m, stapelPlek, TOREN_HOOGTE)
  const kabel = kabelStuk(bak, m)
  toren.add(stapel.groep, kabel)
  const afdekker = maakAfdekker(schaduw(toren), m.kopie)
  g.add(toren)
  const kapPlek = new Vector3(stapelPlek.x, TOREN_HOOGTE - 0.03, stapelPlek.z)

  const voorover = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), Math.PI / 2)
  const slag = new Slag()
  const waarde = (f: Figuur) => f.handen[0].pos.y + f.handen[1].pos.y
  const rust = new Vector3()
  const zitPlek = new Vector3()
  const rugPlek = new Vector3()
  const draai = new Vector3()
  const knik = new Vector3()
  const buiten = new Vector3()
  return {
    groep: g,
    meet(f) {
      slag.meet(waarde(f))
    },
    zet(f) {
      // Zitting en rugleuning onder het lichaam, zoals bij de andere machines.
      zitPlek.set(0, f.bekken.pos.y - 0.105, f.bekken.pos.z + 0.08)
      zit.position.copy(zitPlek)
      rugPlek.set(0, 0.31, -0.12).applyQuaternion(f.lende.rot).add(f.lende.pos)
      rug.position.copy(rugPlek)
      rug.quaternion.copy(f.lende.rot).multiply(voorover)
      zitZuil.scale.y = Math.max(0.05, zitPlek.y - 0.13)
      zitZuil.position.set(0, zitZuil.scale.y / 2 + 0.06, zitPlek.z - 0.05)

      // Linkerschouder in rust (zonder het optrekken van de schouderbladen): daar hoort de machine bij.
      rust.set(MATEN.schouder.x, MATEN.schouder.y, MATEN.schouder.z).applyQuaternion(f.borst.rot).add(f.borst.pos)
      const as = { y: rust.y + SCHOUDERPRESS.draaipunt.dy, z: rust.z + SCHOUDERPRESS.draaipunt.dz }
      const naafX = rust.x + SCHOUDERPRESS.draaipunt.dx

      // Achterframe: zuil van de vloer tot de dwarsbalk, voetrail naar voren onder de zitting.
      achterZuil.scale.y = as.y + 0.05
      achterZuil.position.set(0, achterZuil.scale.y / 2, as.z - 0.06)
      balk.scale.y = 2 * BALK
      balk.position.set(0, as.y, as.z)
      const voor = zitPlek.z + 0.22
      const achter = as.z - 0.12
      voetRail.scale.z = voor - achter
      voetRail.position.set(0, 0.03, (voor + achter) / 2)
      voetDwars[0].position.set(0, 0.03, achter)
      voetDwars[1].position.set(0, 0.03, voor - 0.04)
      // Rugleuning op een steun naar de achterzuil, zitting op de voetrail.
      legTussen(rugSteun, new Vector3(0, -0.05, -0.1).applyQuaternion(f.lende.rot).add(rugPlek), new Vector3(0, zitPlek.y - 0.09, as.z - 0.06), true)
      // De dwarsbalk loopt door tot het frame van de stapeltoren.
      legTussen(verbinding, new Vector3(stapelPlek.x + 0.19, as.y, stapelPlek.z), new Vector3(-BALK, as.y, as.z), true)

      f.handen.forEach((hand, i) => {
        const kant = i === 0 ? 1 : -1
        const h = hefbomen[i]
        draai.set(naafX * kant, as.y, as.z)
        h.naaf.position.copy(draai)
        // Greep langs x op de hand, met het kapje aan de binnenkant.
        h.greep.position.copy(hand.pos)
        h.kap.position.copy(hand.pos).add(new Vector3((-GREEP_LENGTE / 2 - 0.006) * kant, 0, 0))
        // Hefboom: van het buiteneind van de greep een kort stuk naar buiten, dan in een rechte lijn naar de naaf.
        buiten.copy(hand.pos).add(new Vector3((GREEP_LENGTE / 2) * kant, 0, 0))
        knik.set(draai.x, buiten.y, buiten.z)
        legTussen(h.uitloop, buiten, knik, true)
        legTussen(h.arm, knik, draai, true)
      })

      stapel.til(slag.deel(waarde(f)) * 0.3)
      kabel.leg(stapel.aangrijp, kapPlek)
      zetAfdekker(afdekker, f, zicht)
    },
  }
}
