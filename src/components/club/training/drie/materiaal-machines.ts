// ─── Fit Factory Club, 3D-oefenbeelden: machines ────────────────────────────
// Leg press (45 graden, schijven op hoorns), beenmachine (extension en curl
// zittend) en chest press met een echte gewichtsstapel, en een kuitmachine.
// Zitting en rugleuning volgen de romp (die ligt bij deze machines stil), de
// bewegende delen volgen handen of voeten. Frames van afgeronde buis,
// bekleding met naad, handgrepen naast de zitting waar de handen rusten.

import { Group, LatheGeometry, Mesh, Quaternion, Vector2, Vector3 } from 'three'
import type { Figuur } from '@/lib/club/training/3d/kinematica'
import type { GeoBak } from './vormen'
import { blok, buisPad, cilinder, legTussen, opX, rekbareBuis, schaduw, Slag, voegSamen, type MateriaalMaterialen, type Stuk } from './materiaal-delen'
import { gewichtsstapel, kabelStuk } from './materiaal-stapel'
import { losseSchijf } from './materiaal-vrij'
import { maakAfdekker, zetAfdekker, type Zicht } from './materiaal-zicht'

export type { Stuk } from './materiaal-delen'

const GRAAD = Math.PI / 180
const Z = new Vector3(0, 0, 1)

/** Kussen met bekleding op een kunststof plaat; bovenvlak op lokaal y = 0. */
function pad(bak: GeoBak, m: MateriaalMaterialen, breedte: number, lengte: number, dikte = 0.075): Group {
  const g = new Group()
  g.add(blok(bak, m.kussen, [breedte, dikte, lengte], [0, -dikte / 2, 0], 0.034))
  g.add(blok(bak, m.kunststof, [breedte - 0.03, 0.014, lengte - 0.03], [0, -dikte - 0.006, 0], 0.005))
  return g
}

/** Stapeltoren naast de machine; de kabel verdwijnt bovenin onder de kap. */
function toren(bak: GeoBak, m: MateriaalMaterialen, plek: Vector3, hoogte: number, zicht: Zicht): { groep: Group; zet(lift: number, f: Figuur): void } {
  const g = new Group()
  const stapel = gewichtsstapel(bak, m, plek, hoogte)
  const kabel = kabelStuk(bak, m)
  g.add(stapel.groep, kabel)
  const afdekker = maakAfdekker(schaduw(g), m.kopie)
  const kap = new Vector3(plek.x, plek.y + hoogte - 0.03, plek.z)
  return {
    groep: g,
    zet(lift, f) {
      stapel.til(lift)
      kabel.leg(stapel.aangrijp, kap)
      zetAfdekker(afdekker, f, zicht)
    },
  }
}

// ── Stoel: zitting en rugleuning onder het stilliggende lichaam ─────────────

interface StoelOpties {
  /** Kanteling van de zitting (graden, positief = voorkant omhoog). */
  readonly zitKantel?: number
  readonly rugLengte?: number
  /** Handgrepen naast de zitting (niet bij een machine waar de handen al een greep hebben). */
  readonly handgrepen?: boolean
}

