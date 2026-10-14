import { describe, expect, it } from 'vitest'
import { achterstand, historie, vorigeMaandagen } from './overzicht'
import { maakTaak, vink, WEEK } from './testdata'

const toilet = maakTaak({ id: 'toilet' })
const stofzuigen = maakTaak({ id: 'stofzuigen', frequentie: 'per_week', perWeekMin: 3 })
const kasten = maakTaak({ id: 'kasten', frequentie: 'per_week', perWeekMin: 1 })
const spiegels = maakTaak({ id: 'spiegels', frequentie: 'extra' })

describe('achterstand', () => {
  it('noemt de gemiste dagen van dagtaken, vandaag nog niet', () => {
    const v = [vink('toilet', '2026-10-12')]
    const [regel] = achterstand([toilet], v, WEEK, '2026-10-14')
    expect(regel.gemisteDagen).toEqual(['2026-10-13'])
    expect(regel.definitief).toBe(true)
  })
  it('noemt weektaken die achter lopen, met hoeveel er nog moet', () => {
    const regels = achterstand([stofzuigen, kasten], [vink('stofzuigen', '2026-10-12')], WEEK, '2026-10-18')
    expect(regels.map((r) => [r.taak.id, r.tekort, r.definitief])).toEqual([
      ['stofzuigen', 2, false],
      ['kasten', 1, false],
    ])
  })
  it('is definitief als de week voorbij is', () => {
    const [regel] = achterstand([stofzuigen], [], WEEK, '2026-10-19')
    expect(regel).toMatchObject({ tekort: 3, definitief: true })
  })
  it('laat taken zonder minimum, uitgezette en taken op schema weg', () => {
    const uit = maakTaak({ id: 'uit', actief: false })
    expect(achterstand([spiegels, uit, stofzuigen], [], WEEK, '2026-10-12')).toEqual([])
  })
  it('meldt niets voor een week in de toekomst', () => {
    expect(achterstand([toilet, stofzuigen], [], WEEK, '2026-10-01')).toEqual([])
  })
})

describe('historie', () => {
  const maandagen = ['2026-09-21', '2026-09-28', '2026-10-05']
  it('telt per week en vergelijkt met het minimum', () => {
    const v = [vink('stofzuigen', '2026-09-21'), vink('stofzuigen', '2026-09-22'), vink('stofzuigen', '2026-09-23'), vink('stofzuigen', '2026-10-06')]
    const [h] = historie([stofzuigen], v, maandagen)
    expect(h.perWeek).toEqual([3, 0, 1])
    expect(h.norm).toBe(3)
    expect(h.wekenGehaald).toBe(1)
    expect(h.totaal).toBe(4)
    expect(h.score).toBeCloseTo(4 / 9)
  })
  it('geeft dagtaken een norm van 7 en extra taken geen score', () => {
    const [d, e] = historie([toilet, spiegels], [vink('spiegels', '2026-09-30')], maandagen)
    expect(d.norm).toBe(7)
    expect(d.score).toBe(0)
    expect(e.norm).toBeNull()
    expect(e.score).toBeNull()
    expect(e.totaal).toBe(1)
  })
  it('kapt de score af op 100 procent', () => {
    const v = WEEK.map((d) => vink('kasten', d))
    const [h] = historie([kasten], v, ['2026-10-12'])
    expect(h.score).toBe(1)
  })
})

describe('vorigeMaandagen', () => {
  it('geeft de volledige weken ervoor, oudste eerst', () => {
    expect(vorigeMaandagen('2026-10-12', 4)).toEqual(['2026-09-14', '2026-09-21', '2026-09-28', '2026-10-05'])
  })
  it('gaat goed over de jaargrens', () => {
    expect(vorigeMaandagen('2027-01-04', 2)).toEqual(['2026-12-21', '2026-12-28'])
  })
})
