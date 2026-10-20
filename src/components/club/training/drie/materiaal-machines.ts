// ─── Fit Factory Club, 3D-oefenbeelden: machines en kabels ──────────────────
// Strakke, vereenvoudigde machines: kabelstation voor de lat pulldown,
// kabeltoren (hoog of laag) met stang, touw, V-greep of handvat, leg press,
// beenmachine (extension en curl zittend), chest press en kuitmachine.
// Zitting en rugleuning volgen de romp (die ligt bij deze machines stil), de
// bewegende delen volgen handen of voeten.

import { Group, Mesh, Quaternion, Vector3 } from 'three'
import type { Figuur } from '@/lib/club/training/3d/kinematica'
import type { KabelGreep } from '@/lib/club/training/3d/typen'
import type { GeoBak } from './vormen'
import {
  blok,
  buis,
  cilinder,
  legTussen,
  opX,
  OMHOOG,
  rekbareBuis,
  schaduw,
  type MateriaalMaterialen,
  type Zetter,
} from './materiaal-delen'

const GRAAD = Math.PI / 180
const Z = new Vector3(0, 0, 1)

export interface Stuk {
  readonly groep: Group
  readonly zet: Zetter
}

function gewichtsstapel(bak: GeoBak, m: MateriaalMaterialen, plek: Vector3, hoogte: number): Group {
  const g = new Group()
  g.position.copy(plek)
  for (const x of [-0.11, 0.11]) g.add(blok(bak, m.frame, [0.05, hoogte, 0.05], [x, hoogte / 2, 0], 0.01))
  g.add(blok(bak, m.frame, [0.3, 0.05, 0.4], [0, 0.025, 0], 0.01))
  g.add(blok(bak, m.frame, [0.3, 0.05, 0.08], [0, hoogte, 0], 0.01))
  g.add(blok(bak, m.schijf, [0.16, 0.48, 0.1], [0, 0.29, 0], 0.012))
  g.add(blok(bak, m.accent, [0.17, 0.012, 0.11], [0, 0.41, 0], 0.004))
  return schaduw(g)
}

// ── Stoel: zitting en rugleuning onder het stilliggende lichaam ─────────────

interface StoelOpties {
  /** Kanteling van de zitting (graden, positief = voorkant omhoog). */
  readonly zitKantel?: number
  readonly rugLengte?: number
}

function stoel(bak: GeoBak, m: MateriaalMaterialen, opties: StoelOpties = {}): Stuk {
  const g = new Group()
  const zit = blok(bak, m.kussen, [0.36, 0.07, 0.4], [0, 0, 0], 0.03)
  const rug = blok(bak, m.kussen, [0.3, opties.rugLengte ?? 0.68, 0.07], [0, 0, 0], 0.03)
  const zuil = rekbareBuis(bak, m.frame, 0.03)
  const rugZuil = rekbareBuis(bak, m.frame, 0.025)
  const voet = blok(bak, m.frame, [0.46, 0.04, 0.5], [0, 0.02, 0], 0.01)
  g.add(zit, rug, zuil, rugZuil, voet)
  const kantel = (opties.zitKantel ?? 0) * GRAAD
  const plek = new Vector3()
  const rugPlek = new Vector3()
  return {
    groep: schaduw(g),
    zet(f: Figuur) {
      plek.set(0, f.bekken.pos.y - 0.14, f.bekken.pos.z + 0.08)
      zit.position.copy(plek)
      zit.rotation.x = -kantel
      rugPlek.set(0, 0.27, -0.155).applyQuaternion(f.lende.rot).add(f.lende.pos)
      rug.position.copy(rugPlek)
      rug.quaternion.copy(f.lende.rot)
      voet.position.set(0, 0.02, plek.z - 0.05)
      legTussen(zuil, new Vector3(0, 0.03, plek.z - 0.05), new Vector3(0, plek.y - 0.03, plek.z - 0.05), true)
      const onderRug = new Vector3(0, -0.2, -0.04).applyQuaternion(f.lende.rot).add(rugPlek)
      legTussen(rugZuil, onderRug, new Vector3(0, plek.y - 0.02, plek.z - 0.1), true)
    },
  }
}

// ── Lat pulldown ────────────────────────────────────────────────────────────

