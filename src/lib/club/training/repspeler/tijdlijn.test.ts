import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import { AFSPEEL_TEMPO, leesRepTempo } from './tempo'
import { binnen, maakHerhalingPlan, maakVasthoudPlan, opPiek, standOp, tempoUitleg } from './tijdlijn'
import type { FrameBereik, FrameFases, HeenIs, HerhalingPlan, Tempo } from './typen'

// Een render van 72 beelden: 0-5 rust, 6-35 heen, 36-41 vast, 42-65 terug, 66-71 rust.
const FASES: FrameFases = { rust_begin: [0, 5], heen: [6, 35], houden_ver: [36, 41], terug: [42, 65], rust_eind: [66, 71] }

function plan(tempo: string | null, heenIs: HeenIs = 'excentrisch', reps = 15): HerhalingPlan {
  return maakHerhalingPlan({ fases: FASES, frames: 72, heenIs, tempo: leesRepTempo(tempo), reps })
}

describe('maakHerhalingPlan', () => {
  it('squat (heen is excentrisch): eerst de excentrische seconden op de heenweg', () => {
    const p = plan('3110')
    expect(p.segmenten.map((s) => [s.soort, s.label, s.duur])).toEqual([
      ['heen', 'omlaag', 3],
      ['houden', 'vast', 1],
      ['terug', 'omhoog', 1],
    ])
    expect(p.repDuur).toBe(5)
    expect(p.totaal).toBe(75)
  })

  it('curl (heen is concentrisch): de concentrische seconden op de heenweg, vasthouden bovenin', () => {
    const p = plan('3012', 'concentrisch')
    expect(p.segmenten.map((s) => [s.soort, s.label, s.duur])).toEqual([
      ['heen', 'omhoog', 1],
      ['houden', 'vast', 2],
      ['terug', 'omlaag', 3],
    ])
  })

  it('een pauze op het samengetrokken punt wordt rust na de terugweg bij een squat', () => {
    const p = plan('2022')
    expect(p.segmenten.map((s) => s.soort)).toEqual(['heen', 'terug', 'rust'])
    expect(p.segmenten[2].frames).toEqual([66, 71])
  })

  it('zonder tempo: 2 omlaag, 2 omhoog', () => {
    expect(tempoUitleg(plan(null))).toBe('2 sec omlaag, 2 sec omhoog')
    expect(tempoUitleg(plan('3110'))).toBe('3 sec omlaag, 1 sec vast, 1 sec omhoog')
  })

  it('eigen woorden per oefening', () => {
    const p = maakHerhalingPlan({ fases: FASES, frames: 72, heenIs: 'concentrisch', tempo: leesRepTempo('2010'), reps: 8, woorden: { heen: 'trekken', terug: 'zakken', vast: 'vast' } })
    expect(tempoUitleg(p)).toBe('1 sec trekken, 2 sec zakken')
  })
})

describe('afspeeltempo (besluit Kane 29-10-2026)', () => {
  const p = maakHerhalingPlan({ fases: FASES, frames: 72, heenIs: 'excentrisch', tempo: AFSPEEL_TEMPO, reps: 3 })

  it('een herhaling per 2 seconden: heen in 1 seconde, terug in 1 seconde, vastframes overgeslagen', () => {
    expect(p.segmenten.map((s) => [s.soort, s.duur, s.frames])).toEqual([
      ['heen', 1, [6, 35]],
      ['terug', 1, [42, 65]],
    ])
    expect(standOp(p, 0.5).frame).toBe(21)
    expect(standOp(p, 1.5)).toMatchObject({ segment: 'terug', rep: 1 })
    expect(standOp(p, 2.1)).toMatchObject({ rep: 2, gedaan: 1, segment: 'heen' })
    expect(standOp(p, 6)).toMatchObject({ klaar: true, gedaan: 3 })
  })

  it('de teller loopt gelijk met het beeld: herhaling k begint bij het eerste heen-frame', () => {
    for (let k = 0; k < 3; k += 1) expect(standOp(p, k * 2)).toMatchObject({ rep: k + 1, frame: 6, segment: 'heen' })
  })
})

describe('standOp', () => {
  const p = plan('2020', 'excentrisch', 3)

  it('begint op het eerste frame van de heenweg en telt herhaling 1', () => {
    const s = standOp(p, 0)
    expect(s).toMatchObject({ frame: 6, rep: 1, gedaan: 0, label: 'omlaag', segment: 'heen', klaar: false })
  })

  it('halverwege de heenweg zit het frame halverwege het bereik', () => {
    expect(standOp(p, 1).frame).toBe(21)
  })

  it('na een herhaling telt de volgende', () => {
    const s = standOp(p, 6.5)
    expect(s).toMatchObject({ rep: 2, gedaan: 1, label: 'omhoog', segment: 'terug' })
  })

  it('aan het eind: klaar, alle herhalingen gedaan, beginhouding', () => {
    const s = standOp(p, 12)
    expect(s).toMatchObject({ rep: 3, gedaan: 3, klaar: true, frame: 65, voortgang: 1, over: 0 })
    expect(standOp(p, 999).klaar).toBe(true)
  })

  it('negatieve of kapotte tijd geeft het begin', () => {
    expect(standOp(p, -5).frame).toBe(6)
    expect(standOp(p, Number.NaN).rep).toBe(1)
  })

  it('opPiek: vast en de tweede helft van de heenweg tonen het zwaarste punt', () => {
    expect(opPiek({ segment: 'houden', deel: 0 })).toBe(true)
    expect(opPiek({ segment: 'heen', deel: 0.2 })).toBe(false)
    expect(opPiek({ segment: 'heen', deel: 0.7 })).toBe(true)
    expect(opPiek({ segment: 'terug', deel: 0.2 })).toBe(true)
    expect(opPiek({ segment: 'rust', deel: 0.5 })).toBe(false)
  })
})

