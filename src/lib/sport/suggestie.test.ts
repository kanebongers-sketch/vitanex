import { describe, it, expect } from 'vitest'
import { rondOpStap, stelGewichtVoor, leesRepBereik } from './suggestie'

describe('rondOpStap', () => {
  it('rondt op de dichtstbijzijnde stap', () => {
    expect(rondOpStap(61, 2.5)).toBe(60)
    expect(rondOpStap(64, 2.5)).toBe(65)
  })
  it('geeft 0 bij onzin en het gewicht zelf bij een kapotte stap', () => {
    expect(rondOpStap(-5, 2.5)).toBe(0)
    expect(rondOpStap(60, 0)).toBe(60)
  })
})

describe('stelGewichtVoor', () => {
  it('is onbekend zonder bruikbare vorige set (verzint geen startgewicht)', () => {
    expect(stelGewichtVoor([], 12).actie).toBe('onbekend')
    expect(stelGewichtVoor([{ herhalingen: 0, gewichtKg: null }], 12).voorstelKg).toBeNull()
  })

  it('adviseert verhogen als je de bovenkant van het bereik haalde', () => {
    const s = stelGewichtVoor([{ herhalingen: 12, gewichtKg: 60 }], 12, 2.5)
    expect(s.actie).toBe('verhoog')
    expect(s.voorstelKg).toBe(62.5)
    expect(s.vorigeGewichtKg).toBe(60)
  })

  it('adviseert behouden als je onder de bovenkant bleef', () => {
    const s = stelGewichtVoor([{ herhalingen: 9, gewichtKg: 60 }], 12)
    expect(s.actie).toBe('behoud')
    expect(s.voorstelKg).toBe(60)
  })

  it('neemt de zwaarste werkset als ijkpunt', () => {
    const s = stelGewichtVoor([{ herhalingen: 12, gewichtKg: 50 }, { herhalingen: 12, gewichtKg: 60 }], 12)
    expect(s.vorigeGewichtKg).toBe(60)
    expect(s.voorstelKg).toBe(62.5)
  })
})

describe('leesRepBereik', () => {
  it('leest een bereik, enkel getal en tekstvorm', () => {
    expect(leesRepBereik('8-12')).toEqual({ min: 8, max: 12 })
    expect(leesRepBereik('10')).toEqual({ min: 10, max: 10 })
    expect(leesRepBereik('8 tot 12')).toEqual({ min: 8, max: 12 })
  })
  it('valt terug op nul bij geen getallen', () => {
    expect(leesRepBereik('max')).toEqual({ min: 0, max: 0 })
  })
})
