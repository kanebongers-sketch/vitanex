import { describe, it, expect } from 'vitest'
import { vanOura } from './herstel'
import { bouwOuraPayloads, leesReadiness, leesSlapen } from './oura'

// Payload-vorm volgens cloud.ouraring.com/docs (API v2, juli 2026).

const READINESS_ANTWOORD = {
  data: [
    {
      id: 'a1',
      day: '2026-07-15',
      score: 81,
      temperature_deviation: -0.2,
      timestamp: '2026-07-15T00:00:00+02:00',
      contributors: { hrv_balance: 85, resting_heart_rate: 92, sleep_balance: 77 },
    },
  ],
  next_token: null,
}

const SLAAP_ANTWOORD = {
  data: [
    {
      id: 's1',
      day: '2026-07-15',
      type: 'long_sleep',
      period: 0,
      average_hrv: 55,
      lowest_heart_rate: 46,
      average_heart_rate: 52,
      total_sleep_duration: 27_000, // 7u30
      time_in_bed: 29_400,
      efficiency: 92,
      bedtime_start: '2026-07-14T23:10:00+02:00',
      bedtime_end: '2026-07-15T07:20:00+02:00',
    },
  ],
  next_token: null,
}

describe('narrowing van het Oura-antwoord', () => {
  it('leest readiness en slaap', () => {
    const [r] = leesReadiness(READINESS_ANTWOORD)
    const [s] = leesSlapen(SLAAP_ANTWOORD)

    expect(r?.dag).toBe('2026-07-15')
    expect(r?.score).toBe(81)
    expect(s?.hrvMs).toBe(55)
    expect(s?.efficientie).toBe(92)
  })

  it('overleeft een leeg of kapot antwoord', () => {
    expect(leesReadiness({})).toEqual([])
    expect(leesSlapen(null)).toEqual([])
  })
})

describe('bouwOuraPayloads → vanOura', () => {
  it('levert een meting die de normalizer volledig kan lezen', () => {
    // Act
    const [payload] = bouwOuraPayloads(leesReadiness(READINESS_ANTWOORD), leesSlapen(SLAAP_ANTWOORD))
    const meting = vanOura(payload!.datum, payload!.ruw)

    // Assert
    expect(meting.bron).toBe('oura')
    expect(meting.datum).toBe('2026-07-15')
    expect(meting.hrvMs).toBe(55)
    expect(meting.rustHartslag).toBe(46) // lowest, niet average
    expect(meting.slaapMinuten).toBe(450) // 27000s → 7u30
    expect(meting.slaapEfficientie).toBe(92)
    expect(meting.leverancierScore).toBe(81)
  })

  it('gebruikt de échte efficiency, niet de gelijknamige contributor-score', () => {
    // Arrange — dit is de valkuil: `daily_sleep.contributors.efficiency` is een
    // 0-100 PUNTENWAARDERING, `sleep.efficiency` is het echte percentage. Ze
    // heten hetzelfde en zijn verschillend. Hier verschilt de nacht (92%) van
    // wat Oura's daily_sleep-contributor zou zeggen.
    const slapen = leesSlapen({ data: [{ ...SLAAP_ANTWOORD.data[0], efficiency: 92 }] })

    // Act
    const [payload] = bouwOuraPayloads([], slapen)
    const meting = vanOura(payload!.datum, payload!.ruw)

    // Assert
    expect(meting.slaapEfficientie).toBe(92)
  })

  it('negeert een dutje en neemt de hoofdslaap', () => {
    // Arrange — een late_nap op dezelfde dag.
    const slapen = leesSlapen({
      data: [
        ...SLAAP_ANTWOORD.data,
        { id: 's2', day: '2026-07-15', type: 'late_nap', average_hrv: 20, total_sleep_duration: 3_600, efficiency: 60 },
      ],
    })

    // Act
    const [payload] = bouwOuraPayloads(leesReadiness(READINESS_ANTWOORD), slapen)
    const meting = vanOura(payload!.datum, payload!.ruw)

    // Assert — het dutje verlaagt je HRV van de nacht niet.
    expect(meting.hrvMs).toBe(55)
    expect(meting.slaapMinuten).toBe(450)
  })

  it('negeert een slaap die de gebruiker verwijderd heeft', () => {
    // Arrange
    const slapen = leesSlapen({
      data: [{ id: 's3', day: '2026-07-15', type: 'deleted', average_hrv: 99, total_sleep_duration: 1_000 }],
    })

    // Act
    const [payload] = bouwOuraPayloads([], slapen)

    // Assert — geen enkele nacht → geen payload. Data die hij wiste, blijft weg.
    expect(payload).toBeUndefined()
  })

  it('neemt de langste nacht als er twee periodes zijn', () => {
    // Arrange — onderbroken slaap: twee long_sleep-records op één dag.
    const slapen = leesSlapen({
      data: [
        { id: 'kort', day: '2026-07-15', type: 'long_sleep', total_sleep_duration: 3_600, average_hrv: 30 },
        { id: 'lang', day: '2026-07-15', type: 'long_sleep', total_sleep_duration: 25_200, average_hrv: 58 },
      ],
    })

    // Act
    const [payload] = bouwOuraPayloads([], slapen)
    const meting = vanOura(payload!.datum, payload!.ruw)

    // Assert — de langste is de hoofdslaap; we tellen ze NIET op tot 8u.
    expect(meting.slaapMinuten).toBe(420)
    expect(meting.hrvMs).toBe(58)
  })

  it('bewaart een dag met alleen slaap, zonder readiness', () => {
    // Arrange — readiness is 's ochtends soms nog niet berekend.
    // Act
    const [payload] = bouwOuraPayloads([], leesSlapen(SLAAP_ANTWOORD))
    const meting = vanOura(payload!.datum, payload!.ruw)

    // Assert — HRV en slaap zijn wél gemeten; die weggooien omdat het cijfer
    // ontbreekt zou echte data verliezen.
    expect(meting.leverancierScore).toBeNull()
    expect(meting.hrvMs).toBe(55)
    expect(meting.slaapMinuten).toBe(450)
  })
})