function latStang(bak: GeoBak, m: MateriaalMaterialen): Group {
  const g = new Group()
  g.add(opX(cilinder(bak, m.staalMat, 0.014, 0.82, 16)))
  for (const z of [1, -1]) {
    const greep = opX(cilinder(bak, m.kussen, 0.018, 0.2, 16))
    greep.position.x = 0.4 * z
    g.add(greep)
    g.add(buis(bak, m.staalMat, 0.014, new Vector3(0.5 * z, 0, 0), new Vector3(0.62 * z, -0.06, 0)))
  }
  return schaduw(g)
}

export function kabelstation(bak: GeoBak, m: MateriaalMaterialen, plek: Vector3): Stuk {
  const g = new Group()
  const st = new Group()
  st.position.copy(plek)
  st.add(blok(bak, m.kussen, [0.36, 0.07, 0.36], [0, 0.445, 0.02], 0.03))
  st.add(blok(bak, m.frame, [0.07, 0.42, 0.07], [0, 0.21, 0.08], 0.01))
  for (const x of [-0.11, 0.11]) {
    const rol = opX(cilinder(bak, m.kussen, 0.055, 0.17, 24))
    rol.position.set(x, 0.71, 0.33)
    st.add(rol)
  }
  st.add(blok(bak, m.frame, [0.05, 0.05, 0.4], [0, 0.71, 0.53], 0.01))
  st.add(blok(bak, m.frame, [0.05, 2.25, 0.05], [-0.11, 1.125, 0.78], 0.01))
  st.add(blok(bak, m.frame, [0.05, 2.25, 0.05], [0.11, 1.125, 0.78], 0.01))
  st.add(blok(bak, m.schijf, [0.16, 0.5, 0.1], [0, 0.3, 0.78], 0.012))
  st.add(blok(bak, m.accent, [0.17, 0.012, 0.11], [0, 0.42, 0.78], 0.004))
  st.add(blok(bak, m.frame, [0.32, 0.05, 0.62], [0, 0.03, 0.62], 0.01))
  st.add(blok(bak, m.frame, [0.07, 0.07, 0.95], [0, 2.25, 0.33], 0.012))
  const wiel = opX(cilinder(bak, m.staal, 0.05, 0.03, 24))
  wiel.position.set(0, 2.2, -0.08)
  st.add(wiel)
  const katrol = new Vector3(0, 2.18, -0.06).add(plek)
  const bar = latStang(bak, m)
  const kabel = rekbareBuis(bak, m.kabel, 0.004)
  g.add(schaduw(st), bar, kabel)
  return {
    groep: g,
    zet(f) {
      bar.position.copy(f.last.pos)
      legTussen(kabel, f.last.pos, katrol, true)
    },
  }
}

// ── Kabeltoren met greep ────────────────────────────────────────────────────

function kabelToren(bak: GeoBak, m: MateriaalMaterialen, katrol: Vector3): Group {
  const g = new Group()
  const hoog = katrol.y > 1.1
  const achter = katrol.z + 0.14
  const top = hoog ? Math.max(2.15, katrol.y + 0.2) : 1.7
  for (const x of [-0.13, 0.13]) g.add(blok(bak, m.frame, [0.05, top, 0.05], [x, top / 2, achter], 0.01))
  g.add(blok(bak, m.frame, [0.36, 0.05, 0.5], [0, 0.025, achter], 0.01))
  g.add(blok(bak, m.frame, [0.32, 0.06, 0.08], [0, top, achter], 0.01))
  g.add(blok(bak, m.schijf, [0.18, 0.5, 0.1], [0, 0.3, achter], 0.012))
  g.add(blok(bak, m.accent, [0.19, 0.012, 0.11], [0, 0.42, achter], 0.004))
  // Arm met katrol naar voren
  g.add(blok(bak, m.frame, [0.06, 0.06, achter - katrol.z + 0.04], [0, katrol.y + (hoog ? 0.06 : -0.06), (achter + katrol.z) / 2], 0.01))
  const wiel = opX(cilinder(bak, m.staal, 0.045, 0.03, 24))
  wiel.position.copy(katrol)
  g.add(wiel)
  if (!hoog) {
    // Voetsteunen voor zittend roeien: schuin naar de sporter toe.
    for (const x of [-0.13, 0.13]) {
      const steun = blok(bak, m.kussen, [0.12, 0.26, 0.03], [x, 0.2, katrol.z - 0.19], 0.01)
      steun.rotation.x = 0.49
      g.add(steun)
    }
    g.add(blok(bak, m.frame, [0.36, 0.05, 0.05], [0, 0.1, katrol.z - 0.16], 0.01))
    g.add(blok(bak, m.frame, [0.06, 0.05, achter - katrol.z + 0.2], [0, 0.025, (achter + katrol.z - 0.2) / 2], 0.01))
  }
  return schaduw(g)
}

