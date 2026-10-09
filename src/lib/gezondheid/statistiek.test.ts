import { describe, expect, test } from 'vitest'
import {
  dagenTussen, gemiddelde, kwantiel, maandStart, mediaan, relatieveDatum,
  verschuifDatum, verschuifMaand, weekStart,
} from './statistiek'

describe('gemiddelde, mediaan en kwantiel', () => {
  test('gemiddelde van een lijst', () => {
    // Arrange
    const waarden = [2, 4, 9]
    // Act
    const resultaat = gemiddelde(waarden)
    // Assert
    expect(resultaat).toBe(5)
  })

  test('lege lijst geeft null in plaats van een verzonnen 0', () => {
    expect(gemiddelde([])).toBeNull()
    expect(mediaan([])).toBeNull()
    expect(kwantiel([], 0.25)).toBeNull()
  })

  test('mediaan van een even aantal interpoleert', () => {
    expect(mediaan([4, 1, 3, 2])).toBe(2.5)
  })

  test('kwantielen interpoleren lineair en raken de invoer niet aan', () => {
    const waarden = [10, 20, 30, 40, 50]
    expect(kwantiel(waarden, 0.25)).toBe(20)
    expect(kwantiel(waarden, 0.75)).toBe(40)
    expect(waarden).toEqual([10, 20, 30, 40, 50])
  })
})

describe('datumhulpen', () => {
  test('verschuift over een maand- en jaargrens', () => {
    expect(verschuifDatum('2026-10-01', -1)).toBe('2026-09-30')
    expect(verschuifDatum('2026-12-31', 1)).toBe('2027-01-01')
  })

  test('zomertijd laat geen dag verspringen', () => {
    expect(verschuifDatum('2026-10-24', 2)).toBe('2026-10-26')
    expect(dagenTussen('2026-03-28', '2026-03-30')).toBe(2)
  })

  test('week begint op maandag', () => {
    expect(weekStart('2026-10-09')).toBe('2026-10-05') // vrijdag → maandag
    expect(weekStart('2026-10-11')).toBe('2026-10-05') // zondag hoort bij dezelfde week
    expect(weekStart('2026-10-05')).toBe('2026-10-05')
  })

  test('maandhulpen', () => {
    expect(maandStart('2026-10-09')).toBe('2026-10-01')
    expect(verschuifMaand('2026-01-31', -1)).toBe('2025-12-01')
  })

  test('relatieve datum', () => {
    expect(relatieveDatum('2026-10-09', '2026-10-09')).toBe('Vandaag')
    expect(relatieveDatum('2026-10-08', '2026-10-09')).toBe('Gisteren')
    expect(relatieveDatum('2026-10-05', '2026-10-09')).toBe('ma 5 okt')
  })
})
