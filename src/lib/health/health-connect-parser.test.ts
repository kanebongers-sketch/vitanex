import { describe, expect, test } from 'vitest'
import {
  intervalPuntUitTekst, parseerAlle, puntUitJson, puntUitTekst, slaapSessieUitJson, workoutUitJson,
} from './health-connect-parser'

// Formaten zoals connect-client 1.2.0-alpha01 ze via toString() teruggeeft.
const HRV = 'HeartRateVariabilityRmssdRecord(time=2026-10-08T06:12:00Z, zoneOffset=+02:00, '
  + 'heartRateVariabilityMillis=48.2, metadata=Metadata(id=x, dataOrigin=DataOrigin(packageName=com.x)))'
const VO2 = 'Vo2MaxRecord(time=2026-10-08T07:00:00.123Z, zoneOffset=null, '
  + 'vo2MillilitersPerMinuteKilogram=45.5, measurementMethod=0, metadata=Metadata(id=y))'
const SPO2_A = 'OxygenSaturationRecord(time=2026-10-08T03:00:00Z, zoneOffset=+02:00, percentage=97.0%, metadata=M)'
const SPO2_B = 'OxygenSaturationRecord(time=2026-10-08T03:00:00Z, zoneOffset=+02:00, '
  + 'percentage=Percentage(value=96.5), metadata=M)'
const TRAP = 'FloorsClimbedRecord(startTime=2026-10-08T08:00:00Z, startZoneOffset=+02:00, '
  + 'endTime=2026-10-08T08:10:00Z, endZoneOffset=+02:00, floors=3.0, metadata=M)'

describe('puntUitTekst', () => {
  test('leest HRV, VO2max en zuurstof uit toString-records', () => {
    expect(puntUitTekst(HRV, 'heartRateVariabilityMillis')).toEqual({ tijd: '2026-10-08T06:12:00Z', waarde: 48.2 })
    expect(puntUitTekst(VO2, 'vo2MillilitersPerMinuteKilogram')?.waarde).toBe(45.5)
    expect(puntUitTekst(SPO2_A, 'percentage')?.waarde).toBe(97)
    expect(puntUitTekst(SPO2_B, 'percentage')?.waarde).toBe(96.5)
  })

  test('null als het formaat niet past (liever niets dan iets verkeerds)', () => {
    expect(puntUitTekst('iets anders', 'rate')).toBeNull()
    expect(puntUitTekst({ time: 'x' }, 'rate')).toBeNull()
    expect(puntUitTekst(HRV, 'rate')).toBeNull()
  })
})

describe('intervalPuntUitTekst', () => {
  test('verdiepingen krijgen het midden van het interval als tijd', () => {
    expect(intervalPuntUitTekst(TRAP, 'floors')).toEqual({ tijd: '2026-10-08T08:05:00.000Z', waarde: 3 })
  })
})

describe('puntUitJson', () => {
  test('rusthartslag en gewicht uit JSON-records', () => {
    expect(puntUitJson({ time: '2026-10-08T06:00:00Z', beatsPerMinute: 54 }, 'beatsPerMinute'))
      .toEqual({ tijd: '2026-10-08T06:00:00Z', waarde: 54 })
    expect(puntUitJson({ time: '2026-10-08T06:00:00Z', value: 80.4, unit: 'kg' }, 'value')?.waarde).toBe(80.4)
    expect(puntUitJson({ time: 'kapot', value: 1 }, 'value')).toBeNull()
  })
})

describe('slaapSessieUitJson', () => {
  test('zet Health Connect-stadia om', () => {
    const sessie = slaapSessieUitJson({
      startTime: '2026-10-07T21:00:00Z', endTime: '2026-10-08T05:00:00Z',
      stages: [
        { startTime: '2026-10-07T21:00:00Z', endTime: '2026-10-07T23:00:00Z', stage: 'SLEEP_STAGE_LIGHT' },
        { startTime: '2026-10-07T23:00:00Z', endTime: '2026-10-08T00:00:00Z', stage: 'SLEEP_STAGE_DEEP' },
        { startTime: '2026-10-08T00:00:00Z', endTime: '2026-10-08T00:10:00Z', stage: 'SLEEP_STAGE_AWAKE' },
        { startTime: '2026-10-08T00:10:00Z', endTime: '2026-10-08T01:00:00Z', stage: 'SLEEP_STAGE_UNKNOWN' },
      ],
    })
    expect(sessie?.stadia?.map(s => s.stadium)).toEqual(['licht', 'diep', 'wakker', 'onbekend'])
  })

  test('null zonder start/eind', () => {
    expect(slaapSessieUitJson({ startTime: '2026-10-07T21:00:00Z' })).toBeNull()
  })
})

describe('workoutUitJson', () => {
  test('gebruikt het Health Connect-id en een genormaliseerde soort', () => {
    const w = workoutUitJson({
      startTime: '2026-10-08T06:00:00Z', endTime: '2026-10-08T06:40:00Z',
      exerciseType: 'EXERCISE_TYPE_BIKING', exerciseTypeId: 8, metadata: { id: 'hc-1' },
    })
    expect(w).toEqual({ externId: 'hc-1', soort: 'biking', start: '2026-10-08T06:00:00Z', eind: '2026-10-08T06:40:00Z' })
  })

  test('valt terug op start + type als er geen id is', () => {
    const w = workoutUitJson({ startTime: '2026-10-08T06:00:00Z', endTime: '2026-10-08T06:40:00Z', exerciseTypeId: 56 })
    expect(w?.externId).toBe('2026-10-08T06:00:00Z|56')
    expect(w?.soort).toBe('overig')
  })
})

describe('parseerAlle', () => {
  test('laat mislukte records vallen', () => {
    expect(parseerAlle([HRV, 'rommel'], r => puntUitTekst(r, 'heartRateVariabilityMillis'))).toHaveLength(1)
  })
})
