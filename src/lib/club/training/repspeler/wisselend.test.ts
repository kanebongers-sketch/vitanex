import { describe, expect, it } from 'vitest'
import { planVoor, type RenderTiming } from './plan'
import { AFSPEEL_TEMPO } from './tempo'
import { kantVan, maakHerhalingPlan, perKant, standOp } from './tijdlijn'
import type { FrameFases, HerhalingPlan } from './typen'

// Wisselende render (besluit Kane 30-10-2026): 96 beelden, eerst een herhaling
// links (0 tot 47), dan rechts (48 tot 95). Per kant 1 seconde heen en 1 terug.
const LINKS: FrameFases = { rust_begin: [0, 0], heen: [1, 23], houden_ver: [24, 24], terug: [25, 46], rust_eind: [47, 47] }
const RECHTS: FrameFases = { rust_begin: [48, 48], heen: [49, 71], houden_ver: [72, 72], terug: [73, 94], rust_eind: [95, 95] }

const RENDER: RenderTiming = { frames: 96, fps: 24, fases: LINKS, fasesRechts: RECHTS, heenIs: 'excentrisch', soort: 'herhaling' }

function herhaling(reps: string): HerhalingPlan {
  const p = planVoor(RENDER, { herhalingen: reps, tijdSec: null, tempo: null })
  if (p.soort !== 'herhaling') throw new Error('verwacht een herhalingsplan')
  return p
}

describe('wisselende render: plan', () => {
  it('elke kant telt als een herhaling: 10 in het schema is 10 herhalingen, 5 per kant', () => {
    const p = herhaling('10')
    expect(p.reps).toBe(10)
    expect(perKant(p.reps)).toEqual({ links: 5, rechts: 5 })
    expect(p.totaal).toBe(20)
  })

  it('het tempo blijft 1 seconde heen en 1 seconde terug, aan beide kanten', () => {
    const p = herhaling('10')
    expect(p.segmenten.map((s) => [s.soort, s.duur, s.frames])).toEqual([
      ['heen', 1, [1, 23]],
      ['terug', 1, [25, 46]],
    ])
    expect(p.segmentenRechts?.map((s) => [s.soort, s.duur, s.frames])).toEqual([
      ['heen', 1, [49, 71]],
      ['terug', 1, [73, 94]],
    ])
    expect(p.repDuur).toBe(2)
  })

  it('oneven aantal: links begint en krijgt er een meer', () => {
    expect(perKant(9)).toEqual({ links: 5, rechts: 4 })
    expect(perKant(1)).toEqual({ links: 1, rechts: 0 })
    expect(perKant(0)).toEqual({ links: 0, rechts: 0 })
  })

  it('een gewone render heeft geen kanten', () => {
    const p = maakHerhalingPlan({ fases: LINKS, frames: 96, heenIs: 'excentrisch', tempo: AFSPEEL_TEMPO, reps: 4 })
    expect(p.segmentenRechts).toBeUndefined()
    expect(kantVan(p, 0)).toBeNull()
    expect(standOp(p, 2.5).kant).toBeNull()
    expect(standOp(p, 2.5).frame).toBeLessThan(48)
  })
})

describe('wisselende render: tijdlijn', () => {
  const p = herhaling('4')

  it('herhaling 1 en 3 links (eerste helft), 2 en 4 rechts (tweede helft)', () => {
    const kanten = [0.5, 2.5, 4.5, 6.5].map((t) => standOp(p, t))
    expect(kanten.map((s) => [s.rep, s.kant])).toEqual([
      [1, 'links'],
      [2, 'rechts'],
      [3, 'links'],
      [4, 'rechts'],
    ])
    for (const s of kanten) {
      if (s.kant === 'links') expect(s.frame).toBeLessThan(48)
      else expect(s.frame).toBeGreaterThanOrEqual(48)
    }
  })

  it('heen in 1 seconde, terug in 1 seconde, ook rechts', () => {
    expect(standOp(p, 0).frame).toBe(1)
    expect(standOp(p, 0.999).frame).toBe(23)
    expect(standOp(p, 1).label).toBe('omhoog')
    expect(standOp(p, 2).frame).toBe(49)
    expect(standOp(p, 2).label).toBe('omlaag')
    expect(standOp(p, 3.999).frame).toBe(94)
  })

  it('een herhaling per 2 seconden: de teller loopt gelijk met het beeld', () => {
    for (let rep = 0; rep < 4; rep++) {
      expect(standOp(p, rep * 2 + 0.01).gedaan).toBe(rep)
    }
    const eind = standOp(p, 8)
    expect(eind.klaar).toBe(true)
    expect(eind.gedaan).toBe(4)
    expect(eind.kant).toBe('rechts')
    expect(eind.frame).toBe(94)
  })

  it('bij een oneven aantal eindigt de set links', () => {
    const q = herhaling('3')
    const eind = standOp(q, q.totaal)
    expect(eind.kant).toBe('links')
    expect(eind.frame).toBeLessThan(48)
  })

  it('elk beeld valt altijd binnen de lus', () => {
    for (let t = 0; t <= p.totaal; t += 0.05) {
      const s = standOp(p, t)
      expect(s.frame).toBeGreaterThanOrEqual(0)
      expect(s.frame).toBeLessThan(96)
    }
  })
})
