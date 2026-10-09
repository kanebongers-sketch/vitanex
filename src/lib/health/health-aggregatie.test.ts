import { describe, expect, test } from 'vitest'
import {
  alsVeld, bucketsPerDag, combineerPerDag, dagVanInterval, puntenPerDag, slaapPerNacht, workoutMinutenPerDag,
} from './health-aggregatie'

describe('bucketsPerDag', () => {
  test('dag-buckets vanaf NL-middernacht landen op de juiste datum', () => {
    // Arrange: zomertijd, middernacht NL = 22:00 UTC
    const buckets = [
      { start: '2026-06-09T22:00:00Z', eind: '2026-06-10T22:00:00Z', waarde: 8000 },
      { start: '2026-06-10T22:00:00Z', eind: '2026-06-11T08:00:00Z', waarde: 1200 },
    ]
    // Act
    const perDag = bucketsPerDag(buckets)
    // Assert
    expect(perDag.get('2026-06-10')).toBe(8000)
    expect(perDag.get('2026-06-11')).toBe(1200)
  })

  test('24-uurs-buckets over de wintertijdwissel schuiven niet een dag op', () => {
    // 25 okt 2026: klok gaat terug. Bucket van 26 okt start dan om 23:00 NL op 25 okt.
    const perDag = bucketsPerDag([{ start: '2026-10-25T22:00:00Z', eind: '2026-10-26T22:00:00Z', waarde: 5000 }])
    expect([...perDag.keys()]).toEqual(['2026-10-26'])
  })

  test('lege en negatieve buckets vallen weg', () => {
    const perDag = bucketsPerDag([
      { start: '2026-06-09T22:00:00Z', eind: '2026-06-10T22:00:00Z', waarde: 0 },
      { start: '2026-06-10T22:00:00Z', eind: '2026-06-11T22:00:00Z', waarde: -4 },
    ])
    expect(perDag.size).toBe(0)
  })
})

describe('puntenPerDag', () => {
  const punten = [
    { tijd: '2026-06-10T05:00:00Z', waarde: 60 },
    { tijd: '2026-06-10T18:00:00Z', waarde: 56 },
    { tijd: '2026-06-11T06:00:00Z', waarde: 58 },
  ]

  test('gemiddelde per dag (rusthartslag, HRV)', () => {
    expect(puntenPerDag(punten, 'gemiddelde').get('2026-06-10')).toBe(58)
  })

  test('laatste waarde van de dag (gewicht, VO2max)', () => {
    expect(puntenPerDag(punten, 'laatste').get('2026-06-10')).toBe(56)
  })

  test('som per dag (verdiepingen)', () => {
    expect(puntenPerDag(punten, 'som').get('2026-06-10')).toBe(116)
  })

  test('kapotte punten worden overgeslagen', () => {
    const perDag = puntenPerDag([{ tijd: 'nooit', waarde: 1 }, { tijd: '2026-06-10T05:00:00Z', waarde: NaN }], 'som')
    expect(perDag.size).toBe(0)
  })
})

describe('slaapPerNacht', () => {
  test('nacht hoort bij de wekdag; wakker telt niet als slaap; stadia per soort', () => {
    // Arrange: 23:00 → 07:00 NL (zomertijd), met 20 min wakker
    const sessie = {
      start: '2026-06-09T21:00:00Z',
      eind: '2026-06-10T05:00:00Z',
      stadia: [
        { start: '2026-06-09T21:00:00Z', eind: '2026-06-09T21:20:00Z', stadium: 'wakker' as const },
        { start: '2026-06-09T21:20:00Z', eind: '2026-06-10T00:20:00Z', stadium: 'licht' as const },
        { start: '2026-06-10T00:20:00Z', eind: '2026-06-10T02:20:00Z', stadium: 'diep' as const },
        { start: '2026-06-10T02:20:00Z', eind: '2026-06-10T05:00:00Z', stadium: 'rem' as const },
      ],
    }
    // Act
    const nacht = slaapPerNacht([sessie]).get('2026-06-10')
    // Assert
    expect(nacht).toEqual({
      slaapMinuten: 460, slaapLichtMin: 180, slaapDiepMin: 120, slaapRemMin: 160, slaapWakkerMin: 20,
      bedtijd: '2026-06-09T21:00:00.000Z', wektijd: '2026-06-10T05:00:00.000Z',
    })
  })

  test('een dutje telt mee in het totaal, bed/wektijd blijven van de hoofdslaap', () => {
    const nacht = slaapPerNacht([
      { start: '2026-06-09T21:00:00Z', eind: '2026-06-10T05:00:00Z' },
      { start: '2026-06-10T12:00:00Z', eind: '2026-06-10T12:30:00Z' },
    ]).get('2026-06-10')
    expect(nacht?.slaapMinuten).toBe(510)
    expect(nacht?.wektijd).toBe('2026-06-10T05:00:00.000Z')
    expect(nacht?.slaapDiepMin).toBeUndefined() // geen stadia → geen verzonnen verdeling
  })

  test('sessies met onmogelijke tijden worden genegeerd', () => {
    expect(slaapPerNacht([{ start: '2026-06-10T05:00:00Z', eind: '2026-06-10T04:00:00Z' }]).size).toBe(0)
  })
})

describe('workoutMinutenPerDag', () => {
  test('telt trainingsminuten op per startdag', () => {
    const perDag = workoutMinutenPerDag([
      { externId: 'a', soort: 'running', start: '2026-06-10T06:00:00Z', eind: '2026-06-10T06:30:00Z' },
      { externId: 'b', soort: 'yoga', start: '2026-06-10T17:00:00Z', eind: '2026-06-10T17:45:00Z' },
    ])
    expect(perDag.get('2026-06-10')).toBe(75)
  })
})

describe('combineerPerDag', () => {
  test('voegt velden per datum samen en sorteert op datum', () => {
    const dagen = combineerPerDag(
      alsVeld('stappen', new Map([['2026-06-11', 900], ['2026-06-10', 8000]])),
      alsVeld('rusthartslag', new Map([['2026-06-10', 57]])),
    )
    expect(dagen).toEqual([
      { datum: '2026-06-10', stappen: 8000, rusthartslag: 57 },
      { datum: '2026-06-11', stappen: 900 },
    ])
  })

  test('de eerste bron die een veld vult wint', () => {
    const dagen = combineerPerDag(
      alsVeld('stappen', new Map([['2026-06-10', 1]])),
      alsVeld('stappen', new Map([['2026-06-10', 2]])),
    )
    expect(dagen[0].stappen).toBe(1)
  })
})

describe('dagVanInterval', () => {
  test('gebruikt het midden van het interval', () => {
    expect(dagVanInterval('2026-06-09T22:00:00Z', '2026-06-10T22:00:00Z')).toBe('2026-06-10')
  })
})
