import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import { absoluut, cent, deelAfgerond, euro, formatEuro, grootste, isCent, kleinste, leesEuroTekst, maal, maalBreuk, min, negatief, NUL, plus, som } from './cent'

const bedrag = fc.integer({ min: -100_000_000, max: 100_000_000 }).map(cent)

describe('cent', () => {
  it('weigert kommagetallen, NaN en te grote getallen', () => {
    expect(() => cent(1.5)).toThrow()
    expect(() => cent(Number.NaN)).toThrow()
    expect(() => cent(Number.MAX_SAFE_INTEGER + 1)).toThrow()
    expect(cent(-0)).toBe(0)
    expect(Object.is(cent(-0), 0)).toBe(true)
  })

  it('isCent herkent alleen veilige gehele getallen', () => {
    expect(isCent(12)).toBe(true)
    expect(isCent(0.1)).toBe(false)
    expect(isCent('12')).toBe(false)
  })

  it('rekent optellen, aftrekken en vergelijken', () => {
    expect(plus(cent(150), cent(250))).toBe(400)
    expect(min(cent(150), cent(250))).toBe(-100)
    expect(negatief(cent(5))).toBe(-5)
    expect(absoluut(cent(-5))).toBe(5)
    expect(som([cent(1), cent(2), cent(3)])).toBe(6)
    expect(som([])).toBe(NUL)
    expect(kleinste(cent(3), cent(2))).toBe(2)
    expect(grootste(cent(3), cent(2))).toBe(3)
    expect(euro(40)).toBe(4000)
    expect(maal(cent(1999), 3)).toBe(5997)
    expect(() => maal(cent(1), 1.5)).toThrow()
  })

  it('rondt een halve cent van nul af', () => {
    expect(maalBreuk(cent(5), 1, 2)).toBe(3)
    expect(maalBreuk(cent(-5), 1, 2)).toBe(-3)
    expect(maalBreuk(cent(4), 1, 3)).toBe(1)
    expect(maalBreuk(cent(5), 1, 3)).toBe(2)
    expect(maalBreuk(cent(-5), 1, 3)).toBe(-2)
    expect(() => maalBreuk(cent(5), 1, 0)).toThrow()
    expect(() => maalBreuk(cent(5), 1, -2)).toThrow()
  })

  it('maalBreuk is het spiegelbeeld bij een negatief bedrag', () => {
    fc.assert(
      fc.property(bedrag, fc.integer({ min: 0, max: 10_000 }), fc.integer({ min: 1, max: 10_000 }), (a, t, n) => {
        expect(maalBreuk(negatief(a), t, n)).toBe(negatief(maalBreuk(a, t, n)))
      }),
    )
  })

  it('maalBreuk zit hooguit een halve cent van het exacte antwoord', () => {
    fc.assert(
      fc.property(bedrag, fc.integer({ min: -10_000, max: 10_000 }), fc.integer({ min: 1, max: 10_000 }), (a, t, n) => {
        const uit = BigInt(maalBreuk(a, t, n))
        const exact = BigInt(a) * BigInt(t)
        const verschil = uit * BigInt(n) - exact
        const abs = verschil < BigInt(0) ? -verschil : verschil
        expect(abs * BigInt(2) <= BigInt(n)).toBe(true)
      }),
    )
  })

  it('deelAfgerond werkt met grote getallen zonder verlies', () => {
    expect(deelAfgerond(BigInt('900719925474099100'), BigInt(100))).toBe(BigInt('9007199254740991'))
  })

  it('formatEuro schrijft nl-NL', () => {
    expect(formatEuro(cent(0))).toBe('€ 0,00')
    expect(formatEuro(cent(5))).toBe('€ 0,05')
    expect(formatEuro(cent(4000))).toBe('€ 40,00')
    expect(formatEuro(cent(123456))).toBe('€ 1.234,56')
    expect(formatEuro(cent(-123456789))).toBe('€ -1.234.567,89')
  })

  it('leesEuroTekst leest wat iemand intypt en weigert het onduidelijke', () => {
    expect(leesEuroTekst('40')).toBe(4000)
    expect(leesEuroTekst('40,5')).toBe(4050)
    expect(leesEuroTekst('€ 1.234,56')).toBe(123456)
    expect(leesEuroTekst('-12,00')).toBe(-1200)
    expect(leesEuroTekst('12.5')).toBeNull()
    expect(leesEuroTekst('12,345')).toBeNull()
    expect(leesEuroTekst('abc')).toBeNull()
    expect(leesEuroTekst('1.23')).toBeNull()
  })

  it('formatEuro en leesEuroTekst zijn elkaars omgekeerde', () => {
    fc.assert(
      fc.property(bedrag, (a) => {
        expect(leesEuroTekst(formatEuro(a).replace('€ ', ''))).toBe(a)
      }),
    )
  })
})
