import { describe, expect, it } from 'vitest'
import {
  dagenVanWeek,
  isDatum,
  isoWeek,
  isoWeekdag,
  maandagUitWeekParam,
  minutenNaarTijd,
  nlDelen,
  nlNaarUtc,
  normaliseerTijd,
  plusDagen,
  weekBereik,
  weekParam,
} from './tijd'

describe('nlNaarUtc', () => {
  it('rekent in de zomer met UTC+2', () => {
    expect(nlNaarUtc('2026-07-14', '19:00').toISOString()).toBe('2026-07-14T17:00:00.000Z')
  })

  it('rekent in de winter met UTC+1', () => {
    expect(nlNaarUtc('2026-12-01', '19:00').toISOString()).toBe('2026-12-01T18:00:00.000Z')
  })

  it('houdt de kloktijd gelijk rond de overgang naar wintertijd (25 oktober 2026)', () => {
    expect(nlNaarUtc('2026-10-24', '09:00').toISOString()).toBe('2026-10-24T07:00:00.000Z')
    expect(nlNaarUtc('2026-10-25', '09:00').toISOString()).toBe('2026-10-25T08:00:00.000Z')
  })

  it('houdt de kloktijd gelijk rond de overgang naar zomertijd (29 maart 2026)', () => {
    expect(nlNaarUtc('2026-03-28', '09:00').toISOString()).toBe('2026-03-28T08:00:00.000Z')
    expect(nlNaarUtc('2026-03-29', '09:00').toISOString()).toBe('2026-03-29T07:00:00.000Z')
  })
})

describe('nlDelen', () => {
  it('geeft de Nederlandse datum, tijd en weekdag', () => {
    const m = nlDelen(new Date('2026-10-13T22:30:00Z'))
    expect(m).toEqual({ datum: '2026-10-14', tijd: '00:30', minuten: 30, weekdag: 3 })
  })
})

describe('datums en weken', () => {
  it('telt dagen op over de maandgrens', () => {
    expect(plusDagen('2026-10-30', 3)).toBe('2026-11-02')
  })

  it('kent de ISO-weekdag', () => {
    expect(isoWeekdag('2026-10-12')).toBe(1)
    expect(isoWeekdag('2026-10-18')).toBe(7)
  })

  it('kent het ISO-weeknummer, ook rond de jaarwisseling', () => {
    expect(isoWeek('2026-10-14')).toEqual({ jaar: 2026, week: 42 })
    expect(isoWeek('2027-01-01')).toEqual({ jaar: 2026, week: 53 })
    expect(isoWeek('2024-12-30')).toEqual({ jaar: 2025, week: 1 })
  })

  it('maakt en leest de weekparameter', () => {
    expect(weekParam('2026-10-14')).toBe('2026-W42')
    expect(maandagUitWeekParam('2026-W42', '2020-01-01')).toBe('2026-10-12')
    expect(maandagUitWeekParam('2026-W53', '2020-01-01')).toBe('2026-12-28')
  })

  it('valt terug op de huidige week bij een ongeldige parameter', () => {
    expect(maandagUitWeekParam('onzin', '2026-10-14')).toBe('2026-10-12')
    expect(maandagUitWeekParam(undefined, '2026-10-18')).toBe('2026-10-12')
    expect(maandagUitWeekParam('2025-W53', '2026-10-14')).toBe('2026-10-12')
  })

  it('geeft zeven dagen en een weekbereik in Nederlandse tijd', () => {
    expect(dagenVanWeek('2026-10-19')).toHaveLength(7)
    const { van, tot } = weekBereik('2026-10-19')
    expect(van.toISOString()).toBe('2026-10-18T22:00:00.000Z')
    // Na de overgang naar wintertijd is middernacht een uur later in UTC.
    expect(tot.toISOString()).toBe('2026-10-25T23:00:00.000Z')
  })
})

describe('tijdnotatie', () => {
  it('normaliseert tijden uit de database', () => {
    expect(normaliseerTijd('19:00:00')).toBe('19:00')
    expect(normaliseerTijd('24:00')).toBeNull()
    expect(minutenNaarTijd(1170)).toBe('19:30')
  })

  it('controleert datums', () => {
    expect(isDatum('2026-02-29')).toBe(false)
    expect(isDatum('2028-02-29')).toBe(true)
  })
})
