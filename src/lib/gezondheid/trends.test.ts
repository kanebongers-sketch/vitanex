import { describe, expect, test } from 'vitest'
import { verschuifDatum } from './statistiek'
import {
  bouwTrend, laatsteMeting, miniTrend, periodeSamenvatting, trendPerDag, trendPerMaand, trendPerWeek,
} from './trends'
import type { GezondheidsDag, MetriekSleutel } from './types'

const VANDAAG = '2026-10-09' // vrijdag

function dag(datum: string, sleutel: MetriekSleutel, waarde: number): GezondheidsDag {
  return { datum, waarden: { [sleutel]: waarde }, fases: null, herkomst: {} }
}

describe('trendPerDag', () => {
  test('30 dagen tot en met vandaag, gaten als null', () => {
    // Arrange
    const dagen = [dag('2026-10-07', 'slaap', 420), dag(VANDAAG, 'slaap', 450)]
    // Act
    const punten = trendPerDag(dagen, 'slaap', VANDAAG)
    // Assert
    expect(punten).toHaveLength(30)
    expect(punten[29]).toMatchObject({ sleutel: VANDAAG, waarde: 450, onvolledig: false, telMee: true })
    expect(punten[28].waarde).toBeNull()
    expect(punten[27].waarde).toBe(420)
  })

  test('vandaag is onvolledig bij optellende metrieken', () => {
    const punten = trendPerDag([dag(VANDAAG, 'stappen', 1200)], 'stappen', VANDAAG)
    expect(punten[29]).toMatchObject({ onvolledig: true, telMee: false })
  })
})

describe('trendPerWeek', () => {
  test('gemiddelde per dag per week; lopende dag telt niet mee bij stappen', () => {
    const dagen = [
      dag('2026-10-05', 'stappen', 8000), // ma
      dag('2026-10-06', 'stappen', 6000), // di
      dag(VANDAAG, 'stappen', 500),        // vandaag, nog niet af
      dag('2026-09-30', 'stappen', 10000), // vorige week
    ]
    const weken = trendPerWeek(dagen, 'stappen', VANDAAG)
    expect(weken).toHaveLength(12)
    expect(weken[11]).toMatchObject({ sleutel: '2026-10-05', waarde: 7000, aantal: 2, onvolledig: true })
    expect(weken[10]).toMatchObject({ sleutel: '2026-09-28', waarde: 10000, aantal: 1, onvolledig: false })
  })
})

describe('trendPerMaand', () => {
  test('12 maanden, oudste eerst', () => {
    const maanden = trendPerMaand([dag('2026-09-15', 'gewicht', 80), dag('2026-09-20', 'gewicht', 79)], 'gewicht', VANDAAG)
    expect(maanden).toHaveLength(12)
    expect(maanden[0].sleutel).toBe('2025-11-01')
    expect(maanden[10]).toMatchObject({ sleutel: '2026-09-01', waarde: 79.5, aantal: 2 })
    expect(maanden[11].waarde).toBeNull()
  })
})

describe('periodeSamenvatting', () => {
  test('weegt naar dagen en slaat de lopende dag over', () => {
    const dagen = [
      dag(verschuifDatum(VANDAAG, -2), 'stappen', 6000),
      dag(verschuifDatum(VANDAAG, -1), 'stappen', 8000),
      dag(VANDAAG, 'stappen', 100),
    ]
    const resultaat = periodeSamenvatting(bouwTrend(dagen, 'stappen', 'dag', VANDAAG), 'stappen')
    expect(resultaat).toEqual({ waarde: 7000, dagen: 2 })
  })

  test('zonder metingen geen gemiddelde', () => {
    expect(periodeSamenvatting(trendPerDag([], 'hrv', VANDAAG), 'hrv')).toEqual({ waarde: null, dagen: 0 })
  })
})

describe('trainingen tellen op', () => {
  test('een week is het totaal aan trainingstijd, vandaag inbegrepen', () => {
    const dagen = [dag('2026-10-06', 'workouts', 30), dag(VANDAAG, 'workouts', 45)]
    const weken = trendPerWeek(dagen, 'workouts', VANDAAG)
    expect(weken[11]).toMatchObject({ waarde: 75, aantal: 2 })
    expect(periodeSamenvatting(trendPerDag(dagen, 'workouts', VANDAAG), 'workouts')).toEqual({ waarde: 75, dagen: 2 })
  })
})

describe('miniTrend en laatsteMeting', () => {
  test('minitrend heeft altijd 7 dagen', () => {
    const mini = miniTrend([dag(VANDAAG, 'hrv', 40)], 'hrv', VANDAAG)
    expect(mini).toEqual([null, null, null, null, null, null, 40])
  })

  test('laatste meting met hoeveel dagen geleden', () => {
    const dagen = [dag('2026-10-01', 'gewicht', 80), dag('2026-10-06', 'gewicht', 79.4)]
    expect(laatsteMeting(dagen, 'gewicht', VANDAAG)).toEqual({ waarde: 79.4, datum: '2026-10-06', dagenGeleden: 3 })
    expect(laatsteMeting(dagen, 'stappen', VANDAAG)).toBeNull()
  })
})
