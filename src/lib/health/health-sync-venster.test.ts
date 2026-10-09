import { describe, expect, test } from 'vitest'
import { bepaalVanafDatum } from './health-sync-venster'
import { verrijkWorkouts, MAX_TE_VERRIJKEN, type AggregaatType } from './health-connect-workouts'
import type { WorkoutMeting } from './health-data'

const NU = new Date('2026-10-09T10:00:00Z')

describe('bepaalVanafDatum', () => {
  test('eerste sync: 30 dagen terug', () => {
    expect(bepaalVanafDatum(null, NU)).toBe('2026-09-09')
  })

  test('incrementeel: laatste sync min 2 dagen', () => {
    expect(bepaalVanafDatum('2026-10-01T08:00:00Z', NU)).toBe('2026-09-29')
  })

  test('nooit later dan 2 dagen geleden, ook direct na een sync', () => {
    expect(bepaalVanafDatum('2026-10-09T09:55:00Z', NU)).toBe('2026-10-07')
  })

  test('nooit verder terug dan 30 dagen', () => {
    expect(bepaalVanafDatum('2026-01-01T00:00:00Z', NU)).toBe('2026-09-09')
  })

  test('onzin of een tijd in de toekomst → volledige sync', () => {
    expect(bepaalVanafDatum('kapot', NU)).toBe('2026-09-09')
    expect(bepaalVanafDatum('2027-01-01T00:00:00Z', NU)).toBe('2026-09-09')
  })
})

describe('verrijkWorkouts', () => {
  const training = (id: string, start: string): WorkoutMeting => ({
    externId: id, soort: 'running', start, eind: start.replace('T06', 'T07'),
  })

  test('vult kcal, afstand en hartslag uit het tijdvenster van de training', async () => {
    // Arrange
    const waarden: Record<AggregaatType, number> = {
      ActiveCaloriesBurned: 420, Distance: 7500, HeartRate: 148, Steps: 0, TotalCaloriesBurned: 0,
    }
    const lees = async (type: AggregaatType, s: Date, e: Date) =>
      [{ start: s.toISOString(), eind: e.toISOString(), waarde: waarden[type] }]
    // Act
    const [w] = await verrijkWorkouts([training('a', '2026-10-08T06:00:00Z')], lees)
    // Assert
    expect(w).toMatchObject({ kcal: 420, afstandM: 7500, gemHartslag: 148 })
  })

  test('0 betekent "niet gemeten" → null', async () => {
    const lees = async () => [{ start: 'x', eind: 'y', waarde: 0 }]
    const [w] = await verrijkWorkouts([training('a', '2026-10-08T06:00:00Z')], lees)
    expect(w).toMatchObject({ kcal: null, afstandM: null, gemHartslag: null })
  })

  test('alleen de recentste trainingen kosten native calls', async () => {
    let calls = 0
    const lees = async () => { calls++; return [] }
    const veel = Array.from({ length: MAX_TE_VERRIJKEN + 5 }, (_, i) =>
      training(`w${i}`, `2026-09-${String((i % 28) + 1).padStart(2, '0')}T06:00:00Z`))
    const uit = await verrijkWorkouts(veel, lees)
    expect(uit).toHaveLength(MAX_TE_VERRIJKEN + 5)
    expect(calls).toBe(MAX_TE_VERRIJKEN * 3)
  })
})