function stoel(bak: GeoBak, m: MateriaalMaterialen, opties: StoelOpties = {}): Stuk {
  const g = new Group()
  const zit = pad(bak, m, 0.38, 0.42, 0.075)
  const rug = pad(bak, m, 0.32, opties.rugLengte ?? 0.68, 0.075)
  const zuil = blok(bak, m.frame, [0.075, 1, 0.075], [0, 0, 0], 0.02)
  const rugZuil = rekbareBuis(bak, m.frame, 0.032, 16)
  const voet = new Group()
  voet.add(blok(bak, m.frame, [0.5, 0.05, 0.56], [0, 0.03, 0], 0.022))
  for (const x of [-0.22, 0.22]) for (const z of [-0.25, 0.25]) voet.add(blok(bak, m.greep, [0.06, 0.012, 0.06], [x, 0.006, z], 0.004))
  const grepen = [0, 1].map(() => opX(cilinder(bak, m.greep, 0.018, 0.12, 16)))
  const steunen = [0, 1].map(() => rekbareBuis(bak, m.frame, 0.016, 12))
  const metGrepen = opties.handgrepen ?? true
  g.add(zit, rug, zuil, rugZuil, voet)
  if (metGrepen) g.add(...grepen, ...steunen)
  const kantel = (opties.zitKantel ?? 0) * GRAAD
  const plek = new Vector3()
  const rugPlek = new Vector3()
  const voorover = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), Math.PI / 2)
  return {
    groep: schaduw(g),
    zet(f: Figuur) {
      plek.set(0, f.bekken.pos.y - 0.105, f.bekken.pos.z + 0.08)
      zit.position.copy(plek)
      zit.rotation.x = -kantel
      rugPlek.set(0, 0.27, -0.12).applyQuaternion(f.lende.rot).add(f.lende.pos)
      rug.position.copy(rugPlek)
      rug.quaternion.copy(f.lende.rot).multiply(voorover)
      voet.position.set(0, 0, plek.z - 0.05)
      zuil.scale.y = Math.max(0.05, plek.y - 0.13)
      zuil.position.set(0, zuil.scale.y / 2 + 0.05, plek.z - 0.05)
      const onderRug = new Vector3(0, -0.2, -0.1).applyQuaternion(f.lende.rot).add(rugPlek)
      legTussen(rugZuil, onderRug, new Vector3(0, plek.y - 0.1, plek.z - 0.1), true)
      // Handgrepen naast de zitting, precies waar de handen rusten.
      if (metGrepen) f.handen.forEach((hand, i) => {
        grepen[i].position.copy(hand.pos)
        legTussen(steunen[i], new Vector3(hand.pos.x * 1.2, hand.pos.y - 0.01, hand.pos.z), new Vector3(Math.sign(hand.pos.x) * 0.2, plek.y - 0.09, plek.z), true)
      })
    },
  }
}

// ── Leg press ───────────────────────────────────────────────────────────────

