import { describe, expect, it } from 'vitest'
import { mooieStap, paden, schaal, yBereik } from './grafiek'

const VLAK = { breedte: 300, hoogte: 120, links: 40, marge: 10 }

describe('mooieStap en yBereik', () => {
  it('kiest 1, 2 of 5 maal een macht van tien', () => {
    expect(mooieStap(4.2)).toBe(2)
    expect(mooieStap(30)).toBe(10)
    expect(mooieStap(0)).toBe(1)
  })

  it('rondt de grenzen af op de stap', () => {
    expect(yBereik([86, 90])).toEqual({ min: 86, max: 90, stap: 2 })
  })

  it('geeft lucht bij een vlakke reeks', () => {
    const b = yBereik([80, 80])
    expect(b.min).toBeLessThan(80)
    expect(b.max).toBeGreaterThan(80)
  })
})

describe('schaal', () => {
  it('zet de x-as op tijd, niet op volgorde', () => {
    // Arrange
    const reeks = [
      { datum: '2026-07-01', waarde: 90 },
      { datum: '2026-07-11', waarde: 88 },
      { datum: '2026-08-10', waarde: 86 },
    ]
    // Act
    const { punten, raster } = schaal(reeks, VLAK)
    // Assert
    expect(punten[0].x).toBe(40)
    expect(punten[2].x).toBe(290)
    expect(punten[1].x).toBeCloseTo(40 + 250 / 4)
    expect(punten[0].y).toBe(10)
    expect(punten[2].y).toBe(110)
    expect(raster.map((r) => r.waarde)).toEqual([86, 88, 90])
  })

  it('zet een enkel punt in het midden', () => {
    const { punten } = schaal([{ datum: '2026-07-01', waarde: 70 }], VLAK)
    expect(punten[0].x).toBe(165)
  })

  it('is leeg zonder data', () => {
    expect(schaal([], VLAK)).toEqual({ punten: [], raster: [] })
  })
})

describe('paden', () => {
  it('maakt een lijn en een gesloten vlak', () => {
    const p = paden([{ x: 0, y: 5, waarde: 1, datum: 'a' }, { x: 10, y: 2, waarde: 2, datum: 'b' }], 20)
    expect(p.lijn).toBe('M0.0 5.0 L10.0 2.0')
    expect(p.vlak).toBe('M0.0 5.0 L10.0 2.0 L10.0 20 L0.0 20 Z')
  })
})
