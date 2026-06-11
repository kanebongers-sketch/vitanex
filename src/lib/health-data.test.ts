import { describe, expect, test } from 'vitest'
import {
  datumInNL, heeftMeetwaarde, isGeldigeDagMeting, mergeDagMetingen,
  type BestaandeRij,
} from './health-data'

describe('isGeldigeDagMeting', () => {
  test('accepteert een normale meting', () => {
    expect(isGeldigeDagMeting({ datum: '2026-06-11', stappen: 8000, slaapMinuten: 420 })).toBe(true)
  })

  test('accepteert null-velden en weglatingen', () => {
    expect(isGeldigeDagMeting({ datum: '2026-06-11', stappen: null })).toBe(true)
    expect(isGeldigeDagMeting({ datum: '2026-06-11' })).toBe(true)
  })

  test('weigert kapotte datums', () => {
    expect(isGeldigeDagMeting({ datum: '11-06-2026', stappen: 1 })).toBe(false)
    expect(isGeldigeDagMeting({ datum: 'gisteren' })).toBe(false)
    expect(isGeldigeDagMeting({})).toBe(false)
    expect(isGeldigeDagMeting(null)).toBe(false)
  })

  test('weigert onrealistische of niet-numerieke waarden', () => {
    expect(isGeldigeDagMeting({ datum: '2026-06-11', stappen: -5 })).toBe(false)
    expect(isGeldigeDagMeting({ datum: '2026-06-11', stappen: 999999999 })).toBe(false)
    expect(isGeldigeDagMeting({ datum: '2026-06-11', hartslag: 400 })).toBe(false)
    expect(isGeldigeDagMeting({ datum: '2026-06-11', slaapMinuten: '420' })).toBe(false)
    expect(isGeldigeDagMeting({ datum: '2026-06-11', calorieen: NaN })).toBe(false)
  })
})

describe('mergeDagMetingen', () => {
  const bestaand: BestaandeRij[] = [
    { datum: '2026-06-10', stappen: 5000, slaap_minuten: 400, hartslag_gemiddeld: 62, calorieen: null },
  ]

  test('nieuwe waarden winnen, lege velden behouden bestaande data', () => {
    const resultaat = mergeDagMetingen(bestaand, [
      { datum: '2026-06-10', stappen: 7200, calorieen: 1900 },
    ], 'apple_health')

    expect(resultaat).toHaveLength(1)
    expect(resultaat[0]).toEqual({
      datum: '2026-06-10',
      stappen: 7200,          // nieuw wint
      slaap_minuten: 400,     // bestaand blijft (bron levert geen slaap)
      hartslag_gemiddeld: 62, // bestaand blijft
      calorieen: 1900,        // nieuw vult leeg veld
      bron: 'apple_health',
    })
  })

  test('dagen zonder enige meetwaarde worden overgeslagen', () => {
    const resultaat = mergeDagMetingen([], [
      { datum: '2026-06-09' },
      { datum: '2026-06-10', stappen: 100 },
    ], 'google_fit')
    expect(resultaat.map(r => r.datum)).toEqual(['2026-06-10'])
  })

  test('waarden worden afgerond naar gehele getallen', () => {
    const resultaat = mergeDagMetingen([], [
      { datum: '2026-06-10', hartslag: 61.7, calorieen: 1899.4 },
    ], 'google_fit')
    expect(resultaat[0].hartslag_gemiddeld).toBe(62)
    expect(resultaat[0].calorieen).toBe(1899)
  })
})

describe('heeftMeetwaarde', () => {
  test('herkent lege en gevulde metingen', () => {
    expect(heeftMeetwaarde({ datum: '2026-06-11' })).toBe(false)
    expect(heeftMeetwaarde({ datum: '2026-06-11', stappen: null })).toBe(false)
    expect(heeftMeetwaarde({ datum: '2026-06-11', stappen: 0 })).toBe(true)
  })
})

describe('datumInNL', () => {
  test('UTC-avond valt in Nederland op de volgende dag (zomertijd)', () => {
    expect(datumInNL(new Date('2026-06-10T22:30:00Z'))).toBe('2026-06-11')
  })

  test('UTC-middag blijft dezelfde dag', () => {
    expect(datumInNL(new Date('2026-06-10T12:00:00Z'))).toBe('2026-06-10')
  })
})