export function legPress(bak: GeoBak, m: MateriaalMaterialen, hoek: number): Stuk {
  const g = new Group()
  const a = hoek * GRAAD
  const richting = new Vector3(0, Math.sin(a), Math.cos(a))
  const draai = new Quaternion().setFromUnitVectors(Z, richting)
  const st = stoel(bak, m, { zitKantel: hoek > 20 ? 18 : 4, rugLengte: 0.74 })
  // Rails: rechthoekige liggers met een verchroomde geleidestang erop.
  const railBegin = new Vector3(0, 0.36, 0.42)
  const lengte = 1.34
  const rails = new Group()
  for (const x of [-0.27, 0.27]) {
    rails.add(blok(bak, m.frame, [0.07, 0.06, lengte], [x, 0, 0], 0.02))
    const geleider = cilinder(bak, m.staal, 0.013, lengte - 0.06, 14)
    geleider.rotation.x = Math.PI / 2
    geleider.position.set(x, 0.045, 0)
    rails.add(geleider)
  }
  rails.position.copy(railBegin).addScaledVector(richting, lengte / 2)
  rails.quaternion.copy(draai)
  // Onderstel: gebogen buisframe op de vloer en schuine steunen.
  const top = railBegin.clone().addScaledVector(richting, lengte)
  const v = (x: number, y: number, z: number) => new Vector3(x, y, z)
  for (const x of [-0.27, 0.27]) {
    g.add(buisPad(bak, m.frame, [v(x, 0.03, -0.62), v(x, 0.03, top.z + 0.12), v(x, top.y - 0.02, top.z + 0.02)], 0.035, 0.14))
    g.add(buisPad(bak, m.frame, [v(x, 0.03, railBegin.z + 0.05), v(x, railBegin.y - 0.03, railBegin.z)], 0.03, 0.05))
    g.add(blok(bak, m.greep, [0.08, 0.015, 0.08], [x, 0.008, -0.6], 0.005))
    g.add(blok(bak, m.greep, [0.08, 0.015, 0.08], [x, 0.008, top.z + 0.1], 0.005))
  }
  g.add(blok(bak, m.frame, [0.62, 0.06, 0.07], [0, 0.035, top.z + 0.1], 0.02))
  g.add(blok(bak, m.frame, [0.62, 0.06, 0.07], [0, 0.035, -0.55], 0.02))
  g.add(blok(bak, m.frame, [0.08, 0.06, 0.95], [0, 0.035, -0.1], 0.02))
  // Slede: voetplaat met antislip, wagen met lagerblokken en schijfhoorns.
  const slede = new Group()
  slede.add(blok(bak, m.frame, [0.68, 0.58, 0.03], [0, 0, 0.0], 0.014))
  slede.add(blok(bak, m.mat, [0.64, 0.54, 0.008], [0, 0, -0.018], 0.004))
  slede.add(blok(bak, m.accent, [0.64, 0.012, 0.01], [0, -0.26, -0.022], 0.003))
  slede.add(blok(bak, m.frame, [0.64, 0.14, 0.3], [0, -0.21, 0.17], 0.03))
  for (const x of [-0.27, 0.27]) slede.add(blok(bak, m.kunststof, [0.1, 0.06, 0.26], [x, -0.275, 0.17], 0.015))
  for (const x of [-1, 1]) {
    const hoorn = opX(cilinder(bak, m.staal, 0.025, 0.22, 18))
    hoorn.position.set(0.43 * x, -0.15, 0.2)
    slede.add(hoorn)
    let px = 0.34
    for (const nummer of [0, 1]) {
      const s = opX(losseSchijf(bak, m, nummer))
      const dikte = s.userData.dikte as number
      s.position.set((px + dikte / 2) * x, -0.15, 0.2)
      slede.add(s)
      px += dikte + 0.003
    }
  }
  g.add(st.groep, rails, slede)
  schaduw(g)
  voegSamen(g, bak, false)
  voegSamen(rails, bak)
  const midden = new Vector3()
  return {
    groep: g,
    zet(f, h) {
      st.zet(f, h)
      // Het plateau ligt tegen de zolen: iets voorbij de enkels in de bewegingsrichting.
      midden.copy(f.voeten[0].pos).add(f.voeten[1].pos).multiplyScalar(0.5)
      slede.position.copy(midden).addScaledVector(richting, 0.1)
      slede.quaternion.copy(draai)
    },
  }
}

// ── Beenmachine: leg extension en leg curl zittend ──────────────────────────

/** Naaf van een draaipunt: frame-kleur met een smalle ring in de accentkleur. */
function nok(bak: GeoBak, m: MateriaalMaterialen, straal = 0.045): Group {
  const g = new Group()
  const vorm = [[0.001, -0.022], [straal - 0.004, -0.022], [straal, -0.017], [straal, 0.017], [straal - 0.004, 0.022], [0.001, 0.022]]
  g.add(opX(new Mesh(bak.houd(new LatheGeometry(vorm.map(([x, y]) => new Vector2(x, y)), 32)), m.frame)))
  const ring = opX(cilinder(bak, m.accent, straal * 0.55, 0.048, 24))
  g.add(ring)
  return g
}