function kabelGreep(bak: GeoBak, m: MateriaalMaterialen, soort: KabelGreep, katrol: Vector3): Stuk {
  const g = new Group()
  const kabel = rekbareBuis(bak, m.kabel, 0.004)
  g.add(kabel)
  const midden = new Vector3()
  const knoop = new Vector3()
  const naarKatrol = new Vector3()
  if (soort === 'stang') {
    const bar = opX(cilinder(bak, m.staalMat, 0.014, 0.5, 16))
    const huls = opX(cilinder(bak, m.staal, 0.02, 0.04, 16))
    g.add(bar, huls)
    return {
      groep: schaduw(g),
      zet(f) {
        midden.copy(f.handen[0].pos).add(f.handen[1].pos).multiplyScalar(0.5)
        bar.position.copy(midden)
        huls.position.copy(midden)
        legTussen(kabel, midden, katrol, true)
      },
    }
  }
  if (soort === 'touw') {
    const delen = [rekbareBuis(bak, m.kussen, 0.012), rekbareBuis(bak, m.kussen, 0.012)]
    const knoppen = [0, 1].map(() => new Mesh(bak.bol(), m.kussen))
    knoppen.forEach((k) => k.scale.setScalar(0.022))
    const huls = cilinder(bak, m.staal, 0.018, 0.05, 16)
    g.add(...delen, ...knoppen, huls)
    return {
      groep: schaduw(g),
      zet(f) {
        midden.copy(f.handen[0].pos).add(f.handen[1].pos).multiplyScalar(0.5)
        naarKatrol.copy(katrol).sub(midden).normalize()
        knoop.copy(midden).addScaledVector(naarKatrol, 0.17)
        f.handen.forEach((hand, i) => {
          const eind = hand.pos.clone().addScaledVector(OMHOOG.clone().applyQuaternion(hand.rot), -0.05)
          legTussen(delen[i], knoop, eind, true)
          knoppen[i].position.copy(eind)
        })
        legTussen(huls, knoop, knoop.clone().addScaledVector(naarKatrol, 0.05))
        legTussen(kabel, knoop, katrol, true)
      },
    }
  }
  if (soort === 'vgreep') {
    const benen = [rekbareBuis(bak, m.staalMat, 0.012), rekbareBuis(bak, m.staalMat, 0.012)]
    const grepen = [0, 1].map(() => cilinder(bak, m.kussen, 0.017, 0.12, 16))
    g.add(...benen, ...grepen)
    return {
      groep: schaduw(g),
      zet(f) {
        midden.copy(f.handen[0].pos).add(f.handen[1].pos).multiplyScalar(0.5)
        naarKatrol.copy(katrol).sub(midden).normalize()
        knoop.copy(midden).addScaledVector(naarKatrol, 0.13)
        f.handen.forEach((hand, i) => {
          const as = new Vector3(1, 0, 0).applyQuaternion(hand.rot)
          grepen[i].position.copy(hand.pos)
          grepen[i].quaternion.setFromUnitVectors(OMHOOG, as)
          legTussen(benen[i], knoop, hand.pos.clone().addScaledVector(as, 0.06), true)
        })
        legTussen(kabel, knoop, katrol, true)
      },
    }
  }
  const greep = opX(cilinder(bak, m.kussen, 0.018, 0.12, 16))
  g.add(greep)
  return {
    groep: schaduw(g),
    zet(f) {
      greep.position.copy(f.handen[0].pos)
      legTussen(kabel, f.handen[0].pos, katrol, true)
    },
  }
}

export function kabel(bak: GeoBak, m: MateriaalMaterialen, katrol: Vector3, greep: KabelGreep): Stuk {
  const g = new Group()
  const handgreep = kabelGreep(bak, m, greep, katrol)
  g.add(kabelToren(bak, m, katrol), handgreep.groep)
  return { groep: g, zet: handgreep.zet }
}

// ── Leg press ───────────────────────────────────────────────────────────────

