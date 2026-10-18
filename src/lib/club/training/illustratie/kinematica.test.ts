import { describe, expect, test } from 'vitest'
import { tweeDelen } from './ik'
import { armNaarDoel, beenNaarDoel, MATEN, voetPunt, zijSkelet } from './skelet-zij'
import type { ZijHouding } from './typen'
import { afstand, assen, hoekVan, punt, richting, v } from './vec'

describe('vectoren en assen', () => {
  test('hoek 0 is omhoog, 90 is naar rechts (de kijkrichting)', () => {
    expect(richting(0).y).toBeCloseTo(-1)
    expect(richting(90).x).toBeCloseTo(1)
    expect(hoekVan(v(0, 1))).toBeCloseTo(180)
  })

  test('de normaal van een rechtopstaand deel wijst naar voren', () => {
    const a = assen(v(0, 0), 0)
    expect(a.n.x).toBeCloseTo(1)
    expect(punt(a, 10, 2)).toEqual({ x: expect.closeTo(2), y: expect.closeTo(-10) })
  })
})

describe('inverse kinematica met twee delen', () => {
  test('het eind komt op het doel en de delen houden hun lengte', () => {
    const r = tweeDelen(v(0, 0), v(30, 40), 30, 32, 1)
    expect(r.bereikt).toBe(true)
    expect(afstand(r.eind, v(30, 40))).toBeLessThan(1e-6)
    expect(afstand(v(0, 0), r.midden)).toBeCloseTo(30)
    expect(afstand(r.midden, r.eind)).toBeCloseTo(32)
  })

  test('buig kiest de kant van het middelste gewricht', () => {
    // Been recht omlaag naar een doel iets lager: knie naar voren (-1) of naar achteren (+1).
    const voor = tweeDelen(v(0, 0), v(0, 70), 44, 43, -1)
    const achter = tweeDelen(v(0, 0), v(0, 70), 44, 43, 1)
    expect(voor.midden.x).toBeGreaterThan(0)
    expect(achter.midden.x).toBeLessThan(0)
  })

  test('een doel buiten bereik geeft een gestrekt deel en bereikt = onwaar', () => {
    const r = tweeDelen(v(0, 0), v(0, 200), 44, 43, -1)
    expect(r.bereikt).toBe(false)
    expect(r.midden.x).toBeCloseTo(0, 1)
    expect(r.eind.y).toBeCloseTo(87, 0)
  })

  test('een arm naar een doel met een kortere zichtbare lengte (brede greep) haalt het doel', () => {
    const arm = armNaarDoel(v(0, 0), v(10, -14), 1, [0.6, 1])
    expect(arm.bereikt).toBe(true)
    expect(afstand(arm.greep, v(10, -14))).toBeLessThan(0.01)
    expect(arm.lBoven).toBeCloseTo(MATEN.bovenarm * 0.6)
  })

  test('een been naar de bal van de voet zet de bal precies op het doel', () => {
    const b = beenNaarDoel(v(0, -80), v(-40, 0), -1, 120, true)
    expect(afstand(voetPunt(b.voet, 'bal'), v(-40, 0))).toBeLessThan(0.01)
  })
})

describe('voorwaartse kinematica', () => {
  const staan: ZijHouding = {
    aanzicht: 'zij', bekken: 0, lumbaal: 0, thoracaal: 0, hoofd: 0, schouderblad: 0,
    armNabij: { hoeken: { schouder: 180, elleboog: 0 } },
    armVer: { hoeken: { schouder: 180, elleboog: 0 } },
    beenNabij: { hoeken: { heup: 180, knie: 0, voet: 90 } },
    beenVer: { hoeken: { heup: 180, knie: 0, voet: 90 } },
    anker: { punt: 'enkelNabij', op: v(0, -7.5) },
    materiaal: [],
  }

  test('het anker staat op zijn plek en de zool ligt op de vloer', () => {
    const s = zijSkelet(staan, () => v(0, 0))
    expect(s.beenNabij.voet.o).toEqual({ x: expect.closeTo(0), y: expect.closeTo(-7.5) })
    expect(voetPunt(s.beenNabij.voet, 'hiel').y).toBeCloseTo(0)
    expect(voetPunt(s.beenNabij.voet, 'teen').y).toBeCloseTo(0)
  })

  test('staande lengte klopt met een figuur van ongeveer 1,78 m', () => {
    const s = zijSkelet(staan, () => v(0, 0))
    const kruin = punt(s.hoofd, 21.4, -1.4)
    expect(-kruin.y).toBeGreaterThan(170)
    expect(-kruin.y).toBeLessThan(185)
  })

  test('een anker dat van een doel afhangt geeft een duidelijke fout', () => {
    const fout: ZijHouding = { ...staan, beenNabij: { doel: { wereld: v(0, -7.5) }, buig: -1, voet: 90 } }
    expect(() => zijSkelet(fout, () => v(0, 0))).toThrow(/Anker/)
  })
})
