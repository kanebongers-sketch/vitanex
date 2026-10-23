import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import { controleerReeks, controleerVolgnummers, factuurnummer, leesFactuurnummer, STANDAARD_REEKSEN, volgendVolgnummer, type Factuurreeks } from './nummer'

const f = STANDAARD_REEKSEN.factuur
const zonder: Factuurreeks = { prefix: 'AYG01', metJaar: false, cijfers: 4 }

describe('factuurnummer', () => {
  it('maakt nummers met en zonder jaar', () => {
    expect(factuurnummer(f, 1, 2026)).toBe('F-2026-00001')
    expect(factuurnummer(zonder, 12345, 0)).toBe('AYG01-12345')
    expect(factuurnummer(STANDAARD_REEKSEN.creditnota, 7, 2027)).toBe('C-2027-00007')
  })

  it('weigert foute reeksen en volgnummers', () => {
    expect(controleerReeks({ prefix: 'abc', metJaar: false, cijfers: 4 })).not.toBeNull()
    expect(controleerReeks({ prefix: 'ABCDEFGHIJKLM', metJaar: false, cijfers: 4 })).not.toBeNull()
    expect(controleerReeks({ prefix: 'A', metJaar: false, cijfers: 0 })).not.toBeNull()
    expect(() => factuurnummer(f, 0, 2026)).toThrow()
    expect(() => factuurnummer(f, 1, 26)).toThrow()
  })

  it('leest terug wat het maakt, en niets anders', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 99_999_999 }), fc.integer({ min: 2000, max: 2100 }), fc.boolean(), (n, jaar, metJaar) => {
        const r: Factuurreeks = { prefix: 'F', metJaar, cijfers: 5 }
        expect(leesFactuurnummer(r, factuurnummer(r, n, jaar))).toEqual({ prefix: 'F', jaar: metJaar ? jaar : null, volgnummer: n })
      }),
    )
    expect(leesFactuurnummer(f, 'C-2026-00001')).toBeNull()
    expect(leesFactuurnummer(f, 'F-2026-001')).toBeNull()
    expect(leesFactuurnummer(f, 'F-2026-000001')).toBeNull()
    expect(leesFactuurnummer(f, 'F-00001')).toBeNull()
  })

  it('volgend volgnummer, opnieuw bij een nieuw jaar', () => {
    expect(volgendVolgnummer(f, null, 2026)).toBe(1)
    expect(volgendVolgnummer(f, { volgnummer: 41, jaar: 2026 }, 2026)).toBe(42)
    expect(volgendVolgnummer(f, { volgnummer: 41, jaar: 2026 }, 2027)).toBe(1)
    expect(volgendVolgnummer(zonder, { volgnummer: 41, jaar: 2026 }, 2027)).toBe(42)
    expect(() => volgendVolgnummer(f, { volgnummer: 41, jaar: 2027 }, 2026)).toThrow()
  })

  it('vindt gaten en dubbele nummers', () => {
    expect(controleerVolgnummers([1, 2, 3])).toEqual({ gaten: [], dubbel: [] })
    expect(controleerVolgnummers([3, 1, 5, 3, 3])).toEqual({ gaten: [2, 4], dubbel: [3] })
    expect(controleerVolgnummers([])).toEqual({ gaten: [], dubbel: [] })
  })
})