export function legPress(bak: GeoBak, m: MateriaalMaterialen, hoek: number): Stuk {
  const g = new Group()
  const a = hoek * GRAAD
  const richting = new Vector3(0, Math.sin(a), Math.cos(a))
  const draai = new Quaternion().setFromUnitVectors(Z, richting)
  const st = stoel(bak, m, { zitKantel: hoek > 20 ? 18 : 4, rugLengte: 0.74 })
  // Rails van onder de stoel schuin omhoog naar voren
  const railBegin = new Vector3(0, 0.36, 0.42)
  const lengte = 1.3
  const rails = new Group()
  for (const x of [-0.27, 0.27]) rails.add(blok(bak, m.frame, [0.055, 0.055, lengte], [x, 0, 0], 0.01))
  rails.position.copy(railBegin).addScaledVector(richting, lengte / 2)
  rails.quaternion.copy(draai)
  // Steunen onder de rails en twee vloerbalken
  const top = railBegin.clone().addScaledVector(richting, lengte)
  for (const x of [-0.27, 0.27]) {
    g.add(blok(bak, m.frame, [0.055, top.y, 0.055], [x, top.y / 2, top.z - 0.04], 0.01))
    g.add(blok(bak, m.frame, [0.055, railBegin.y, 0.055], [x, railBegin.y / 2, railBegin.z], 0.01))
    g.add(blok(bak, m.frame, [0.07, 0.05, top.z + 0.55], [x, 0.025, (top.z - 0.55) / 2], 0.01))
  }
  g.add(blok(bak, m.frame, [0.6, 0.05, 0.07], [0, 0.025, top.z - 0.04], 0.01))
  // Slede: plateau met antislip, wagen erachter met gewichtshoorns
  const slede = new Group()
  slede.add(blok(bak, m.frame, [0.66, 0.56, 0.035], [0, 0, 0], 0.012))
  slede.add(blok(bak, m.mat, [0.6, 0.5, 0.008], [0, 0, -0.02], 0.004))
  slede.add(blok(bak, m.kussen, [0.6, 0.12, 0.28], [0, -0.2, 0.16], 0.012))
  for (const x of [-1, 1]) {
    const hoorn = opX(cilinder(bak, m.staal, 0.02, 0.16, 16))
    hoorn.position.set(0.38 * x, -0.12, 0.2)
    slede.add(hoorn)
    const schijf = opX(cilinder(bak, m.schijf, 0.15, 0.04, 32))
    schijf.position.set(0.4 * x, -0.12, 0.2)
    slede.add(schijf)
  }
  g.add(st.groep, rails, slede)
  schaduw(g)
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

export function beenMachine(bak: GeoBak, m: MateriaalMaterialen, variant: 'extension' | 'curl'): Stuk {
  const g = new Group()
  const st = stoel(bak, m, { rugLengte: 0.62 })
  const rol = opX(cilinder(bak, m.kussen, 0.055, 0.4, 24))
  const hefboom = rekbareBuis(bak, m.frame, 0.026)
  const dwars = opX(cilinder(bak, m.frame, 0.022, 0.12, 12))
  const as = opX(cilinder(bak, m.accent, 0.04, 0.05, 20))
  const dijRol = opX(cilinder(bak, m.kussen, 0.05, 0.4, 24))
  const toren = gewichtsstapel(bak, m, new Vector3(-0.62, 0, -0.15), 1.35)
  g.add(st.groep, rol, hefboom, dwars, as, toren)
  if (variant === 'curl') g.add(dijRol)
  schaduw(g)
  const scheen = new Vector3()
  const normaal = new Vector3()
  const kant = 0.28
  return {
    groep: g,
    zet(f, h) {
      st.zet(f, h)
      const knie = f.benen[0].midden
      const enkel = f.voeten[0].pos
      scheen.copy(enkel).sub(knie).normalize()
      normaal.set(0, scheen.z, -scheen.y)
      if (variant === 'curl') normaal.negate()
      const rolPlek = new Vector3(0, enkel.y, enkel.z).addScaledVector(normaal, 0.085).addScaledVector(scheen, -0.02)
      rol.position.copy(rolPlek)
      const draaipunt = new Vector3(kant, knie.y, knie.z)
      as.position.copy(draaipunt)
      const hefEind = new Vector3(kant, rolPlek.y, rolPlek.z)
      legTussen(hefboom, draaipunt, hefEind, true)
      dwars.position.set(kant - 0.06, rolPlek.y, rolPlek.z)
      dijRol.position.set(0, knie.y + 0.1, knie.z - 0.07)
    },
  }
}

// ── Chest press ─────────────────────────────────────────────────────────────

export function chestPress(bak: GeoBak, m: MateriaalMaterialen): Stuk {
  const g = new Group()
  const st = stoel(bak, m, { rugLengte: 0.74 })
  const hefbomen = [rekbareBuis(bak, m.frame, 0.024), rekbareBuis(bak, m.frame, 0.024)]
  const grepen = [cilinder(bak, m.kussen, 0.019, 0.16, 16), cilinder(bak, m.kussen, 0.019, 0.16, 16)]
  const kappen = [cilinder(bak, m.accent, 0.022, 0.012, 16), cilinder(bak, m.accent, 0.022, 0.012, 16)]
  const draaiAs = opX(cilinder(bak, m.staal, 0.035, 0.9, 20))
  const zuil = rekbareBuis(bak, m.frame, 0.04)
  const toren = gewichtsstapel(bak, m, new Vector3(-0.62, 0, -0.25), 1.5)
  g.add(st.groep, ...hefbomen, ...grepen, ...kappen, draaiAs, zuil, toren)
  schaduw(g)
  const draaipunt = new Vector3()
  return {
    groep: g,
    zet(f, h) {
      st.zet(f, h)
      // Draaipunt boven en achter de schouders, ligt stil met de romp.
      const schouder = f.armen[0].begin
      draaipunt.set(0, schouder.y + 0.42, schouder.z - 0.22)
      draaiAs.position.copy(draaipunt)
      legTussen(zuil, new Vector3(0, 0, draaipunt.z - 0.02), draaipunt, true)
      f.handen.forEach((hand, i) => {
        grepen[i].position.copy(hand.pos)
        kappen[i].position.copy(hand.pos).add(new Vector3(0, 0.085, 0))
        const boven = hand.pos.clone().add(new Vector3(0, 0.08, 0))
        legTussen(hefbomen[i], new Vector3(draaipunt.x + 0.42 * (i === 0 ? 1 : -1), draaipunt.y, draaipunt.z), boven, true)
      })
    },
  }
}

// ── Kuitmachine staand ──────────────────────────────────────────────────────

export function kuitMachine(bak: GeoBak, m: MateriaalMaterialen, plek: Vector3): Stuk {
  const g = new Group()
  const vast = new Group()
  vast.position.copy(plek)
  // Verhoging onder de voorvoeten (bovenkant 0,075 m)
  vast.add(blok(bak, m.kussen, [0.6, 0.075, 0.22], [0, 0.0375, 0], 0.012))
  vast.add(blok(bak, m.accent, [0.6, 0.006, 0.02], [0, 0.074, -0.1], 0.002))
  vast.add(blok(bak, m.frame, [0.9, 0.04, 0.9], [0, 0.02, -0.3], 0.01))
  for (const x of [-0.36, 0.36]) vast.add(blok(bak, m.frame, [0.06, 2.0, 0.06], [x, 1.0, -0.62], 0.01))
  vast.add(blok(bak, m.schijf, [0.18, 0.5, 0.1], [0.5, 0.3, -0.62], 0.012))
  vast.add(blok(bak, m.frame, [0.06, 1.6, 0.06], [0.5, 0.8, -0.62], 0.01))
  g.add(schaduw(vast))
  const kussens = [0, 1].map(() => blok(bak, m.kussen, [0.11, 0.07, 0.24], [0, 0, 0], 0.03))
  const balk = blok(bak, m.frame, [0.8, 0.06, 0.06], [0, 0, 0], 0.01)
  const armen = [rekbareBuis(bak, m.frame, 0.022), rekbareBuis(bak, m.frame, 0.022)]
  const grepen = [cilinder(bak, m.kussen, 0.018, 0.13, 16), cilinder(bak, m.kussen, 0.018, 0.13, 16)]
  const steunen = [rekbareBuis(bak, m.frame, 0.016), rekbareBuis(bak, m.frame, 0.016)]
  g.add(...kussens, balk, ...armen, ...grepen, ...steunen)
  schaduw(g)
  return {
    groep: g,
    zet(f) {
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

