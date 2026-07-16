import { describe, it, expect } from 'vitest'
import { vanWhoop } from './herstel'
import { bouwWhoopPayloads, datumVanRecovery, leesRecoveries, leesSlapen } from './whoop'

// De payloads hieronder volgen de vorm uit developer.whoop.com/api (v2, juli
// 2026). Ze zijn expres compleet: als WHOOP een veld hernoemt, moet een test
// hier rood worden — niet een gebruiker die zich afvraagt waarom zijn HRV weg is.

const RECOVERY_ANTWOORD = {
  records: [
    {
      cycle_id: 93845,
      sleep_id: 'ecfc6a15-4661-442f-a9a4-f160dd7afae8',
      user_id: 10129,
      created_at: '2026-07-15T05:25:44.774Z',
      updated_at: '2026-07-15T05:25:44.774Z',
      score_state: 'SCORED',
      score: {
        user_calibrating: false,
        recovery_score: 71,
        resting_heart_rate: 48,
        hrv_rmssd_milli: 62.5,
        spo2_percentage: 97.2,
        skin_temp_celsius: 33.4,
      },
    },
  ],
  next_token: null,
}

const SLAAP_ANTWOORD = {
  records: [
    {
      id: 'ecfc6a15-4661-442f-a9a4-f160dd7afae8',
      cycle_id: 93845,
      start: '2026-07-14T22:10:00.000Z',
      end: '2026-07-15T05:20:00.000Z',
      timezone_offset: '+02:00',
      nap: false,
      score_state: 'SCORED',
      score: {
        stage_summary: { total_in_bed_time_milli: 25_800_000, total_awake_time_milli: 2_100_000 },
        sleep_performance_percentage: 89,
        sleep_efficiency_percentage: 91.7,
        sleep_consistency_percentage: 76,
        respiratory_rate: 14.2,
      },
    },
  ],
  next_token: null,
}

describe('narrowing van het WHOOP-antwoord', () => {
  it('leest een recovery-record', () => {
    // Act
    const [r] = leesRecoveries(RECOVERY_ANTWOORD)

    // Assert
    expect(r?.slaapId).toBe('ecfc6a15-4661-442f-a9a4-f160dd7afae8')
    expect(r?.score?.hrv_rmssd_milli).toBe(62.5)
  })

  it('negeert de score van een record dat nog niet gescoord is', () => {
    // Arrange — WHOOP levert PENDING_SCORE zónder score-object.
    const wachtend = { records: [{ sleep_id: 'x', created_at: '2026-07-15T05:00:00Z', score_state: 'PENDING_SCORE' }] }

    // Act
    const [r] = leesRecoveries(wachtend)

    // Assert — geen score = null, niet 0. Een ongescoorde ochtend is geen slechte ochtend.
    expect(r?.score).toBeNull()
  })

  it('overleeft een antwoord dat helemaal geen records heeft', () => {
    expect(leesRecoveries({})).toEqual([])
    expect(leesRecoveries(null)).toEqual([])
    expect(leesSlapen({ records: 'kapot' })).toEqual([])
  })
})

describe('de dag waar een recovery bij hoort', () => {
  it('gebruikt de wektijd + tijdzone van de bijbehorende slaap', () => {
    // Arrange — 05:20 UTC = 07:20 lokaal (+02:00) op de 15e.
    const [recovery] = leesRecoveries(RECOVERY_ANTWOORD)
    const [slaap] = leesSlapen(SLAAP_ANTWOORD)

    // Act
    const datum = datumVanRecovery(recovery!, slaap!)

    // Assert
    expect(datum).toBe('2026-07-15')
  })

  it('valt terug op created_at als de slaap ontbreekt', () => {
    // Arrange
    const [recovery] = leesRecoveries(RECOVERY_ANTWOORD)

    // Act
    const datum = datumVanRecovery(recovery!, null)

    // Assert — minder precies (UTC), maar wél een antwoord. Zie de comment in whoop.ts.
    expect(datum).toBe('2026-07-15')
  })

  it('geeft null als er niets te dateren valt', () => {
    expect(datumVanRecovery({ slaapId: null, aangemaaktOp: null, score: null }, null)).toBeNull()
  })
})

