import { describe, expect, it } from 'vitest'
import { Quaternion, Vector3 } from 'three'
import { houdingOp, lusDuur } from './interpolatie'
import { houdingVan } from './beweging'
import { figuurIn, tweeBotten, type Figuur } from './kinematica'
import { GRENZEN } from './maten'
import { OEFENINGEN_3D, PROTOTYPE_3D, oefening3dOpNaam } from './oefeningen'
import { BIBLIOTHEEK_3D } from './bibliotheek'
import { KANALEN, type Oefening3d } from './typen'
import { REPDB_ALLE_KOPPELINGEN } from '../beelden-repdb'
import { coachingVoor } from '../coaching'
import { houding, opTenen, handPlek, enkelPlek } from './bouw/basis'
import { heupIn, schouderIn } from './kinematica'

const STAPPEN = 160

/** Oefeningen die explosief horen te gaan (een swing duurt geen 3 seconden). */
const BALLISTISCH = new Set(['Kettlebell swing'])

function monsters(o: Oefening3d): { t: number; f: Figuur }[] {
  const duur = lusDuur(o.sleutels)
  return Array.from({ length: STAPPEN }, (_, i) => {
    const t = (i / STAPPEN) * duur
    return { t, f: figuurIn(o, houdingVan(o, t)) }
  })
}

describe('3D-oefeningen: data', () => {
  it('heeft de zes oefeningen van het prototype voorop', () => {
    expect(PROTOTYPE_3D.map((o) => o.naam)).toEqual([
      'Back squat',
      'Bankdrukken met barbell',
      'Deadlift',
      'Lat pulldown',
      'Push-up',
      'Dumbbell shoulder press',
    ])
    expect(oefening3dOpNaam('Deadlift')?.last).toBe('hangend')
    expect(oefening3dOpNaam('Bestaat niet')).toBeUndefined()
    expect(OEFENINGEN_3D.slice(0, 6)).toEqual(PROTOTYPE_3D)
  })

  it('heeft minstens twintig extra oefeningen via de bouwstenen, elke naam een keer', () => {
    expect(BIBLIOTHEEK_3D.length).toBeGreaterThanOrEqual(20)
    const namen = OEFENINGEN_3D.map((o) => o.naam)
    expect(new Set(namen).size).toBe(namen.length)
  })

  it.each(OEFENINGEN_3D.map((o) => [o.naam, o] as const))('%s: bestaat met exact deze naam in de bibliotheek en heeft coaching', (naam) => {
    expect(REPDB_ALLE_KOPPELINGEN.some((k) => k.naam === naam)).toBe(true)
    expect(coachingVoor(naam)).not.toBeNull()
  })

  it.each(OEFENINGEN_3D.map((o) => [o.naam, o] as const))('%s: camera kijkt van voren of opzij, op een redelijke afstand', (_, o) => {
    expect(o.camera.afstand).toBeGreaterThanOrEqual(3)
    expect(o.camera.afstand).toBeLessThanOrEqual(6)
    expect(Math.abs(o.camera.hoek)).toBeLessThanOrEqual(120)
    expect(o.camera.hoogte).toBeGreaterThanOrEqual(0)
    expect(o.camera.hoogte).toBeLessThanOrEqual(40)
  })

  it.each(OEFENINGEN_3D.map((o) => [o.naam, o] as const))('%s: elke sleutel zet alle gewrichten en kanalen', (_, o) => {
    expect(o.sleutels.length).toBeGreaterThanOrEqual(2)
    for (const s of o.sleutels) {
      expect(Object.keys(s.houding).sort()).toEqual([...KANALEN].sort())
      for (const k of KANALEN) expect(Number.isFinite(s.houding[k])).toBe(true)
      expect(s.vast).toBeGreaterThanOrEqual(0)
      expect(s.naarVolgende).toBeGreaterThan(0)
    }
  })

  it.each(OEFENINGEN_3D.map((o) => [o.naam, o] as const))('%s: wervelkolom, nek en schouders binnen de grenzen', (_, o) => {
    for (const { houding: h } of o.sleutels) {
      expect(h.lende).toBeGreaterThanOrEqual(GRENZEN.lende.min)
      expect(h.lende).toBeLessThanOrEqual(GRENZEN.lende.max)
      expect(h.borst).toBeGreaterThanOrEqual(GRENZEN.borst.min)
      expect(h.borst).toBeLessThanOrEqual(GRENZEN.borst.max)
      expect(h.nek).toBeGreaterThanOrEqual(GRENZEN.nek.min)
      expect(h.nek).toBeLessThanOrEqual(GRENZEN.nek.max)
      expect(h.schouders).toBeGreaterThanOrEqual(GRENZEN.schouders.min)
      expect(h.schouders).toBeLessThanOrEqual(GRENZEN.schouders.max)
    }
  })

  it.each(OEFENINGEN_3D.map((o) => [o.naam, o] as const))('%s: secundaire spieren staan niet ook bij de primaire, startfractie tussen 0 en 1', (_, o) => {
    for (const d of o.spierenSecundair ?? []) expect(o.spieren).not.toContain(d)
    if (o.start !== undefined) {
      expect(o.start).toBeGreaterThanOrEqual(0)
      expect(o.start).toBeLessThan(1)
    }
  })

  it.each(OEFENINGEN_3D.map((o) => [o.naam, o] as const))('%s: tempo zoals een trainer, met pauze en een herhaling van 2,5 tot 6 seconden (ballistisch korter)', (_, o) => {
    const duur = lusDuur(o.sleutels)
    expect(duur).toBeGreaterThanOrEqual(BALLISTISCH.has(o.naam) ? 1.6 : 2.5)
    expect(duur).toBeLessThanOrEqual(6)
    expect(o.sleutels.some((s) => s.vast > 0)).toBe(true)
  })
})

