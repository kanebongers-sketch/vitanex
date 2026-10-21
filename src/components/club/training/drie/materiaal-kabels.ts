// ─── Fit Factory Club, 3D-oefenbeelden: kabelstations ───────────────────────
// Lat pulldown-station (giek met twee katrollen, stapel voor de sporter,
// zitting en beenkussens op de dijen) en een kabelkolom met verstelbare
// slede (hoog) of een lage roeikatrol met voetplaten (laag). De kabel loopt
// echt over de katrollen naar de stapel, en de stapel gaat mee omhoog.

import { Group, Vector3 } from 'three'
import type { Figuur } from '@/lib/club/training/3d/kinematica'
import type { KabelGreep } from '@/lib/club/training/3d/typen'
import type { GeoBak } from './vormen'
import { blok, cilinder, opX, raakPunt, schaduw, Slag, voegSamen, type MateriaalMaterialen, type Stuk } from './materiaal-delen'
import { maakGreep } from './materiaal-grepen'
import { maakAfdekker, zetAfdekker, type Zicht } from './materiaal-zicht'
import { gewichtsstapel, katrol, kabelStuk, richtKatrol, type Stapel } from './materiaal-stapel'

const R = 0.045

interface Wiel {
  readonly midden: Vector3
  readonly mesh: Group
  /** Draait mee met de kabel (slede, losse katrol). */
  readonly zwenkt: boolean
}

interface Route {
  readonly groep: Group
  /** Leg de kabel van `begin` over alle wielen naar `eind`. */
  leg(begin: Vector3, eind: Vector3): void
}

function route(bak: GeoBak, m: MateriaalMaterialen, wielen: readonly Wiel[]): Route {
  const groep = new Group()
  const stukken = wielen.map(() => kabelStuk(bak, m)).concat(kabelStuk(bak, m))
  groep.add(...stukken, ...wielen.map((w) => w.mesh))
  const a = new Vector3()
  const b = new Vector3()
  const van = new Vector3()
  const tot = new Vector3()
  return {
    groep,
    leg(begin, eind) {
      const punten = [begin, ...wielen.map((w) => w.midden), eind]
      wielen.forEach((w, i) => {
        a.copy(punten[i]).sub(w.midden)
        b.copy(punten[i + 2]).sub(w.midden)
        if (w.zwenkt) richtKatrol(w.mesh, a, b)
      })
      for (let i = 0; i < stukken.length; i++) {
        const wVan = wielen[i - 1]
        const wTot = wielen[i]
        if (wVan) raakPunt(wVan.midden, R, a.copy(punten[i + 1]).sub(wVan.midden), b.copy(punten[i - 1]).sub(wVan.midden), van)
        else van.copy(begin)
        if (wTot) raakPunt(wTot.midden, R, a.copy(punten[i]).sub(wTot.midden), b.copy(punten[i + 2]).sub(wTot.midden), tot)
        else tot.copy(eind)
        stukken[i].leg(van, tot)
      }
    },
  }
}

function wiel(bak: GeoBak, m: MateriaalMaterialen, midden: Vector3, zwenkt = false, as?: Vector3): Wiel {
  const mesh = katrol(bak, m, R)
  mesh.position.copy(midden)
  if (as) mesh.quaternion.setFromUnitVectors(new Vector3(1, 0, 0), as.clone().normalize())
  return { midden, mesh, zwenkt }
}

interface Kolom {
  /** Lage, vaste delen (voet, voetplaten). */
  readonly vast: Group
  /** Hoge delen met de stapel: worden doorzichtig als ze het lichaam afdekken. */
  readonly toren: Group
  readonly wielen: Wiel[]
  readonly stapel: Stapel
}

/** Kabelmachine: route, greep en stapel samen, met de slag gemeten over de hele beweging. */
function kabelMachine(bak: GeoBak, m: MateriaalMaterialen, k: Kolom, greepSoort: KabelGreep | 'lat', zicht: Zicht, extra?: (f: Figuur) => void): Stuk {
  const greep = maakGreep(bak, m, greepSoort)
  const r = route(bak, m, k.wielen)
  const eersteWiel = k.wielen[0].midden
  const slag = new Slag()
  const g = new Group()
  const hoog = new Group()
  hoog.add(k.toren, k.stapel.groep)
  g.add(k.vast, hoog, r.groep, greep.groep)
  schaduw(g)
  voegSamen(k.vast, bak, false)
  voegSamen(k.toren, bak)
  const afdekker = maakAfdekker(hoog, m.kopie)
  return {
    groep: g,
    meet(f) {
      greep.zet(f, eersteWiel)
      slag.meet(greep.haak.distanceTo(eersteWiel))
    },
    zet(f) {
      greep.zet(f, eersteWiel)
      const uit = greep.haak.distanceTo(eersteWiel)
      k.stapel.til(Math.min(0.42, slag.deel(uit) * slag.lengte * 0.5))
      r.leg(greep.haak, k.stapel.aangrijp)
      zetAfdekker(afdekker, f, zicht)
      extra?.(f)
    },
  }
}

