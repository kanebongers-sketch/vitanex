import { describe, expect, test } from 'vitest'
import type { HealthSample, Workout } from '@capgo/capacitor-health'
import {
  alsProcent, intervallenUitAggregaat, puntenUitSamples, slaapSessiesUitHealthKit, workoutUitHealthKit,
} from './apple-health-parser'
import { slaapPerNacht } from './health-aggregatie'

function slaap(start: string, eind: string, sleepState: HealthSample['sleepState'], sourceId = 'com.apple.health.watch'): HealthSample {
  const minuten = (Date.parse(eind) - Date.parse(start)) / 60_000
  return { dataType: 'sleep', value: minuten, unit: 'minute', startDate: start, endDate: eind, sleepState, sourceId }
}

describe('slaapSessiesUitHealthKit', () => {
  test('fases van een nacht worden een sessie met stadia; "in bed" telt dan niet mee', () => {
    const sessies = slaapSessiesUitHealthKit([
      slaap('2026-10-11T21:30:00.000Z', '2026-10-12T05:30:00.000Z', 'inBed'),
      slaap('2026-10-11T22:00:00.000Z', '2026-10-12T00:00:00.000Z', 'light'),
      slaap('2026-10-12T00:00:00.000Z', '2026-10-12T01:00:00.000Z', 'deep'),
      slaap('2026-10-12T01:00:00.000Z', '2026-10-12T01:30:00.000Z', 'awake'),
      slaap('2026-10-12T01:30:00.000Z', '2026-10-12T05:00:00.000Z', 'rem'),
    ])
    expect(sessies).toHaveLength(1)
    expect(sessies[0].start).toBe('2026-10-11T22:00:00.000Z')
    expect(sessies[0].eind).toBe('2026-10-12T05:00:00.000Z')
    expect(sessies[0].stadia?.map(s => s.stadium)).toEqual(['licht', 'diep', 'wakker', 'rem'])

    const nacht = slaapPerNacht(sessies).get('2026-10-12')
    expect(nacht?.slaapMinuten).toBe(390) // 7 uur min 30 min wakker
    expect(nacht?.slaapDiepMin).toBe(60)
    expect(nacht?.slaapRemMin).toBe(210)
    expect(nacht?.slaapWakkerMin).toBe(30)
  })

  test('twee apps over dezelfde nacht tellen niet dubbel: de bron met fases wint', () => {
    const sessies = slaapSessiesUitHealthKit([
      slaap('2026-10-11T22:00:00.000Z', '2026-10-12T06:00:00.000Z', 'asleep', 'com.slaapapp'),
      slaap('2026-10-11T22:30:00.000Z', '2026-10-12T02:00:00.000Z', 'light'),
      slaap('2026-10-12T02:00:00.000Z', '2026-10-12T05:30:00.000Z', 'deep'),
    ])
    expect(sessies).toHaveLength(1)
    expect(sessies[0].start).toBe('2026-10-11T22:30:00.000Z')
    expect(slaapPerNacht(sessies).get('2026-10-12')?.slaapMinuten).toBe(420)
  })

  test('alleen "in bed" (iPhone-bedtijd) geeft een sessie zonder fases', () => {
    const sessies = slaapSessiesUitHealthKit([slaap('2026-10-11T22:00:00.000Z', '2026-10-12T06:00:00.000Z', 'inBed', 'com.apple.health.iphone')])
    expect(sessies).toEqual([{ start: '2026-10-11T22:00:00.000Z', eind: '2026-10-12T06:00:00.000Z' }])
  })

  test('nachten met meer dan een uur ertussen blijven apart; ongeldige samples vallen weg', () => {
    const sessies = slaapSessiesUitHealthKit([
      slaap('2026-10-11T22:00:00.000Z', '2026-10-12T06:00:00.000Z', 'asleep'),
      slaap('2026-10-12T13:00:00.000Z', '2026-10-12T13:30:00.000Z', 'asleep'), // middagdutje
      slaap('2026-10-12T22:00:00.000Z', '2026-10-12T21:00:00.000Z', 'asleep'), // eind voor start
      slaap('geen-datum', '2026-10-12T21:00:00.000Z', 'asleep'),
    ])
    expect(sessies).toHaveLength(2)
    expect(slaapSessiesUitHealthKit(undefined)).toEqual([])
  })
})

describe('metingen', () => {
  test('dagbuckets en punten, ongeldige waarden weg', () => {
    expect(intervallenUitAggregaat([
      { startDate: 'a', endDate: 'b', value: 1200, values: { sum: 1200 }, unit: 'count' },
      { startDate: 'c', endDate: 'd', value: Number.NaN, values: {}, unit: 'count' },
    ])).toEqual([{ start: 'a', eind: 'b', waarde: 1200 }])
    expect(puntenUitSamples([
      { dataType: 'heartRateVariability', value: 42.5, unit: 'millisecond', startDate: 't1', endDate: 't1' },
    ])).toEqual([{ tijd: 't1', waarde: 42.5 }])
  })

  test('zuurstof als fractie wordt een percentage', () => {
    expect(alsProcent(0.97)).toBeCloseTo(97)
    expect(alsProcent(97)).toBe(97)
  })
})

describe('workoutUitHealthKit', () => {
  test('zet een training om en laat ontbrekende waarden leeg', () => {
    const w: Workout = {
      workoutType: 'running', duration: 1800, totalEnergyBurned: 310, totalDistance: 5000,
      startDate: '2026-10-12T07:00:00.000Z', endDate: '2026-10-12T07:30:00.000Z', platformId: 'uuid-1',
    }
    expect(workoutUitHealthKit(w)).toEqual({
      externId: 'uuid-1', soort: 'running', start: w.startDate, eind: w.endDate, kcal: 310, afstandM: 5000, gemHartslag: null,
    })
    const zonder = workoutUitHealthKit({ ...w, platformId: undefined, totalEnergyBurned: 0, totalDistance: undefined })
    expect(zonder.externId).toBe('2026-10-12T07:00:00.000Z|running')
    expect(zonder.kcal).toBeNull()
    expect(zonder.afstandM).toBeNull()
  })
})