describe('3D-oefeningen: beweging', () => {
  it.each(OEFENINGEN_3D.map((o) => [o.naam, o] as const))('%s: de nek die getekend wordt (ook met blik) blijft binnen de grenzen', (_, o) => {
    for (const { f } of monsters(o)) {
      const nek = new Quaternion().copy(f.borst.rot).invert().multiply(f.hoofd.rot)
      const graden = (2 * Math.atan2(nek.x, nek.w) * 180) / Math.PI
      expect(graden).toBeGreaterThanOrEqual(GRENZEN.nek.min - 0.01)
      expect(graden).toBeLessThanOrEqual(GRENZEN.nek.max + 0.01)
    }
  })

  it.each(OEFENINGEN_3D.map((o) => [o.naam, o] as const))('%s: knieen, ellebogen en heupen blijven binnen anatomische grenzen', (_, o) => {
    for (const { f } of monsters(o)) {
      for (const b of f.benen) {
        expect(b.buiging).toBeGreaterThanOrEqual(GRENZEN.kniebuiging.min)
        expect(b.buiging).toBeLessThanOrEqual(GRENZEN.kniebuiging.max)
      }
      for (const a of f.armen) {
        expect(a.buiging).toBeGreaterThanOrEqual(GRENZEN.elleboogbuiging.min)
        expect(a.buiging).toBeLessThanOrEqual(GRENZEN.elleboogbuiging.max)
      }
      for (const h of f.heupbuiging) {
        expect(h).toBeGreaterThanOrEqual(GRENZEN.heupbuiging.min)
        expect(h).toBeLessThanOrEqual(GRENZEN.heupbuiging.max)
      }
    }
  })

  it.each(OEFENINGEN_3D.map((o) => [o.naam, o] as const))('%s: voeten blijven op hun plek en handen aan de last', (_, o) => {
    for (const { f } of monsters(o)) {
      f.benen.forEach((b, i) => {
        expect(b.reik).toBeLessThanOrEqual(1.0015)
        expect(b.eind.distanceTo(f.voeten[i].pos)).toBeLessThan(0.002)
        expect(f.voeten[i].pos.y).toBeGreaterThan(0.05)
      })
      for (const a of f.armen) expect(a.reik).toBeLessThanOrEqual(1.0015)
    }
  })

  it.each(OEFENINGEN_3D.map((o) => [o.naam, o] as const))('%s: geen gewricht zakt door de vloer', (_, o) => {
    for (const { f } of monsters(o)) {
      const punten = [f.bekken.pos, f.lende.pos, f.borst.pos, f.hoofd.pos, ...f.benen.flatMap((b) => [b.midden, b.eind]), ...f.armen.flatMap((a) => [a.midden, a.eind])]
      for (const p of punten) expect(p.y).toBeGreaterThan(0.02)
    }
  })

  it.each(OEFENINGEN_3D.map((o) => [o.naam, o] as const))('%s: knieen en ellebogen buigen niet de verkeerde kant op', (_, o) => {
    for (const { f } of monsters(o)) {
      // De knie ligt aan de kant van de knierichting (niet achterstevoren).
      f.benen.forEach((b, i) => {
        const eigen = i === 1 ? o.knieRichtingRechts : undefined
        const k = eigen ?? o.knieRichting
        const r = new Vector3(k.x * (i === 0 || eigen ? 1 : -1), k.y, k.z)
        const lijn = b.eind.clone().sub(b.begin).normalize()
        const uit = b.midden.clone().sub(b.begin)
        uit.sub(lijn.clone().multiplyScalar(uit.dot(lijn)))
        if (b.buiging > 5) expect(uit.dot(r)).toBeGreaterThan(0)
      })
    }
  })

  it.each(OEFENINGEN_3D.map((o) => [o.naam, o] as const))('%s: links en rechts doen hetzelfde (alleen een lunge of eenarmige oefening mag verschillen)', (_, o) => {
    const eenarmig = o.handenRechts !== undefined || o.sleutels.some((s) => s.houding.handRechtsX !== 0 || s.houding.handRechtsY !== 0 || s.houding.handRechtsZ !== 0)
    const asymmetrisch = eenarmig || o.enkelRechts !== undefined || o.sleutels.some((s) => s.houding.stapZ !== 0 || s.houding.stapY !== 0)
    if (asymmetrisch) return
    for (const { f } of monsters(o)) {
      expect(f.benen[0].buiging).toBeCloseTo(f.benen[1].buiging, 3)
      expect(f.armen[0].buiging).toBeCloseTo(f.armen[1].buiging, 3)
    }
  })

  it.each(OEFENINGEN_3D.filter((o) => o.materiaal.some((m) => m.soort === 'stang')).map((o) => [o.naam, o] as const))(
    '%s: de stang gaat niet door het lichaam of de vloer',
    (_, o) => {
      for (const { f } of monsters(o)) {
        const straal = o.materiaal.find((m) => m.soort === 'stang')?.schijven === 1 ? 0.2 : 0.222
        expect(f.last.pos.y).toBeGreaterThanOrEqual(straal)
        // Afstand van de stang (een lijn langs x) tot de as van de romp.
        for (const p of [f.lende.pos, f.borst.pos, f.hoofd.pos]) {
          const afstand = Math.hypot(p.y - f.last.pos.y, p.z - f.last.pos.z)
          expect(afstand).toBeGreaterThan(0.1)
        }
      }
    },
  )

  it.each(OEFENINGEN_3D.map((o) => [o.naam, o] as const))('%s: de beweging loopt vloeiend en sluit naadloos aan', (_, o) => {
    const duur = lusDuur(o.sleutels)
    const dt = 1 / 60
    for (let t = 0; t < duur; t += dt) {
      const a = houdingVan(o, t)
      const b = houdingVan(o, t + dt)
      expect(Math.abs(a.bekkenY - b.bekkenY)).toBeLessThan(0.02)
      expect(Math.abs(a.kantel - b.kantel)).toBeLessThan(BALLISTISCH.has(o.naam) ? 3.5 : 2)
      expect(Math.abs(a.lastY - b.lastY)).toBeLessThan(0.02)
    }
    expect(houdingOp(o.sleutels, duur)).toEqual(houdingOp(o.sleutels, 0))
    expect(houdingOp(o.sleutels, 0)).toEqual(o.sleutels[0].houding)
    const eind = houdingVan(o, duur)
    const begin = houdingVan(o, 0)
    for (const k of KANALEN) expect(eind[k]).toBeCloseTo(begin[k], 6)
  })
})

