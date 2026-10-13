import { describe, expect, test } from 'vitest'
import { heeftStaven, staafAandelen } from './vergelijking'

describe('staafAandelen', () => {
  test('de grootste waarde is de volle breedte', () => {
    expect(staafAandelen(10_000, 8_000)).toEqual({ recent: 1, normaal: 0.8 })
    expect(staafAandelen(371, 431)?.normaal).toBe(1)
  })

  test('een heel lage waarde blijft zichtbaar', () => {
    expect(staafAandelen(1, 1000)?.recent).toBe(0.04)
  })

  test('ongeldig of nul geeft geen staven', () => {
    expect(staafAandelen(0, 0)).toBeNull()
    expect(staafAandelen(Number.NaN, 5)).toBeNull()
    expect(staafAandelen(-1, 5)).toBeNull()
  })
})

describe('heeftStaven', () => {
  test('kloktijden niet, hoeveelheden wel', () => {
    expect(heeftStaven('bedtijd')).toBe(false)
    expect(heeftStaven('wektijd')).toBe(false)
    expect(heeftStaven('slaap')).toBe(true)
    expect(heeftStaven('stappen')).toBe(true)
  })
})