// ── Lat pulldown ────────────────────────────────────────────────────────────

export function kabelstation(bak: GeoBak, m: MateriaalMaterialen, plek: Vector3, zicht: Zicht): Stuk {
  const vast = new Group()
  vast.position.copy(plek)
  const toren = new Group()
  toren.position.copy(plek)
  const stapelZ = 0.84
  for (const x of [-0.22, 0.22]) {
    vast.add(blok(bak, m.frame, [0.075, 0.055, 1.38], [x, 0.03, 0.42], 0.022))
    for (const z of [-0.27, 1.11]) vast.add(blok(bak, m.greep, [0.08, 0.02, 0.03], [x, 0.01, z], 0.006))
  }
  vast.add(blok(bak, m.frame, [0.52, 0.055, 0.075], [0, 0.03, -0.22], 0.022))
  toren.add(blok(bak, m.frame, [0.13, 2.38, 0.13], [0, 1.19, 1.07], 0.035))
  vast.add(blok(bak, m.frame, [0.12, 0.12, 1.36], [0, 2.32, 0.45], 0.035))
  vast.add(blok(bak, m.accent, [0.122, 0.012, 0.6], [0, 2.32, 0.2], 0.004))
  toren.add(blok(bak, m.frame, [0.4, 0.07, 0.24], [0, 1.66, 0.96], 0.02))
  // Zitpaal en beenpaal (de kussens zelf volgen de dijen).
  vast.add(blok(bak, m.frame, [0.08, 0.38, 0.08], [0, 0.23, 0.06], 0.022))
  const voor = new Vector3(0, 2.2, -0.075).add(plek)
  const achter = new Vector3(0, 2.2, stapelZ - R).add(plek)
  for (const p of [voor, achter]) {
    const beugel = blok(bak, m.frame, [0.05, 0.08, 0.1], [p.x - plek.x, 2.25, p.z - plek.z], 0.012)
    vast.add(beugel)
  }
  const stapel = gewichtsstapel(bak, m, new Vector3(0, 0, stapelZ).add(plek), 1.62, Math.PI)
  const wielen = [wiel(bak, m, voor, true), wiel(bak, m, achter, false, new Vector3(1, 0, 0))]
  // Zitting en beenkussens op maat van het lichaam.
  const zit = blok(bak, m.kussen, [0.38, 0.075, 0.38], [0, 0, 0], 0.034)
  const rollen = [0, 1].map(() => opX(cilinder(bak, m.kussen, 0.052, 0.16, 28)))
  const as = opX(cilinder(bak, m.staal, 0.014, 0.42, 14))
  const paal = blok(bak, m.frame, [0.06, 1, 0.06], [0, 0, 0], 0.016)
  const beenDelen = new Group()
  beenDelen.add(zit, ...rollen, as, paal)
  vast.add(beenDelen)
  const dij = new Vector3()
  return kabelMachine(bak, m, { vast, toren, wielen, stapel }, 'lat', zicht, (f) => {
    zit.position.set(0, f.bekken.pos.y - 0.11, f.bekken.pos.z + 0.05).sub(plek)
    let hoogste = 0
    let zMid = 0
    f.benen.forEach((been, i) => {
      dij.copy(been.begin).lerp(been.midden, 0.8)
      const y = dij.y + 0.072 + 0.052
      hoogste = Math.max(hoogste, y)
      zMid += dij.z / 2
      rollen[i].position.set(Math.sign(dij.x || 1) * 0.11, y, dij.z).sub(plek)
    })
    rollen.forEach((rol) => (rol.position.y = hoogste - plek.y))
    as.position.set(0, hoogste, zMid).sub(plek)
    paal.scale.y = hoogste
    paal.position.set(0, hoogste / 2, zMid + 0.07).sub(plek)
  })
}

// ── Kabelkolom met greep ────────────────────────────────────────────────────

