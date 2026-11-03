import { describe, expect, it } from 'vitest'
import { OEFENRENDER_DATA } from '@/components/aiyourgym/inhoud/oefenrenders.data'
import { REPSPELER } from '@/lib/aiyourgym/taal/woorden/ledenapp/repspeler'
import { planVoor, schemaTempoUitleg } from './plan'
import { maakHerhalingPlan, mengVan, standOp } from './tijdlijn'
import { UITVOERING, UITVOERING_GRENZEN as G, herhalingDuur, isHoudregel, uitvoeringVoor } from './uitvoering'
import type { FrameFases } from './typen'

// Besluit Kane 03-11-2026: elke kiesbare oefening speelt in haar eigen,
// onderbouwde uitvoeringstempo (vervangt de vaste 1 seconde heen en terug).

const RENDERS = OEFENRENDER_DATA.map((r) => ({ slug: r.slug, soort: r.frames?.soort }))

describe('uitvoeringstempo per oefening', () => {
  it.each(RENDERS.map((r) => [r.slug, r] as const))('%s heeft een passende regel', (slug, r) => {
    const regel = UITVOERING[slug]
    expect(regel, `${slug} mist in UITVOERING (uitvoering.ts)`).toBeDefined()
    expect(regel.waarom.length).toBeGreaterThan(10)
    // Een houdoefening telt seconden, een herhalingsoefening heeft een tempo.
    expect(isHoudregel(regel)).toBe(r.soort === 'vasthouden')
  })

  it('geen regels zonder render', () => {
    const slugs = new Set<string>(RENDERS.map((r) => r.slug))
    expect(Object.keys(UITVOERING).filter((s) => !slugs.has(s))).toEqual([])
  })

  it.each(RENDERS.filter((r) => r.soort === 'herhaling').map((r) => [r.slug] as const))('%s: tempo binnen redelijke grenzen', (slug) => {
    const u = uitvoeringVoor(slug)
    expect(u).not.toBeNull()
    const { excentrisch, pauzeGerekt, concentrisch, pauzeSamen } = u!.tempo
    for (const beweging of [excentrisch, concentrisch]) {
      expect(beweging).toBeGreaterThanOrEqual(G.minBeweging)
      expect(beweging).toBeLessThanOrEqual(G.maxBeweging)
    }
    for (const pauze of [pauzeGerekt, pauzeSamen]) {
      expect(pauze).toBeGreaterThanOrEqual(0)
      expect(pauze).toBeLessThanOrEqual(G.maxPauze)
    }
    const duur = herhalingDuur(u!.tempo)
    expect(duur).toBeGreaterThanOrEqual(G.minHerhaling)
    expect(duur).toBeLessThanOrEqual(G.maxHerhaling)
  })

  it('krachtoefeningen remmen minstens zo lang als ze duwen of trekken; sprongen en swing zijn snel', () => {
    const snel = new Set(['squat-jump', 'burpee', 'kettlebell-swing', 'mountain-climber'])
    for (const r of RENDERS.filter((x) => x.soort === 'herhaling' && !snel.has(x.slug))) {
      const { excentrisch, concentrisch } = uitvoeringVoor(r.slug)!.tempo
      expect(excentrisch, r.slug).toBeGreaterThanOrEqual(concentrisch)
    }
    expect(herhalingDuur(uitvoeringVoor('kettlebell-swing')!.tempo)).toBeLessThanOrEqual(2)
    expect(herhalingDuur(uitvoeringVoor('mountain-climber')!.tempo)).toBeLessThanOrEqual(1)
  })

  it('vakregels uit de opdracht: squat 2 tot 3 sec neer en 1 sec op, curl 1 sec op', () => {
    const squat = uitvoeringVoor('back-squat')!.tempo
    expect(squat.excentrisch).toBeGreaterThanOrEqual(2)
    expect(squat.excentrisch).toBeLessThanOrEqual(3)
    expect(squat.concentrisch).toBe(1)
    expect(uitvoeringVoor('dumbbell-curl')!.tempo.concentrisch).toBe(1)
    expect(uitvoeringVoor('roemeense-deadlift-met-dumbbells')!.tempo.excentrisch).toBeGreaterThanOrEqual(2)
    expect(uitvoeringVoor('plank')).toBeNull()
  })

  it('een ander fasewoord bestaat in beide talen', () => {
    for (const regel of Object.values(UITVOERING)) {
      if (isHoudregel(regel)) continue
      for (const woord of Object.values(regel.labels ?? {})) {
        expect(REPSPELER.nl.fase).toHaveProperty(woord as string)
        expect(REPSPELER.en.fase).toHaveProperty(woord as string)
      }
    }
  })
})

