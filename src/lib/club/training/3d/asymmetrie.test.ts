import { describe, expect, it } from 'vitest'
import { Quaternion, Vector3 } from 'three'
import { houdingVan } from './beweging'
import { lusDuur } from './interpolatie'
import { figuurIn, handDoelen, handModus, polsDraai, type Figuur } from './kinematica'
import { GRENZEN, MATEN } from './maten'
import { OEFENINGEN_3D, oefening3dOpNaam } from './oefeningen'
import { houding, rechtsHangend, rechtsNaar } from './bouw/basis'
import type { Houding, Oefening3d } from './typen'

const STAPPEN = 200
const GREEP_VOOR = MATEN.greepVoor

function monsters(o: Oefening3d, n = STAPPEN): { h: Houding; f: Figuur }[] {
  const duur = lusDuur(o.sleutels)
  return Array.from({ length: n + 1 }, (_, i) => {
    const h = houdingVan(o, (i / n) * duur)
    return { h, f: figuurIn(o, h) }
  })
}

function oefening(naam: string): Oefening3d {
  const o = oefening3dOpNaam(naam)
  if (!o) throw new Error(`Onbekende oefening: ${naam}`)
  return o
}

/** Assen van een handframe in de wereld. */
function assen(q: Quaternion): { x: Vector3; y: Vector3; z: Vector3 } {
  return { x: new Vector3(1, 0, 0).applyQuaternion(q), y: new Vector3(0, 1, 0).applyQuaternion(q), z: new Vector3(0, 0, 1).applyQuaternion(q) }
}

function isAsymmetrisch(o: Oefening3d): boolean {
  if (o.enkelRechts || o.voetRechts || o.handenRechts || o.knieRichtingRechts || o.elleboogRichtingRechts) return true
  return o.sleutels.some(({ houding: h }) => h.stapY !== 0 || h.stapZ !== 0 || h.stapKantel !== 0 || h.handRechtsX !== 0 || h.handRechtsY !== 0 || h.handRechtsZ !== 0 || h.draaiRechts !== 0)
}

const SYMMETRISCH = OEFENINGEN_3D.filter((o) => !isAsymmetrisch(o))
const GREEP = OEFENINGEN_3D.filter((o) => o.handen === 'greep')

describe('3D-oefeningen: asymmetrie', () => {
  it('zonder eigen instellingen zijn links en rechts elkaars spiegelbeeld, ook de handen', () => {
    expect(SYMMETRISCH.length).toBeGreaterThan(60)
    for (const o of SYMMETRISCH) {
      for (const { f } of monsters(o, 24)) {
        const [l, r] = f.armen
        expect(r.eind.x).toBeCloseTo(-l.eind.x, 4)
        expect(r.eind.y).toBeCloseTo(l.eind.y, 4)
        expect(r.midden.z).toBeCloseTo(l.midden.z, 4)
        // Gespiegelde hand: x blijft (pinkkant), y en z spiegelen in x.
        const a = assen(f.handen[0].rot)
        const b = assen(f.handen[1].rot)
        expect(b.x.distanceTo(new Vector3(a.x.x, -a.x.y, -a.x.z))).toBeLessThan(1e-3)
        expect(b.y.distanceTo(new Vector3(-a.y.x, a.y.y, a.y.z))).toBeLessThan(1e-3)
        expect(b.z.distanceTo(new Vector3(-a.z.x, a.z.y, a.z.z))).toBeLessThan(1e-3)
      }
    }
  })

  it('rechtsNaar zet alleen de rechterhand op een eigen plek', () => {
    const o = oefening('Dumbbell curl')
    const h = o.sleutels[0].houding
    const doel = { x: -0.25, y: 0.9, z: 0.2 }
    const los = rechtsNaar(o, h, doel)
    const [links, rechts] = handDoelen(o, los)
    expect(rechts.distanceTo(new Vector3(doel.x, doel.y, doel.z))).toBeLessThan(1e-9)
    expect(links.distanceTo(handDoelen(o, h)[0])).toBeLessThan(1e-9)
    const f = figuurIn(o, los)
    expect(f.handen[1].pos.distanceTo(new Vector3(doel.x, doel.y, doel.z))).toBeLessThan(0.002)
  })

  it('rechtsHangend laat de vrije arm ontspannen langs het lichaam hangen', () => {
    const o = oefening('Dumbbell curl')
    const h = rechtsHangend(o, houding({ ...o.sleutels[0].houding, lastY: 1.3, lastZ: 0.3 }))
    const f = figuurIn(o, h)
    expect(f.armen[1].reik).toBeLessThan(1)
    expect(f.armen[1].buiging).toBeLessThan(25)
    expect(f.armen[1].eind.y).toBeLessThan(f.armen[1].begin.y - 0.5)
  })

  it('Concentratiecurl: de linkerarm curlt, de rechterhand steunt stil op de knie', () => {
    const o = oefening('Concentratiecurl')
    expect(o.handenRechts).toBe('plat')
    expect(o.materiaal.find((m) => m.soort === 'halters')?.zijde).toBe('links')
    const m = monsters(o)
    const links = m.map(({ f }) => f.armen[0].buiging)
    expect(Math.max(...links) - Math.min(...links)).toBeGreaterThan(90)
    for (const { f } of m) {
      const knie = f.benen[1].midden
      const pols = f.armen[1].eind
      expect(f.armen[1].reik).toBeLessThan(1)
      expect(pols.distanceTo(knie)).toBeLessThan(0.12)
      expect(pols.y).toBeGreaterThan(knie.y)
      // De elleboog blijft tegen de binnenkant van de linkerdij.
      const dij = f.benen[0]
      expect(f.armen[0].midden.x).toBeLessThan(dij.midden.x + 0.02)
      expect(f.armen[0].midden.distanceTo(dij.midden)).toBeLessThan(0.24)
    }
  })
})