/** Hoge kolom: slede op de katrolhoogte, stapel erachter, kabel over twee wielen bovenin. */
function hogeKolom(bak: GeoBak, m: MateriaalMaterialen, k: Vector3): Kolom {
  const vast = new Group()
  const toren = new Group()
  const kolomZ = k.z + 0.11
  const stapelZ = kolomZ + 0.36
  const top = 2.28
  toren.add(blok(bak, m.frame, [0.09, top, 0.09], [0, top / 2, kolomZ], 0.022))
  toren.add(blok(bak, m.frame, [0.5, 0.08, 0.6], [0, top, (kolomZ + stapelZ) / 2 + 0.03], 0.025))
  vast.add(blok(bak, m.frame, [0.46, 0.05, 0.8], [0, 0.025, (kolomZ + stapelZ) / 2], 0.02))
  // Slede rond de kolom met verstelpen en zwenkbeugel.
  toren.add(blok(bak, m.frame, [0.13, 0.17, 0.13], [0, k.y + 0.07, kolomZ], 0.025))
  const pen = cilinder(bak, m.accent, 0.013, 0.05, 16)
  pen.rotation.z = Math.PI / 2
  pen.position.set(0.085, k.y + 0.07, kolomZ)
  toren.add(pen)
  toren.add(blok(bak, m.frame, [0.05, 0.05, kolomZ - k.z - 0.02], [0, k.y + 0.07, (kolomZ + k.z) / 2 + 0.01], 0.012))
  const boven = new Vector3(0, top - 0.09, kolomZ)
  const overStapel = new Vector3(0, top - 0.09, stapelZ)
  const stapel = gewichtsstapel(bak, m, new Vector3(0, 0, stapelZ), top - 0.04, Math.PI)
  const wielen = [wiel(bak, m, k.clone(), true), wiel(bak, m, boven, false, new Vector3(1, 0, 0)), wiel(bak, m, overStapel, false, new Vector3(1, 0, 0))]
  return { vast, toren, wielen, stapel }
}

/** Lage roeikatrol: voetplaten, kabel onder een kap langs de vloer naar de stapel. */
function lageKolom(bak: GeoBak, m: MateriaalMaterialen, k: Vector3): Kolom {
  const vast = new Group()
  const toren = new Group()
  const stapelZ = k.z + 0.42
  const top = 1.72
  // Paal met de katrol, voetplaten schuin naar de sporter.
  vast.add(blok(bak, m.frame, [0.08, k.y + 0.08, 0.08], [0, (k.y + 0.08) / 2, k.z + 0.07], 0.02))
  for (const x of [-0.13, 0.13]) {
    const plaat = new Group()
    plaat.add(blok(bak, m.frame, [0.13, 0.28, 0.025], [0, 0, 0], 0.01))
    plaat.add(blok(bak, m.greep, [0.12, 0.26, 0.01], [0, 0, -0.016], 0.004))
    plaat.position.set(x, 0.2, k.z - 0.19)
    plaat.rotation.x = 0.49
    vast.add(plaat)
    vast.add(blok(bak, m.frame, [0.04, 0.16, 0.04], [x, 0.08, k.z - 0.12], 0.012))
  }
  vast.add(blok(bak, m.frame, [0.36, 0.05, 0.06], [0, 0.07, k.z - 0.12], 0.016))
  vast.add(blok(bak, m.frame, [0.4, 0.05, stapelZ - k.z + 0.42], [0, 0.025, (stapelZ + k.z) / 2 - 0.02], 0.02))
  vast.add(blok(bak, m.kunststof, [0.12, 0.05, stapelZ - k.z - 0.08], [0, 0.07, (stapelZ + k.z) / 2 + 0.03], 0.018))
  toren.add(blok(bak, m.frame, [0.09, top, 0.09], [0, top / 2, stapelZ + 0.15], 0.022))
  toren.add(blok(bak, m.frame, [0.47, 0.08, 0.3], [0, top, stapelZ + 0.06], 0.025))
  const stapel = gewichtsstapel(bak, m, new Vector3(0, 0, stapelZ), top - 0.04, Math.PI)
  const zijas = new Vector3(1, 0, 0)
  const wielen = [
    wiel(bak, m, k.clone(), false, zijas),
    wiel(bak, m, new Vector3(0, 0.07, k.z + 0.1), false, zijas),
    wiel(bak, m, new Vector3(0, 0.07, stapelZ + 0.1), false, zijas),
    wiel(bak, m, new Vector3(0, top - 0.09, stapelZ + 0.1), false, zijas),
    wiel(bak, m, new Vector3(0, top - 0.09, stapelZ), false, zijas),
  ]
  return { vast, toren, wielen, stapel }
}

export function kabel(bak: GeoBak, m: MateriaalMaterialen, k: Vector3, greep: KabelGreep, zicht: Zicht): Stuk {
  const kolom = k.y > 1.1 ? hogeKolom(bak, m, k) : lageKolom(bak, m, k)
  return kabelMachine(bak, m, kolom, greep, zicht)
}
