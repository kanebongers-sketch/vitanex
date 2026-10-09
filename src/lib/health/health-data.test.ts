import { describe, expect, test } from 'vitest'
import {
  datumDagenTerug, datumInNL, heeftMeetwaarde, mergeDagMetingen, middernachtNL, normaliseerBron, rondAf,
  type DagRij,
} from './health-data'

describe('normaliseerBron', () => {
  test('accepteert de bronnen die de database toestaat', () => {
    expect(normaliseerBron('health_connect')).toBe('health_connect')
    expect(normaliseerBron('healthkit')).toBe('healthkit')
    expect(normaliseerBron('google_health')).toBe('google_health')
  })

  test('zet oude bronnamen om (die braken de check-constraint)', () => {
    expect(normaliseerBron('apple_health')).toBe('healthkit')
    expect(normaliseerBron('google_fit')).toBe('google_health')
  })

  test('weigert onbekende waarden', () => {
    expect(normaliseerBron('fitbit')).toBeNull()
    expect(normaliseerBron(42)).toBeNull()
  })
})

describe('mergeDagMetingen', () => {
  const bestaand: DagRij[] = [
    { datum: '2026-06-10', stappen: 5000, slaap_minuten: 400, rusthartslag: 58, bedtijd: '2026-06-09T22:10:00.000Z' },
  ]

  test('nieuwe waarden winnen, lege velden behouden bestaande data van dezelfde bron', () => {
    // Arrange
    const nieuw = [{ datum: '2026-06-10', stappen: 7200, actieveKcal: 410 }]
    // Act
    const [rij] = mergeDagMetingen(bestaand, nieuw, 'health_connect')
    // Assert
    expect(rij.stappen).toBe(7200)
    expect(rij.slaap_minuten).toBe(400)
    expect(rij.rusthartslag).toBe(58)
    expect(rij.actieve_kcal).toBe(410)
    expect(rij.bedtijd).toBe('2026-06-09T22:10:00.000Z')
    expect(rij.hrv_ms).toBeNull()
    expect(rij.bron).toBe('health_connect')
  })

  test('rondt af op de precisie van de kolom', () => {
    const [rij] = mergeDagMetingen([], [
      { datum: '2026-06-10', hartslag: 61.7, rusthartslag: 54.26, gewichtKg: 80.456 },
    ], 'healthkit')
    expect(rij.hartslag_gemiddeld).toBe(62)
    expect(rij.rusthartslag).toBe(54.3)
    expect(rij.gewicht_kg).toBe(80.46)
  })

  test('dagen zonder enige meetwaarde worden overgeslagen', () => {
    const rijen = mergeDagMetingen([], [{ datum: '2026-06-09' }, { datum: '2026-06-10', stappen: 100 }], 'healthkit')
    expect(rijen.map(r => r.datum)).toEqual(['2026-06-10'])
  })
})

describe('heeftMeetwaarde', () => {
  test('herkent lege en gevulde metingen', () => {
    expect(heeftMeetwaarde({ datum: '2026-06-11' })).toBe(false)
    expect(heeftMeetwaarde({ datum: '2026-06-11', stappen: null })).toBe(false)
    expect(heeftMeetwaarde({ datum: '2026-06-11', stappen: 0 })).toBe(true)
    expect(heeftMeetwaarde({ datum: '2026-06-11', hrvMs: 40 })).toBe(true)
  })
})

describe('datums in Nederlandse tijd', () => {
  test('UTC-avond valt in Nederland op de volgende dag (zomertijd)', () => {
    expect(datumInNL(new Date('2026-06-10T22:30:00Z'))).toBe('2026-06-11')
  })

  test('middernachtNL kent zomer- en wintertijd', () => {
    expect(middernachtNL('2026-06-10').toISOString()).toBe('2026-06-09T22:00:00.000Z')
    expect(middernachtNL('2026-12-10').toISOString()).toBe('2026-12-09T23:00:00.000Z')
  })

  test('datumDagenTerug telt kalenderdagen terug', () => {
    expect(datumDagenTerug(2, new Date('2026-10-09T10:00:00Z'))).toBe('2026-10-07')
  })

  test('rondAf', () => {
    expect(rondAf(1.256, 2)).toBe(1.26)
    expect(rondAf(7.5, 0)).toBe(8)
  })
})