describe('bouwWhoopPayloads → vanWhoop', () => {
  it('levert een meting die de normalizer volledig kan lezen', () => {
    // Arrange
    const recoveries = leesRecoveries(RECOVERY_ANTWOORD)
    const slapen = leesSlapen(SLAAP_ANTWOORD)

    // Act
    const [payload] = bouwWhoopPayloads(recoveries, slapen)
    const meting = vanWhoop(payload!.datum, payload!.ruw)

    // Assert
    expect(meting.bron).toBe('whoop')
    expect(meting.datum).toBe('2026-07-15')
    expect(meting.hrvMs).toBe(62.5)
    expect(meting.rustHartslag).toBe(48)
    expect(meting.leverancierScore).toBe(71)

    // Slaapduur uit stage_summary: 25.800.000ms in bed − 2.100.000ms wakker
    // = 23.700.000ms = 395 min (6u35). Dit stond ooit hard op null, waardoor
    // een Whoop-only gebruiker zijn slaapduur nergens zag en de Whoop-app
    // alsnog opende. Deze regel is de gouden regel van LifeOS, in een assert.
    expect(meting.slaapMinuten).toBe(395)
  })

  it('zet de EFFICIENCY in slaapEfficientie, niet de sleep performance', () => {
    // Arrange — WHOOP heeft twee cijfers die op elkaar lijken:
    //   sleep_performance_percentage = 89   (geslapen t.o.v. je behoefte)
    //   sleep_efficiency_percentage  = 91.7 (geslapen t.o.v. tijd in bed)
    // `HerstelMeting.slaapEfficientie` is gedocumenteerd als dat tweede.
    const recoveries = leesRecoveries(RECOVERY_ANTWOORD)
    const slapen = leesSlapen(SLAAP_ANTWOORD)

    // Act
    const [payload] = bouwWhoopPayloads(recoveries, slapen)
    const meting = vanWhoop(payload!.datum, payload!.ruw)

    // Assert — 91.7, niet 89. Anders toont de UI een cijfer dat iets anders
    // betekent dan het label erboven.
    expect(meting.slaapEfficientie).toBe(91.7)
    expect(meting.slaapEfficientie).not.toBe(89)
  })

  it('laat een middagdutje de slaapefficiëntie van de nacht niet overschrijven', () => {
    // Arrange — een nap met dezelfde id-koppeling zou anders meetellen.
    const slapen = leesSlapen({
      records: [
        ...SLAAP_ANTWOORD.records,
        {
          id: 'ecfc6a15-4661-442f-a9a4-f160dd7afae8',
          end: '2026-07-15T13:00:00.000Z',
          timezone_offset: '+02:00',
          nap: true,
          score_state: 'SCORED',
          score: { sleep_efficiency_percentage: 40 },
        },
      ],
    })

    // Act
    const [payload] = bouwWhoopPayloads(leesRecoveries(RECOVERY_ANTWOORD), slapen)
    const meting = vanWhoop(payload!.datum, payload!.ruw)

    // Assert — de nacht wint; het dutje telt niet als "jouw slaapefficiëntie".
    expect(meting.slaapEfficientie).toBe(91.7)
  })

  it('geeft nulls i.p.v. nullen als de recovery nog niet gescoord is', () => {
    // Arrange
    const recoveries = leesRecoveries({
      records: [{ sleep_id: 'geen', created_at: '2026-07-15T05:00:00Z', score_state: 'UNSCORABLE' }],
    })

    // Act
    const [payload] = bouwWhoopPayloads(recoveries, [])
    const meting = vanWhoop(payload!.datum, payload!.ruw)

    // Assert — dit is het hart van de eerlijkheidsregel.
    expect(meting.hrvMs).toBeNull()
    expect(meting.leverancierScore).toBeNull()
    expect(meting.leverancierScore).not.toBe(0)
  })
})
