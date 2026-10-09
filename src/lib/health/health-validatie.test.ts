import { describe, expect, test } from 'vitest'
import {
  isGeldigeDatum, normaliseerSoort, schoonDagMeting, schoonFout, schoonRechten, schoonWorkout,
} from './health-validatie'

const NU = new Date('2026-10-09T10:00:00Z')

describe('isGeldigeDatum', () => {
  test('accepteert recente kalenderdatums', () => {
    expect(isGeldigeDatum('2026-10-08', NU)).toBe(true)
  })

  test('weigert kapotte, niet-bestaande en verre datums', () => {
    expect(isGeldigeDatum('08-10-2026', NU)).toBe(false)
    expect(isGeldigeDatum('2026-02-30', NU)).toBe(false)
    expect(isGeldigeDatum('2026-10-12', NU)).toBe(false) // toekomst
    expect(isGeldigeDatum('2020-01-01', NU)).toBe(false) // te oud
    expect(isGeldigeDatum(20261008, NU)).toBe(false)
  })
})

describe('schoonDagMeting', () => {
  test('houdt geldige velden, gooit onzin per veld weg (niet de hele dag)', () => {
    // Arrange
    const invoer = {
      datum: '2026-10-08', stappen: 8123, rusthartslag: 400, hrvMs: -3, vo2max: '45',
      gewichtKg: 81.237, zuurstofPct: 97.4, slaapMinuten: NaN, onbekend: 5,
    }
    // Act
    const m = schoonDagMeting(invoer, NU)
    // Assert
    expect(m).toEqual({ datum: '2026-10-08', stappen: 8123, gewichtKg: 81.24, zuurstofPct: 97.4 })
  })

  test('null bij een ongeldige datum of geen object', () => {
    expect(schoonDagMeting({ datum: 'gisteren', stappen: 1 }, NU)).toBeNull()
    expect(schoonDagMeting(null, NU)).toBeNull()
    expect(schoonDagMeting([1], NU)).toBeNull()
  })

  test('bed- en wektijd alleen als paar, in volgorde en dicht bij de datum', () => {
    const goed = schoonDagMeting({
      datum: '2026-10-08', bedtijd: '2026-10-07T21:30:00Z', wektijd: '2026-10-08T05:45:00Z',
    }, NU)
    expect(goed?.bedtijd).toBe('2026-10-07T21:30:00.000Z')
    expect(goed?.wektijd).toBe('2026-10-08T05:45:00.000Z')

    const omgekeerd = schoonDagMeting({
      datum: '2026-10-08', bedtijd: '2026-10-08T05:45:00Z', wektijd: '2026-10-07T21:30:00Z',
    }, NU)
    expect(omgekeerd?.bedtijd).toBeUndefined()

    const ver = schoonDagMeting({
      datum: '2026-10-08', bedtijd: '2026-09-01T21:30:00Z', wektijd: '2026-10-08T05:45:00Z',
    }, NU)
    expect(ver?.wektijd).toBeUndefined()
  })
})

describe('schoonWorkout', () => {
  const basis = {
    externId: 'abc-123', soort: 'EXERCISE_TYPE_RUNNING',
    start: '2026-10-08T06:00:00Z', eind: '2026-10-08T06:45:00Z',
  }

  test('normaliseert een geldige training', () => {
    const w = schoonWorkout({ ...basis, kcal: 512.6, afstandM: 8012.4, gemHartslag: 151.26 }, NU)
    expect(w).toEqual({
      externId: 'abc-123', soort: 'running',
      start: '2026-10-08T06:00:00.000Z', eind: '2026-10-08T06:45:00.000Z',
      kcal: 513, afstandM: 8012, gemHartslag: 151.3,
    })
  })

  test('waarden buiten bereik worden null, de training blijft', () => {
    const w = schoonWorkout({ ...basis, kcal: -1, gemHartslag: 999 }, NU)
    expect(w?.kcal).toBeNull()
    expect(w?.gemHartslag).toBeNull()
  })

  test('weigert trainingen zonder id of met onmogelijke tijden', () => {
    expect(schoonWorkout({ ...basis, externId: '' }, NU)).toBeNull()
    expect(schoonWorkout({ ...basis, eind: basis.start }, NU)).toBeNull()
    expect(schoonWorkout({ ...basis, eind: '2026-10-09T09:00:00Z' }, NU)).toBeNull() // > 24 uur
  })
})

describe('kleine opschoners', () => {
  test('normaliseerSoort', () => {
    expect(normaliseerSoort('EXERCISE_TYPE_STRENGTH_TRAINING')).toBe('strength_training')
    expect(normaliseerSoort('Traditional Strength Training')).toBe('traditional_strength_training')
    expect(normaliseerSoort('')).toBe('overig')
    expect(normaliseerSoort(undefined)).toBe('overig')
  })

  test('schoonRechten laat alleen korte namen door, zonder dubbelen', () => {
    expect(schoonRechten(['Steps', 'Steps', 'Sleep Session', 5, 'Weight'])).toEqual(['Steps', 'Weight'])
    expect(schoonRechten('Steps')).toEqual([])
  })

  test('schoonFout kort af en haalt stuurtekens weg', () => {
    expect(schoonFout('a\nb')).toBe('a b')
    expect(schoonFout('x'.repeat(600))).toHaveLength(500)
    expect(schoonFout('  ')).toBeNull()
  })
})