export function beenMachine(bak: GeoBak, m: MateriaalMaterialen, variant: 'extension' | 'curl', zicht: Zicht): Stuk {
  const g = new Group()
  const st = stoel(bak, m, { rugLengte: 0.66 })
  const rol = opX(cilinder(bak, m.kussen, 0.058, 0.38, 28))
  const rolAs = opX(cilinder(bak, m.staal, 0.014, 0.44, 12))
  const hefboom = rekbareBuis(bak, m.frame, 0.028, 14)
  const draaipunt = nok(bak, m, 0.05)
  const huis = opX(cilinder(bak, m.frame, 0.062, 0.05, 28))
  const zuil = rekbareBuis(bak, m.frame, 0.03, 14)
  const dijRol = opX(cilinder(bak, m.kussen, 0.052, 0.38, 28))
  const dijPaal = rekbareBuis(bak, m.frame, 0.022, 12)
  const t = toren(bak, m, new Vector3(-0.66, 0, -0.18), 1.4, zicht)
  g.add(st.groep, rol, rolAs, hefboom, draaipunt, huis, zuil, t.groep)
  if (variant === 'curl') g.add(dijRol, dijPaal)
  schaduw(g)
  const scheen = new Vector3()
  const normaal = new Vector3()
  const kant = 0.29
  const slag = new Slag()
  const waarde = (f: Figuur) => {
    scheen.copy(f.voeten[0].pos).sub(f.benen[0].midden).normalize()
    const hoek = Math.atan2(scheen.z, -scheen.y)
    return variant === 'extension' ? hoek : -hoek
  }
  return {
    groep: g,
    meet(f) {
      slag.meet(waarde(f))
    },
    zet(f, h) {
      st.zet(f, h)
      const knie = f.benen[0].midden
      const enkel = f.voeten[0].pos
      t.zet(slag.deel(waarde(f)) * 0.3, f)
      scheen.copy(enkel).sub(knie).normalize()
      normaal.set(0, scheen.z, -scheen.y)
      if (variant === 'curl') normaal.negate()
      const rolPlek = new Vector3(0, enkel.y, enkel.z).addScaledVector(normaal, 0.09).addScaledVector(scheen, -0.02)
      rol.position.copy(rolPlek)
      rolAs.position.set(0.08, rolPlek.y, rolPlek.z)
      const as = new Vector3(kant, knie.y, knie.z)
      draaipunt.position.copy(as)
      huis.position.set(kant + 0.04, knie.y, knie.z)
      legTussen(zuil, new Vector3(kant + 0.04, knie.y, knie.z), new Vector3(0.2, f.bekken.pos.y - 0.2, f.bekken.pos.z + 0.08), true)
      legTussen(hefboom, as, new Vector3(kant, rolPlek.y, rolPlek.z), true)
      dijRol.position.set(0, knie.y + 0.115, knie.z - 0.08)
      legTussen(dijPaal, new Vector3(kant, knie.y + 0.115, knie.z - 0.08), new Vector3(kant, knie.y + 0.02, knie.z - 0.02), true)
    },
  }
}

// ── Chest press ─────────────────────────────────────────────────────────────

export function chestPress(bak: GeoBak, m: MateriaalMaterialen, zicht: Zicht): Stuk {
  const g = new Group()
  const st = stoel(bak, m, { rugLengte: 0.78, handgrepen: false })
  const hefbomen = [rekbareBuis(bak, m.frame, 0.026, 14), rekbareBuis(bak, m.frame, 0.026, 14)]
  const armen = [rekbareBuis(bak, m.frame, 0.022, 14), rekbareBuis(bak, m.frame, 0.022, 14)]
  const grepen = [cilinder(bak, m.greep, 0.019, 0.15, 16), cilinder(bak, m.greep, 0.019, 0.15, 16)]
  const kappen = [cilinder(bak, m.accent, 0.022, 0.012, 16), cilinder(bak, m.accent, 0.022, 0.012, 16)]
  const draaiAs = opX(cilinder(bak, m.staal, 0.035, 0.94, 20))
  const naven = [nok(bak, m), nok(bak, m)]
  const zuil = blok(bak, m.frame, [0.1, 1, 0.1], [0, 0, 0], 0.025)
  const t = toren(bak, m, new Vector3(-0.66, 0, -0.28), 1.55, zicht)
  g.add(st.groep, ...hefbomen, ...armen, ...grepen, ...kappen, draaiAs, ...naven, zuil, t.groep)
  schaduw(g)
  const draaipunt = new Vector3()
  const slag = new Slag()
  const waarde = (f: Figuur) => f.handen[0].pos.z + f.handen[1].pos.z
  return {
    groep: g,
    meet(f) {
      slag.meet(waarde(f))
    },
    zet(f, h) {
      st.zet(f, h)
      t.zet(slag.deel(waarde(f)) * 0.28, f)
      // Draaipunt boven en achter de schouders, ligt stil met de romp.
      const schouder = f.armen[0].begin
      draaipunt.set(0, schouder.y + 0.42, schouder.z - 0.22)
      draaiAs.position.copy(draaipunt)
      zuil.scale.y = draaipunt.y
      zuil.position.set(0, draaipunt.y / 2, draaipunt.z - 0.03)
      f.handen.forEach((hand, i) => {
        const z = i === 0 ? 1 : -1
        const naaf = new Vector3(draaipunt.x + 0.44 * z, draaipunt.y, draaipunt.z)
        naven[i].position.copy(naaf)
        grepen[i].position.copy(hand.pos)
        kappen[i].position.copy(hand.pos).add(new Vector3(0, 0.081, 0))
        // Hefboom in twee stukken: vanaf de naaf schuin naar voren, dan omlaag naar de greep.
        const knik = new Vector3(hand.pos.x * 1.25, hand.pos.y + 0.16, hand.pos.z - 0.04)
        legTussen(hefbomen[i], naaf, knik, true)
        legTussen(armen[i], knik, hand.pos.clone().add(new Vector3(0, 0.075, 0)), true)
      })
    },
  }
}