describe('3D-oefeningen: polsrotatie', () => {
  it.each(GREEP.map((o) => [o.naam, o] as const))('%s: de handen draaien vloeiend (geen sprong tussen twee beelden)', (_, o) => {
    let vorige: Figuur | null = null
    for (const { f } of monsters(o)) {
      if (vorige) {
        for (let i = 0; i < 2; i++) expect((f.handen[i].rot.angleTo(vorige.handen[i].rot) * 180) / Math.PI).toBeLessThan(20)
      }
      vorige = f
    }
  })

  it.each(OEFENINGEN_3D.filter((o) => o.greepAnatomisch).map((o) => [o.naam, o] as const))('%s: polsdraai binnen anatomische grenzen', (_, o) => {
    for (const { h } of monsters(o, 60)) {
      for (let i = 0; i < 2; i++) {
        const plat = (i === 1 ? o.handenRechts ?? o.handen : o.handen) === 'plat'
        if (plat) continue
        expect(polsDraai(h, i)).toBeGreaterThanOrEqual(GRENZEN.draai.min)
        expect(polsDraai(h, i)).toBeLessThanOrEqual(GRENZEN.draai.max)
      }
    }
  })

  it('de greep zit in de vuist: net aan de handpalmkant van de as van de onderarm', () => {
    for (const o of GREEP) {
      for (const { f } of monsters(o, 12)) {
        for (let i = 0; i < 2; i++) {
          if (handModus(o, i) === 'plat') continue
          const a = f.armen[i]
          const onder = a.eind.clone().sub(a.midden).normalize()
          const naarGreep = f.handen[i].pos.clone().sub(a.midden)
          const loodrecht = naarGreep.sub(onder.clone().multiplyScalar(naarGreep.dot(onder)))
          expect(loodrecht.length()).toBeCloseTo(GREEP_VOOR, 3)
          expect(loodrecht.normalize().dot(assen(f.handen[i].rot).z)).toBeGreaterThan(0.999)
        }
      }
    }
  })

  it('de hand ligt in het verlengde van de onderarm, ook met polsdraai', () => {
    for (const o of GREEP) {
      for (const { f } of monsters(o, 20)) {
        for (let i = 0; i < 2; i++) {
          if (handModus(o, i) === 'plat') continue
          const onder = f.armen[i].eind.clone().sub(f.armen[i].midden).normalize()
          expect(assen(f.handen[i].rot).y.dot(onder), o.naam).toBeGreaterThan(0.999)
        }
      }
    }
  })

  it('Hammer curl: duim boven en handpalmen naar elkaar, de hele baan door', () => {
    for (const naam of ['Hammer curl', 'Hammer curl aan de kabel']) {
      for (const { f } of monsters(oefening(naam), 40)) {
        expect(assen(f.handen[0].rot).z.x).toBeLessThan(-0.7)
        expect(assen(f.handen[1].rot).z.x).toBeGreaterThan(0.7)
      }
    }
  })

  it('neutrale greep met halters: beide handpalmen naar het lichaam, duimen naar voren', () => {
    for (const naam of ['Lateral raise', 'Squat met dumbbells', 'Schouders ophalen met dumbbells', 'Trap bar deadlift']) {
      const f = figuurIn(oefening(naam), oefening(naam).sleutels[0].houding)
      const l = assen(f.handen[0].rot)
      const r = assen(f.handen[1].rot)
      expect(l.z.x).toBeLessThan(-0.7)
      expect(r.z.x).toBeGreaterThan(0.7)
      // Duim: links aan lokaal -x, rechts aan lokaal +x.
      expect(l.x.z).toBeLessThan(-0.7)
      expect(r.x.z).toBeGreaterThan(0.7)
    }
  })

  it('Arnold press: onderin handpalmen naar je toe, bovenin naar voren', () => {
    const o = oefening('Arnold press')
    const m = monsters(o)
    const onder = m.reduce((a, b) => (b.f.handen[0].pos.y < a.f.handen[0].pos.y ? b : a))
    const boven = m.reduce((a, b) => (b.f.handen[0].pos.y > a.f.handen[0].pos.y ? b : a))
    for (let i = 0; i < 2; i++) {
      expect(assen(onder.f.handen[i].rot).z.z).toBeLessThan(-0.7)
      expect(assen(boven.f.handen[i].rot).z.z).toBeGreaterThan(0.7)
    }
    // Onderin de ellebogen voor het lichaam, bovenin opzij.
    expect(onder.f.armen[0].midden.z - onder.f.armen[0].begin.z).toBeGreaterThan(0.08)
    expect(boven.f.armen[0].midden.x - boven.f.armen[0].begin.x).toBeGreaterThan(0.12)
  })
})

