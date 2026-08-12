import { describe, it, expect } from 'vitest'
import { verschuifDatum, koppel, splitsVergelijk, berekenVerband, kiesSterksteVerband, dagGemiddelde, type DagWaarde } from './verbanden'

describe('dagGemiddelde', () => {
  it('middelt meerdere rijen per dag en sorteert chronologisch', () => {
    const rijen = [
      { aangemaakt_op: '2026-08-11T20:00:00Z', stemming: 4 },
      { aangemaakt_op: '2026-08-11T09:00:00Z', stemming: 2 },
      { aangemaakt_op: '2026-08-10T12:00:00Z', stemming: 5 },
    ]
    expect(dagGemiddelde(rijen, 'aangemaakt_op', 'stemming')).toEqual([
      { datum: '2026-08-10', waarde: 5 },
      { datum: '2026-08-11', waarde: 3 },
    ])
  })
  it('negeert rijen zonder geldige datum of waarde', () => {
    const rijen = [{ datum: 'x', stappen: 100 }, { datum: '2026-08-11', stappen: null }, { datum: '2026-08-11', stappen: 8000 }]
    expect(dagGemiddelde(rijen, 'datum', 'stappen')).toEqual([{ datum: '2026-08-11', waarde: 8000 }])
  })
})

describe('verschuifDatum', () => {
  it('telt dagen op en af, over maandgrenzen', () => {
    expect(verschuifDatum('2026-08-11', 1)).toBe('2026-08-12')
    expect(verschuifDatum('2026-08-31', 1)).toBe('2026-09-01')
    expect(verschuifDatum('2026-03-01', -1)).toBe('2026-02-28')
  })
})

describe('koppel', () => {
  const slaap: DagWaarde[] = [
    { datum: '2026-08-10', waarde: 8 },
    { datum: '2026-08-11', waarde: 6 },
  ]
  const stemming: DagWaarde[] = [
    { datum: '2026-08-11', waarde: 4 },
    { datum: '2026-08-12', waarde: 2 },
  ]
  it('koppelt met lag 1 (nacht → volgende dag)', () => {
    expect(koppel(slaap, stemming, 1)).toEqual([
      { driver: 8, uitkomst: 4 },
      { driver: 6, uitkomst: 2 },
    ])
  })
  it('koppelt alleen overlappende datums bij lag 0', () => {
    expect(koppel(slaap, stemming, 0)).toEqual([{ driver: 6, uitkomst: 4 }])
  })
})

describe('splitsVergelijk', () => {
  it('is null bij te weinig data', () => {
    const paren = [{ driver: 1, uitkomst: 1 }, { driver: 2, uitkomst: 2 }]
    expect(splitsVergelijk(paren)).toBeNull()
  })
  it('splitst op mediaan en vergelijkt de uitkomst', () => {
    const paren = [
      { driver: 1, uitkomst: 2 }, { driver: 2, uitkomst: 2 }, { driver: 3, uitkomst: 3 }, { driver: 4, uitkomst: 3 },
      { driver: 7, uitkomst: 4 }, { driver: 8, uitkomst: 4 }, { driver: 9, uitkomst: 5 }, { driver: 10, uitkomst: 5 },
    ]
    const res = splitsVergelijk(paren)
    expect(res?.nLaag).toBe(4)
    expect(res?.nHoog).toBe(4)
    expect(res?.laagGem).toBeCloseTo(2.5, 5)
    expect(res?.hoogGem).toBeCloseTo(4.5, 5)
    expect(res?.verschil).toBeCloseTo(2, 5)
  })
})

describe('berekenVerband', () => {
  const driver: DagWaarde[] = Array.from({ length: 8 }, (_, i) => ({ datum: `2026-08-0${i + 1}`, waarde: i + 1 }))
  const uitkomst: DagWaarde[] = Array.from({ length: 8 }, (_, i) => ({ datum: `2026-08-0${i + 1}`, waarde: i < 4 ? 2 : 4 }))

  it('meldt niets onder de verschil-drempel', () => {
    expect(berekenVerband({ driver, uitkomst, minVerschil: 5, formatteer: () => 'x' })).toBeNull()
  })
  it('bouwt een verband boven de drempel', () => {
    const v = berekenVerband({
      driver, uitkomst, minVerschil: 1,
      formatteer: (r) => `verschil ${r.verschil.toFixed(1)}`,
    })
    expect(v?.tekst).toContain('verschil')
    expect(v?.sterkte).toBeCloseTo(2, 5)
    expect(v?.dagen).toBe(8)
  })
})

describe('kiesSterksteVerband', () => {
  it('kiest het grootste effect', () => {
    const zwak: DagWaarde[] = Array.from({ length: 8 }, (_, i) => ({ datum: `2026-08-0${i + 1}`, waarde: i + 1 }))
    const zwakUit: DagWaarde[] = Array.from({ length: 8 }, (_, i) => ({ datum: `2026-08-0${i + 1}`, waarde: i < 4 ? 3 : 3.5 }))
    const sterkUit: DagWaarde[] = Array.from({ length: 8 }, (_, i) => ({ datum: `2026-08-0${i + 1}`, waarde: i < 4 ? 1 : 5 }))
    const beste = kiesSterksteVerband([
      { driver: zwak, uitkomst: zwakUit, minVerschil: 0.1, formatteer: () => 'zwak' },
      { driver: zwak, uitkomst: sterkUit, minVerschil: 0.1, formatteer: () => 'sterk' },
    ])
    expect(beste?.tekst).toBe('sterk')
  })
  it('is null als niets de drempel haalt', () => {
    expect(kiesSterksteVerband([])).toBeNull()
  })
})
