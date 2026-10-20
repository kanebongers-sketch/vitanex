import { describe, expect, it } from 'vitest'
import { Vector3 } from 'three'
import { houdingOp, lusDuur } from './interpolatie'
import { figuurIn, tweeBotten, type Figuur } from './kinematica'
import { GRENZEN } from './maten'
import { OEFENINGEN_3D, oefening3dOpNaam } from './oefeningen'
import { KANALEN, type Oefening3d } from './typen'

const STAPPEN = 160

function monsters(o: Oefening3d): { t: number; f: Figuur }[] {
  const duur = lusDuur(o.sleutels)
  return Array.from({ length: STAPPEN }, (_, i) => {
    const t = (i / STAPPEN) * duur
    return { t, f: figuurIn(o, houdingOp(o.sleutels, t)) }
  })
}

describe('3D-oefeningen: data', () => {
  it('heeft precies de zes oefeningen van het prototype', () => {
    expect(OEFENINGEN_3D.map((o) => o.naam)).toEqual([
      'Back squat',
      'Bankdrukken met barbell',
      'Deadlift',
      'Lat pulldown',
      'Push-up',
      'Dumbbell shoulder press',
    ])
    expect(oefening3dOpNaam('Deadlift')?.last).toBe('hangend')
    expect(oefening3dOpNaam('Bestaat niet')).toBeUndefined()
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

  it.each(OEFENINGEN_3D.map((o) => [o.naam, o] as const))('%s: tempo zoals een trainer, met pauze en een herhaling van 2,5 tot 6 seconden', (_, o) => {
    const duur = lusDuur(o.sleutels)
    expect(duur).toBeGreaterThanOrEqual(2.5)
    expect(duur).toBeLessThanOrEqual(6)
    expect(o.sleutels.some((s) => s.vast > 0)).toBe(true)
  })
})

describe('3D-oefeningen: beweging', () => {
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

  it.each(OEFENINGEN_3D.filter((o) => o.materiaal.some((m) => m.soort === 'stang')).map((o) => [o.naam, o] as const))(
    '%s: de stang gaat niet door het lichaam of de vloer',
    (_, o) => {
      for (const { f } of monsters(o)) {
        expect(f.last.pos.y).toBeGreaterThanOrEqual(0.222)
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
      const a = houdingOp(o.sleutels, t)
      const b = houdingOp(o.sleutels, t + dt)
      expect(Math.abs(a.bekkenY - b.bekkenY)).toBeLessThan(0.02)
      expect(Math.abs(a.kantel - b.kantel)).toBeLessThan(2)
      expect(Math.abs(a.lastY - b.lastY)).toBeLessThan(0.02)
    }
    expect(houdingOp(o.sleutels, duur)).toEqual(houdingOp(o.sleutels, 0))
    expect(houdingOp(o.sleutels, 0)).toEqual(o.sleutels[0].houding)
  })
})

describe('3D-oefeningen: rekenwerk', () => {
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
