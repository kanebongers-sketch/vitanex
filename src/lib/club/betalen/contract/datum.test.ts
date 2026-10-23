import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import { dagenInMaand, dagenTussen, dagNummer, datum, isDatum, isSchrikkeljaar, laatste, plusDagen, plusMaanden, vandaagInAmsterdam, vanDagNummer, vergelijk, vroegste } from './datum'

const BEGIN = dagNummer(datum('1900-01-01'))
const EIND = dagNummer(datum('2200-12-31'))

describe('datum', () => {
  it('leest alleen bestaande kalenderdagen', () => {
    expect(datum('2024-02-29')).toBe('2024-02-29')
    expect(() => datum('2026-02-29')).toThrow()
    expect(() => datum('2026-13-01')).toThrow()
    expect(() => datum('2026-1-01')).toThrow()
    expect(() => datum('2026-04-31')).toThrow()
    expect(isDatum('2100-02-29')).toBe(false)
    expect(isDatum('2000-02-29')).toBe(true)
    expect(isDatum(20260101)).toBe(false)
  })

  it('kent schrikkeljaren', () => {
    expect(isSchrikkeljaar(2024)).toBe(true)
    expect(isSchrikkeljaar(1900)).toBe(false)
    expect(isSchrikkeljaar(2000)).toBe(true)
    expect(dagenInMaand(2028, 2)).toBe(29)
    expect(dagenInMaand(2027, 2)).toBe(28)
  })

  it('dagnummer klopt met bekende waarden', () => {
    expect(dagNummer(datum('1970-01-01'))).toBe(0)
    expect(dagNummer(datum('2000-03-01'))).toBe(11017)
    expect(vanDagNummer(-1)).toBe('1969-12-31')
  })

  it('dagnummer en datum zijn elkaars omgekeerde en klopt met Date in UTC', () => {
    fc.assert(
      fc.property(fc.integer({ min: BEGIN, max: EIND }), (n) => {
        const d = vanDagNummer(n)
        expect(dagNummer(d)).toBe(n)
        expect(new Date(n * 86_400_000).toISOString().slice(0, 10)).toBe(d)
      }),
    )
  })

  it('plusMaanden klemt op het einde van de maand', () => {
    expect(plusMaanden(datum('2026-01-31'), 1)).toBe('2026-02-28')
    expect(plusMaanden(datum('2028-01-31'), 1)).toBe('2028-02-29')
    expect(plusMaanden(datum('2026-01-31'), 2)).toBe('2026-03-31')
    expect(plusMaanden(datum('2026-03-31'), -1)).toBe('2026-02-28')
    expect(plusMaanden(datum('2026-12-15'), 1)).toBe('2027-01-15')
    expect(plusMaanden(datum('2024-02-29'), 12)).toBe('2025-02-28')
    expect(plusMaanden(datum('2026-01-10'), -13)).toBe('2024-12-10')
  })

  it('rekent dagen over zomertijd en jaargrenzen zonder fout', () => {
    expect(dagenTussen(datum('2026-03-28'), datum('2026-03-30'))).toBe(2)
    expect(dagenTussen(datum('2026-10-24'), datum('2026-10-26'))).toBe(2)
    expect(plusDagen(datum('2026-12-31'), 1)).toBe('2027-01-01')
    expect(dagenTussen(datum('2028-01-01'), datum('2029-01-01'))).toBe(366)
    expect(() => plusDagen(datum('2026-01-01'), 0.5)).toThrow()
  })

  it('vergelijkt', () => {
    const a = datum('2026-01-02')
    const b = datum('2026-01-10')
    expect(vergelijk(a, b)).toBe(-1)
    expect(vergelijk(b, a)).toBe(1)
    expect(vergelijk(a, a)).toBe(0)
    expect(vroegste(a, b)).toBe(a)
    expect(laatste(a, b)).toBe(b)
  })

  it('vandaag in Amsterdam, ook rond middernacht en zomertijd', () => {
    // 22:30 UTC in de zomer is 00:30 de volgende dag in Nederland.
    expect(vandaagInAmsterdam(new Date('2026-07-14T22:30:00Z'))).toBe('2026-07-15')
    // 23:30 UTC in de winter is 00:30 de volgende dag.
    expect(vandaagInAmsterdam(new Date('2026-12-31T23:30:00Z'))).toBe('2027-01-01')
    expect(vandaagInAmsterdam(new Date('2026-12-31T22:59:59Z'))).toBe('2026-12-31')
    // Nacht van de klok verzetten.
    expect(vandaagInAmsterdam(new Date('2026-03-29T00:30:00Z'))).toBe('2026-03-29')
  })
})