describe('vasthouden', () => {
  const p = maakVasthoudPlan({ frames: 72, fps: 24, doelSec: 30 })

  it('telt af naar de doeltijd en speelt de lus', () => {
    expect(standOp(p, 0)).toMatchObject({ frame: 0, over: 30, klaar: false, label: 'vasthouden' })
    expect(standOp(p, 1).frame).toBe(24)
    expect(standOp(p, 3).frame).toBe(0)
    expect(standOp(p, 15).voortgang).toBeCloseTo(0.5)
    expect(standOp(p, 30)).toMatchObject({ klaar: true, gedaan: 1, over: 0 })
    expect(tempoUitleg(p)).toBe('30 sec vasthouden')
  })
})

describe('binnen', () => {
  it('klemt bereiken die buiten de render vallen', () => {
    expect(binnen([-4, 200], 72)).toEqual([0, 71])
    expect(binnen([Number.NaN, 10], 72)).toEqual([0, 10])
  })
})

// ─── Eigenschappen ──────────────────────────────────────────────────────────

const bereik: fc.Arbitrary<FrameBereik> = fc.tuple(fc.integer({ min: -20, max: 400 }), fc.integer({ min: -20, max: 400 }))
const fases: fc.Arbitrary<FrameFases> = fc.record({ rust_begin: bereik, heen: bereik, houden_ver: bereik, terug: bereik, rust_eind: bereik })
const tempoTeken = fc.constantFrom('0', '1', '2', '3', '4', '5', '9', 'X')
const tempo: fc.Arbitrary<Tempo> = fc.tuple(tempoTeken, tempoTeken, tempoTeken, tempoTeken).map((t) => leesRepTempo(t.join('')))
const herhalingPlan = fc
  .record({ fases, frames: fc.integer({ min: 1, max: 300 }), heenIs: fc.constantFrom<HeenIs>('excentrisch', 'concentrisch'), tempo, reps: fc.integer({ min: 1, max: 40 }) })
  .map(maakHerhalingPlan)

describe('eigenschappen van de tijdlijn', () => {
  it('het frame ligt altijd binnen de render', () => {
    fc.assert(
      fc.property(herhalingPlan, fc.double({ min: -10, max: 2000, noNaN: true }), (p, t) => {
        const { frame } = standOp(p, t)
        return Number.isInteger(frame) && frame >= 0 && frame <= p.frames - 1
      }),
    )
  })

  it('de totale duur is precies reps maal de duur van een herhaling', () => {
    fc.assert(fc.property(herhalingPlan, (p) => Math.abs(p.totaal - p.reps * p.repDuur) < 1e-9 && p.repDuur > 0))
  })

  it('telt precies N herhalingen: 1 tot en met N, op volgorde, en N gedaan aan het eind', () => {
    fc.assert(
      fc.property(herhalingPlan, (p) => {
        const gezien = new Set<number>()
        let vorige = 1
        const stap = p.repDuur / 7
        for (let t = 0; t < p.totaal; t += stap) {
          const s = standOp(p, t)
          if (s.rep < vorige || s.rep > p.reps || s.klaar) return false
          vorige = s.rep
          gezien.add(s.rep)
        }
        const eind = standOp(p, p.totaal)
        return gezien.size === p.reps && eind.klaar && eind.gedaan === p.reps && eind.rep === p.reps
      }),
    )
  })

  it('midden in herhaling k staat herhaling k in beeld', () => {
    fc.assert(
      fc.property(herhalingPlan, fc.integer({ min: 0, max: 39 }), (p, k) => {
        const i = k % p.reps
        return standOp(p, (i + 0.5) * p.repDuur).rep === i + 1
      }),
    )
  })

  it('vasthouden: frame binnen de render en klaar precies op de doeltijd', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 300 }), fc.integer({ min: 1, max: 60 }), fc.integer({ min: 5, max: 600 }), fc.double({ min: 0, max: 700, noNaN: true }), (frames, fps, doel, t) => {
        const p = maakVasthoudPlan({ frames, fps, doelSec: doel })
        const s = standOp(p, t)
        return s.frame >= 0 && s.frame < frames && s.klaar === t >= doel
      }),
    )
  })
})