// ── Kuitmachine staand ──────────────────────────────────────────────────────

export function kuitMachine(bak: GeoBak, m: MateriaalMaterialen, plek: Vector3, zicht: Zicht): Stuk {
  const g = new Group()
  const vast = new Group()
  vast.position.copy(plek)
  // Verhoging onder de voorvoeten (bovenkant 0,075 m)
  vast.add(blok(bak, m.frame, [0.6, 0.06, 0.22], [0, 0.03, 0], 0.012))
  vast.add(blok(bak, m.mat, [0.58, 0.016, 0.2], [0, 0.067, 0], 0.006))
  vast.add(blok(bak, m.accent, [0.58, 0.006, 0.014], [0, 0.074, -0.1], 0.002))
  vast.add(blok(bak, m.frame, [0.9, 0.05, 0.9], [0, 0.025, -0.3], 0.02))
  for (const x of [-0.36, 0.36]) vast.add(blok(bak, m.frame, [0.075, 2.0, 0.075], [x, 1.0, -0.62], 0.02))
  vast.add(blok(bak, m.frame, [0.8, 0.07, 0.1], [0, 2.0, -0.62], 0.02))
  g.add(voegSamen(schaduw(vast), bak))
  const t = toren(bak, m, new Vector3(0.62, 0, -0.62).add(plek), 1.7, zicht)
  const kussens = [0, 1].map(() => blok(bak, m.kussen, [0.12, 0.075, 0.26], [0, 0, 0], 0.034))
  const balk = blok(bak, m.frame, [0.8, 0.07, 0.07], [0, 0, 0], 0.02)
  const armen = [rekbareBuis(bak, m.frame, 0.024, 14), rekbareBuis(bak, m.frame, 0.024, 14)]
  const grepen = [cilinder(bak, m.greep, 0.018, 0.13, 16), cilinder(bak, m.greep, 0.018, 0.13, 16)]
  const steunen = [rekbareBuis(bak, m.frame, 0.016, 12), rekbareBuis(bak, m.frame, 0.016, 12)]
  g.add(...kussens, balk, ...armen, ...grepen, ...steunen, t.groep)
  schaduw(g)
  const slag = new Slag()
  const waarde = (f: Figuur) => f.armen[0].begin.y
  return {
    groep: g,
    meet(f) {
      slag.meet(waarde(f))
    },
    zet(f) {
      t.zet(slag.deel(waarde(f)) * 0.12, f)
      f.armen.forEach((arm, i) => {
        const k = kussens[i]
        k.position.copy(arm.begin).add(new Vector3(0, 0.085, 0))
        grepen[i].position.copy(f.handen[i].pos)
        legTussen(steunen[i], f.handen[i].pos.clone().add(new Vector3(0, 0.06, 0)), k.position, true)
      })
      const y = kussens[0].position.y + 0.02
      balk.position.set(0, y, plek.z - 0.62)
      kussens.forEach((k, i) => legTussen(armen[i], new Vector3(0.36 * (i === 0 ? 1 : -1), y, plek.z - 0.62), k.position, true))
    },
  }
}
