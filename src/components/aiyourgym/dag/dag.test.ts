import { describe, expect, it } from 'vitest'
import { eindStand, faseVan, FASEN, GRENZEN, pinVoortgang, standVan, zelfdeStand, zichtbaar } from './schema-bouw'

describe('schemabouw', () => {
  const N = { intake: 4, rijen: 4, kern: 3 }

  it('de fasen sluiten op elkaar aan van 0 tot 1', () => {
    expect(GRENZEN[FASEN[0]][0]).toBe(0)
    expect(GRENZEN[FASEN[FASEN.length - 1]][1]).toBe(1)
    for (let i = 1; i < FASEN.length; i++) expect(GRENZEN[FASEN[i]][0]).toBe(GRENZEN[FASEN[i - 1]][1])
  })

  it('rekent de vastgezette scroll om naar 0 tot 1', () => {
    expect(pinVoortgang(500, 3000, 1000, 68)).toBe(0)
    expect(pinVoortgang(68, 3000, 1000, 68)).toBe(0)
    expect(pinVoortgang(68 - 2068, 3000, 1000, 68)).toBe(1)
    expect(pinVoortgang(68 - 1034, 3000, 1000, 68)).toBeCloseTo(0.5)
    expect(pinVoortgang(-10, 900, 1000, 68)).toBe(1)
    expect(pinVoortgang(400, 900, 1000, 68)).toBe(0)
  })

  it('kiest de fase bij de voortgang', () => {
    expect(faseVan(0)).toBe('intake')
    expect(faseVan(0.3)).toBe('oefeningen')
    expect(faseVan(0.6)).toBe('coaching')
    expect(faseVan(0.9)).toBe('app')
    expect(faseVan(1)).toBe('app')
  })

  it('laat onderdelen een voor een zien en daarna allemaal', () => {
    expect(zichtbaar(0, 'oefeningen', 4)).toBe(0)
    expect(zichtbaar(0.21, 'oefeningen', 4)).toBe(1)
    expect(zichtbaar(0.5, 'oefeningen', 4)).toBe(4)
    expect(zichtbaar(1, 'oefeningen', 4)).toBe(4)
    let vorige = 0
    for (let p = 0; p <= 1; p += 0.01) {
      const z = zichtbaar(p, 'oefeningen', 4)
      expect(z).toBeGreaterThanOrEqual(vorige)
      vorige = z
    }
  })

  it('eindigt in de eindstand', () => {
    expect(zelfdeStand(standVan(1, N), eindStand(N))).toBe(true)
    expect(standVan(0, N)).toEqual({ fase: 'intake', intake: 0, rijen: 0, kern: 0, app: 0 })
    expect(zelfdeStand(standVan(0.3, N), eindStand(N))).toBe(false)
  })

  it('de telefoon komt pas in de laatste fase binnen', () => {
    expect(standVan(0.73, N).app).toBe(0)
    expect(standVan(0.8, N).app).toBeGreaterThan(0)
    expect(standVan(0.97, N).app).toBe(1)
  })
})