describe('plan met uitvoeringstempo', () => {
  const fases: FrameFases = { rust_begin: [0, 5], heen: [6, 33], houden_ver: [34, 43], terug: [44, 65], rust_eind: [66, 71] }
  const squat = { frames: 72, fps: 24, fases, heenIs: 'excentrisch' as const, soort: 'herhaling' as const, uitvoering: uitvoeringVoor('back-squat') }

  it('speelt het tempo van de oefening, welk schematempo er ook staat', () => {
    for (const tempo of ['3010', '2020', null, 'XXXX']) {
      const p = planVoor(squat, { herhalingen: '10', tijdSec: null, tempo })
      if (p.soort !== 'herhaling') throw new Error('verwacht herhaling')
      expect(p.segmenten.map((s) => [s.soort, s.duur])).toEqual([
        ['heen', 2.5],
        ['houden', 0.5],
        ['terug', 1],
      ])
      expect(p.totaal).toBeCloseTo(40, 9)
    }
  })

  it('tijd in het schema telt herhalingen in het eigen tempo', () => {
    const p = planVoor(squat, { herhalingen: null, tijdSec: 40, tempo: null })
    expect(p.soort === 'herhaling' && p.reps).toBe(10)
  })

  it('zonder schematempo toont de tekst het uitvoeringstempo', () => {
    expect(schemaTempoUitleg(squat, { herhalingen: '10', tijdSec: null, tempo: null })).toBe('2,5 sec omlaag, 0,5 sec vast, 1 sec omhoog')
    expect(schemaTempoUitleg(squat, { herhalingen: '10', tijdSec: null, tempo: '3010' })).toBe('3 sec omlaag, 1 sec omhoog')
  })

  it('ander fasewoord waar de render beweegt (sprong)', () => {
    const p = planVoor({ ...squat, uitvoering: uitvoeringVoor('squat-jump') }, { herhalingen: '5', tijdSec: null, tempo: null })
    if (p.soort !== 'herhaling') throw new Error('verwacht herhaling')
    expect(p.segmenten.at(-1)).toMatchObject({ soort: 'rust', label: 'springen' })
  })
})

describe('vloeiend tussen frames', () => {
  it('mengVan: dichtstbijzijnde frame, buurframe in de looprichting, meng tot 0,5', () => {
    expect(mengVan(10, 72)).toEqual({ frame: 10, frameNa: 11, meng: 0 })
    expect(mengVan(10.25, 72)).toEqual({ frame: 10, frameNa: 11, meng: 0.25 })
    expect(mengVan(10.75, 72)).toEqual({ frame: 11, frameNa: 10, meng: 0.25 })
    expect(mengVan(71, 72)).toEqual({ frame: 71, frameNa: 71, meng: 0 })
    expect(mengVan(Number.NaN, 72)).toEqual({ frame: 0, frameNa: 1, meng: 0 })
  })

  it('een trage fase loopt vloeiend: het beeld schuift elke stap hoogstens een halve frame', () => {
    const fases: FrameFases = { rust_begin: [0, 0], heen: [0, 23], houden_ver: [23, 23], terug: [24, 47], rust_eind: [47, 47] }
    const p = maakHerhalingPlan({ fases, frames: 48, heenIs: 'excentrisch', tempo: { excentrisch: 3, pauzeGerekt: 0, concentrisch: 1, pauzeSamen: 0 }, reps: 1 })
    const plek = (t: number) => {
      const s = standOp(p, t)
      return s.frame === s.frameNa ? s.frame : s.frame + Math.sign(s.frameNa - s.frame) * s.meng
    }
    // 60 beelden per seconde, 3 seconden over 23 frames: ongeveer 0,13 frame per stap.
    for (let t = 0; t < 2.95; t += 1 / 60) expect(Math.abs(plek(t + 1 / 60) - plek(t))).toBeLessThan(0.2)
  })
})