describe('3D-oefeningen: lichaamsorientatie', () => {
  const voor = (f: Figuur) => new Vector3(0, 0, 1).applyQuaternion(f.bekken.rot)
  const op = (f: Figuur) => new Vector3(0, 1, 0).applyQuaternion(f.bekken.rot)

  it('zonder rol is het bekken alleen gekanteld, zoals voorheen', () => {
    const f = figuurIn(oefening('Back squat'), houding({ bekkenY: 0.9, kantel: 30 }))
    const q = new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), (30 * Math.PI) / 180)
    expect(f.bekken.rot.angleTo(q)).toBeLessThan(1e-9)
  })

  it('buik, rug en zit: plank kijkt naar de vloer, crunch naar boven, zittend rechtop', () => {
    const plank = figuurIn(oefening('Plank'), oefening('Plank').sleutels[0].houding)
    expect(voor(plank).y).toBeLessThan(-0.9)
    const crunch = figuurIn(oefening('Crunch'), oefening('Crunch').sleutels[0].houding)
    expect(voor(crunch).y).toBeGreaterThan(0.9)
    const zit = figuurIn(oefening('Dumbbell shoulder press'), oefening('Dumbbell shoulder press').sleutels[0].houding)
    expect(op(zit).y).toBeGreaterThan(0.95)
  })

  it('Zijplank: op de linkerzij, op de onderarm, lichaam recht en boven de vloer', () => {
    const o = oefening('Zijplank')
    for (const { f } of monsters(o, 40)) {
      // Voorkant naar -x, linkerkant naar beneden.
      expect(voor(f).x).toBeLessThan(-0.9)
      const links = new Vector3(1, 0, 0).applyQuaternion(f.bekken.rot)
      expect(links.y).toBeLessThan(-0.9)
      expect(f.armen[0].begin.y).toBeLessThan(f.armen[1].begin.y - 0.25)
      // Elleboog onder de schouder, onderarm plat op de vloer.
      const e = f.armen[0].midden
      expect(Math.hypot(e.x - f.armen[0].begin.x, e.z - f.armen[0].begin.z)).toBeLessThan(0.08)
      expect(e.y).toBeLessThan(0.08)
      expect(f.armen[0].eind.y).toBeLessThan(0.05)
      // Voeten op elkaar op de vloer, benen gestrekt.
      expect(f.voeten[0].pos.y).toBeLessThan(0.08)
      expect(f.voeten[1].pos.y).toBeGreaterThan(f.voeten[0].pos.y + 0.05)
      for (const b of f.benen) expect(b.buiging, `knie ${b.buiging.toFixed(1)} reik ${b.reik.toFixed(3)}`).toBeLessThan(12)
      // Heup op de lijn schouder-enkel (geen doorzakkende heup).
      const s = f.armen[0].begin.clone().add(f.armen[1].begin).multiplyScalar(0.5)
      const enkel = f.voeten[0].pos.clone().add(f.voeten[1].pos).multiplyScalar(0.5)
      const heup = f.bekken.pos
      const t = (heup.z - enkel.z) / (s.z - enkel.z)
      expect(Math.abs(heup.y - (enkel.y + (s.y - enkel.y) * t))).toBeLessThan(0.05)
      // Niets door de vloer.
      for (const p of [f.bekken.pos, f.borst.pos, f.hoofd.pos, ...f.benen.map((b) => b.midden)]) expect(p.y).toBeGreaterThan(0.08)
      // Rechterhand op de heup.
      expect(f.armen[1].eind.distanceTo(f.benen[1].begin)).toBeLessThan(0.16)
    }
  })
})