describe('3D-oefeningen: rekenwerk', () => {
  it('handPlek: de inverse kinematica vindt de arm terug die de bouwsteen bedoelde', () => {
    const h = houding({ bekkenY: 0.944, kantel: 3 })
    const plek = handPlek(h, { heffen: 4, opzij: 7, elleboog: 90, buig: { x: 0, y: 0, z: 1 } })
    const s = schouderIn(h)
    const l = tweeBotten(s, new Vector3(plek.greep, plek.lastY, plek.lastZ), 0.3, 0.35, new Vector3(0, -0.3, -1))
    expect(l.buiging).toBeCloseTo(90, 1)
    // Bovenarm hangt bijna recht omlaag.
    expect(l.midden.y).toBeLessThan(s.y - 0.28)
  })

  it('enkelPlek: dij vooruit en knie 90 graden geeft de enkel recht onder de knie', () => {
    const h = houding({ bekkenY: 0.56, kantel: -10 })
    const e = enkelPlek(h, { heffen: 90, knie: 90 })
    const heup = heupIn(h)
    expect(e.z).toBeCloseTo(heup.z + 0.44, 3)
    expect(e.y).toBeCloseTo(heup.y - 0.43, 3)
  })

  it('opTenen: de enkel gaat omhoog als de hiel omhoog gaat', () => {
    expect(opTenen(0).voetY).toBeCloseTo(0, 6)
    expect(opTenen(30).voetY).toBeGreaterThan(0.05)
    expect(opTenen(-15).voetY).toBeLessThan(0)
  })

  it('tweeBotten houdt de botlengtes vast en buigt naar de gekozen kant', () => {
    const l = tweeBotten(new Vector3(0, 1, 0), new Vector3(0, 0.3, 0.1), 0.44, 0.43, new Vector3(0, 0, 1))
    expect(l.midden.distanceTo(l.begin)).toBeCloseTo(0.44, 5)
    expect(l.midden.distanceTo(l.eind)).toBeCloseTo(0.43, 5)
    expect(l.midden.z).toBeGreaterThan(0.1)
    expect(l.buiging).toBeGreaterThan(0)
  })

  it('tweeBotten strekt uit als het doel te ver is', () => {
    const l = tweeBotten(new Vector3(0, 1, 0), new Vector3(0, -2, 0), 0.44, 0.43, new Vector3(0, 0, 1))
    expect(l.reik).toBeGreaterThan(1)
    expect(l.buiging).toBeLessThan(1)
    expect(l.eind.distanceTo(l.begin)).toBeCloseTo(0.87, 3)
  })

  it('houdingOp weigert een oefening zonder tijd', () => {
    expect(() => houdingOp([], 0)).toThrow()
  })
})
