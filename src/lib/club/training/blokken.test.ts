import { describe, expect, it } from 'vitest'
import { blokken, normaliseerGroepen, regelLabels, uitvoerVolgorde } from './blokken'

interface R {
  sleutel: string
  dag: number
  groep: number | null
  sets: number | null
  rustSec: number | null
}

const r = (sleutel: string, groep: number | null, sets = 3, rustSec: number | null = 60, dag = 1): R => ({ sleutel, dag, groep, sets, rustSec })

describe('blokken', () => {
  it('herkent los, superset en circuit', () => {
    const b = blokken([r('a', null), r('b', 1), r('c', 1), r('d', 2), r('e', 2), r('f', 2)])
    expect(b.map((x) => [x.soort, x.items.map((i) => i.sleutel).join('')])).toEqual([
      ['los', 'a'],
      ['superset', 'bc'],
      ['circuit', 'def'],
    ])
  })

  it('splitst een groep die niet aaneengesloten is en een andere dag', () => {
    const b = blokken([r('a', 1), r('b', null), r('c', 1), r('d', 1, 3, 60, 2)])
    expect(b.map((x) => x.items.length)).toEqual([1, 1, 1, 1])
  })

  it('nummert opnieuw en maakt eenlingen los', () => {
    const uit = normaliseerGroepen([r('a', 5), r('b', 5), r('c', 8), r('d', 3, 3, 60, 2), r('e', 3, 3, 60, 2)])
    expect(uit.map((x) => x.groep)).toEqual([1, 1, null, 2, 2])
  })

  it('geeft labels zoals op de vloer', () => {
    const labels = regelLabels([r('a', null), r('b', 1), r('c', 1), r('d', null)])
    expect([...labels.values()]).toEqual(['1', '2a', '2b', '3'])
  })
})

describe('uitvoerVolgorde', () => {
  it('los: alle sets achter elkaar met rust na elke set', () => {
    const v = uitvoerVolgorde({ soort: 'los', items: [r('a', null, 3, 90)] })
    expect(v.map((s) => `${s.item.sleutel}${s.set}:${s.rustNa}`)).toEqual(['a1:90', 'a2:90', 'a3:90'])
  })

  it('superset: om en om, rust pas na de tweede oefening', () => {
    const v = uitvoerVolgorde({ soort: 'superset', items: [r('a', 1, 3, 0), r('b', 1, 3, 75)] })
    expect(v.map((s) => `${s.item.sleutel}${s.set}:${s.rustNa}`)).toEqual(['a1:0', 'b1:75', 'a2:0', 'b2:75', 'a3:0', 'b3:75'])
  })

  it('circuit met ongelijke sets: wie klaar is valt weg uit de ronde', () => {
    const v = uitvoerVolgorde({ soort: 'circuit', items: [r('a', 1, 3, 30), r('b', 1, 2, 90), r('c', 1, 3, null)] })
    expect(v.map((s) => `${s.item.sleutel}${s.set}:${s.rustNa}`)).toEqual(['a1:0', 'b1:0', 'c1:90', 'a2:0', 'b2:0', 'c2:90', 'a3:0', 'c3:90'])
  })

  it('zonder sets telt een set', () => {
    expect(uitvoerVolgorde({ soort: 'los', items: [r('a', null, 0, null)] })).toHaveLength(1)
  })
})
