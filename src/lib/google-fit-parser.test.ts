import { describe, expect, test } from 'vitest'
import {
  combineerDagMetingen, parseFitAggregaten, parseFitSlaapSessies,
  type FitAggregateRespons,
} from './google-fit-parser'

// 10 juni 2026 00:00 Europe/Amsterdam (zomertijd, UTC+2)
const DAG_START_MS = new Date('2026-06-09T22:00:00Z').getTime()

describe('parseFitAggregaten', () => {
  test('leest stappen, hartslag en calorieën uit één dag-bucket', () => {
    const respons: FitAggregateRespons = {
      bucket: [{
        startTimeMillis: String(DAG_START_MS),
        endTimeMillis: String(DAG_START_MS + 86400000),
        dataset: [
          { point: [{ dataTypeName: 'com.google.step_count.delta', value: [{ intVal: 8432 }] }] },
          { point: [
            { dataTypeName: 'com.google.heart_rate.summary', value: [{ fpVal: 64 }] },
            { dataTypeName: 'com.google.heart_rate.summary', value: [{ fpVal: 70 }] },
          ] },
          { point: [{ dataTypeName: 'com.google.calories.expended', value: [{ fpVal: 2105.6 }] }] },
        ],
      }],
    }

    const [meting] = parseFitAggregaten(respons)
    expect(meting.datum).toBe('2026-06-10')
    expect(meting.stappen).toBe(8432)
    expect(meting.hartslag).toBe(67) // gemiddelde van 64 en 70
    expect(meting.calorieen).toBeCloseTo(2105.6)
  })

  test('lege buckets geven een meting zonder waarden', () => {
    const respons: FitAggregateRespons = {
      bucket: [{ startTimeMillis: String(DAG_START_MS), endTimeMillis: '0', dataset: [{ point: [] }] }],
    }
    const [meting] = parseFitAggregaten(respons)
    expect(meting.stappen).toBeUndefined()
    expect(meting.hartslag).toBeUndefined()
  })

  test('onbekende datatypes worden genegeerd', () => {
    const respons: FitAggregateRespons = {
      bucket: [{
        startTimeMillis: String(DAG_START_MS), endTimeMillis: '0',
        dataset: [{ point: [{ dataTypeName: 'com.google.iets.anders', value: [{ intVal: 5 }] }] }],
      }],
    }
    const [meting] = parseFitAggregaten(respons)
    expect(meting).toEqual({ datum: '2026-06-10' })
  })
})

describe('parseFitSlaapSessies', () => {
  test('slaap telt bij de dag van wakker worden, sessies per nacht opgeteld', () => {
    // In slaap 23:30–06:30 NL met een onderbreking
    const resultaat = parseFitSlaapSessies([
      { startTimeMillis: String(new Date('2026-06-09T21:30:00Z').getTime()), endTimeMillis: String(new Date('2026-06-10T02:00:00Z').getTime()), activityType: 72 },
      { startTimeMillis: String(new Date('2026-06-10T02:30:00Z').getTime()), endTimeMillis: String(new Date('2026-06-10T04:30:00Z').getTime()), activityType: 72 },
    ])
    expect(resultaat).toHaveLength(1)
    expect(resultaat[0].datum).toBe('2026-06-10')
    expect(resultaat[0].slaapMinuten).toBe(270 + 120)
  })

  test('niet-slaap activiteiten en kapotte sessies worden genegeerd', () => {
    const resultaat = parseFitSlaapSessies([
      { startTimeMillis: '1000', endTimeMillis: '2000', activityType: 7 }, // wandelen
      { startTimeMillis: '5000', endTimeMillis: '1000', activityType: 72 }, // eind vóór start
      { startTimeMillis: 'abc', endTimeMillis: 'def', activityType: 72 },
    ])
    expect(resultaat).toHaveLength(0)
  })
})

describe('combineerDagMetingen', () => {
  test('vult velden per datum aan zonder bestaande te overschrijven', () => {
    const resultaat = combineerDagMetingen(
      [{ datum: '2026-06-10', stappen: 8000 }],
      [{ datum: '2026-06-10', slaapMinuten: 400 }, { datum: '2026-06-11', stappen: 200 }],
    )
    expect(resultaat).toEqual([
      { datum: '2026-06-10', stappen: 8000, slaapMinuten: 400, hartslag: undefined, calorieen: undefined },
      { datum: '2026-06-11', stappen: 200, slaapMinuten: undefined, hartslag: undefined, calorieen: undefined },
    ])
  })
})
