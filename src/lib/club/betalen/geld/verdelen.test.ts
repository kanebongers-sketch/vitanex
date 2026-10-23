import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import { cent, som } from './cent'
import { verdeel, verdeelGelijk } from './verdelen'

describe('verdeel', () => {
  it('geeft de extra cent aan de grootste rest, bij gelijke rest aan het eerste deel', () => {
    expect(verdeelGelijk(cent(100), 3)).toEqual([34, 33, 33])
    expect(verdeelGelijk(cent(-100), 3)).toEqual([-34, -33, -33])
    expect(verdeel(cent(1000), [1, 2])).toEqual([333, 667])
    expect(verdeel(cent(10), [0, 1])).toEqual([0, 10])
    expect(verdeel(cent(0), [3, 7])).toEqual([0, 0])
  })

  it('weigert foute gewichten', () => {
    expect(() => verdeel(cent(10), [])).toThrow()
    expect(() => verdeel(cent(10), [0, 0])).toThrow()
    expect(() => verdeel(cent(10), [-1, 2])).toThrow()
    expect(() => verdeel(cent(10), [1.5])).toThrow()
    expect(() => verdeelGelijk(cent(10), 0)).toThrow()
  })

  it('de som van de delen is altijd precies het totaal', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -1_000_000_000, max: 1_000_000_000 }),
        fc.array(fc.integer({ min: 0, max: 100_000 }), { minLength: 1, maxLength: 40 }).filter((g) => g.some((x) => x > 0)),
        (totaal, gewichten) => {
          const delen = verdeel(cent(totaal), gewichten)
          expect(delen).toHaveLength(gewichten.length)
          expect(som(delen)).toBe(totaal)
        },
      ),
    )
  })

  it('elk deel zit binnen een cent van zijn exacte aandeel en heeft het teken van het totaal', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -1_000_000, max: 1_000_000 }),
        fc.array(fc.integer({ min: 0, max: 1000 }), { minLength: 1, maxLength: 20 }).filter((g) => g.some((x) => x > 0)),
        (totaal, gewichten) => {
          const somG = gewichten.reduce((a, b) => a + b, 0)
          verdeel(cent(totaal), gewichten).forEach((d, i) => {
            const exact = (totaal * gewichten[i]) / somG
            expect(Math.abs(d - exact)).toBeLessThan(1)
            if (gewichten[i] === 0) expect(d).toBe(0)
            else expect(Math.sign(d) * Math.sign(totaal)).toBeGreaterThanOrEqual(0)
          })
        },
      ),
    )
  })
})
