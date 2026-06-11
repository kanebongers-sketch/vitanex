import { describe, expect, test } from 'vitest'
import {
  METRICS, berekenVergelijkingen, metricWaarde, vatMetricSamen,
  type TrendPunt,
} from './gezondheid-metrics'

function dagen(aantal: number, bouw: (i: number) => Partial<TrendPunt>): TrendPunt[] {
  // i = 0 is de oudste dag
  return Array.from({ length: aantal }, (_, i) => ({
    datum: `2026-06-${String(i + 1).padStart(2, '0')}`,
    ...bouw(i),
  }))
}

describe('metricWaarde', () => {
  test('geeft de numerieke waarde van een gewone metriek', () => {
    const punt: TrendPunt = { datum: '2026-06-01', stappen: 8000 }
    expect(metricWaarde(punt, 'stappen')).toBe(8000)
  })

  test('vertaalt stemming naar een score van 1 tot 5', () => {
    expect(metricWaarde({ datum: '2026-06-01', stemming: 'moe' }, 'stemming')).toBe(1)
    expect(metricWaarde({ datum: '2026-06-01', stemming: 'energiek' }, 'stemming')).toBe(5)
  })

  test('geeft undefined bij ontbrekende data', () => {
    expect(metricWaarde({ datum: '2026-06-01' }, 'slaap')).toBeUndefined()
    expect(metricWaarde({ datum: '2026-06-01' }, 'stemming')).toBeUndefined()
  })
})

describe('vatMetricSamen', () => {
  test('pakt de laatste beschikbare waarde met datum', () => {
    const trend = dagen(5, i => ({ stappen: 1000 * (i + 1) }))
    const resultaat = vatMetricSamen(trend, 'stappen')
    expect(resultaat?.laatste).toBe(5000)
    expect(resultaat?.laatsteDatum).toBe('2026-06-05')
  })

  test('slaat dagen zonder meting over voor de laatste waarde', () => {
    const trend: TrendPunt[] = [
      { datum: '2026-06-01', hartslag: 60 },
      { datum: '2026-06-02' },
      { datum: '2026-06-03' },
    ]
    const resultaat = vatMetricSamen(trend, 'hartslag')
    expect(resultaat?.laatste).toBe(60)
    expect(resultaat?.laatsteDatum).toBe('2026-06-01')
  })

  test('geeft null als er geen enkele meting is', () => {
    const trend = dagen(5, () => ({ stappen: 100 }))
    expect(vatMetricSamen(trend, 'hartslag')).toBeNull()
  })

  test('sparkline bevat maximaal 14 punten met gaten als null', () => {
    const trend = dagen(20, i => (i % 2 === 0 ? { slaap: 7 } : {}))
    const resultaat = vatMetricSamen(trend, 'slaap')
    expect(resultaat?.spark).toHaveLength(14)
    expect(resultaat?.spark).toContain(null)
  })
})

describe('berekenVergelijkingen', () => {
  test('rapporteert het verschil tussen deze week en vorige week', () => {
    // Vorige week 5000, deze week 7500 → +50%
    const trend = dagen(14, i => ({ stappen: i < 7 ? 5000 : 7500 }))
    const resultaat = berekenVergelijkingen(trend)
    const stappen = resultaat.find(v => v.key === 'stappen')
    expect(stappen).toBeDefined()
    expect(stappen?.tekst).toContain('50% meer')
    expect(stappen?.recent.waarde).toBe(7500)
    expect(stappen?.vorig.waarde).toBe(5000)
  })

  test('zwijgt bij minder dan 3 metingen per periode', () => {
    const trend: TrendPunt[] = [
      ...dagen(7, i => (i < 2 ? { stappen: 5000 } : {})),
      ...dagen(7, i => (i < 2 ? { stappen: 7000 } : {})).map(p => ({ ...p, datum: `2026-06-${String(8 + Number(p.datum.slice(-2))).padStart(2, '0')}` })),
    ]
    expect(berekenVergelijkingen(trend).find(v => v.key === 'stappen')).toBeUndefined()
  })

  test('zwijgt bij een verschil kleiner dan 3 procent', () => {
    const trend = dagen(14, i => ({ stappen: i < 7 ? 5000 : 5050 }))
    expect(berekenVergelijkingen(trend).find(v => v.key === 'stappen')).toBeUndefined()
  })

  test('slaaptekst bevat geen dubbele eenheid', () => {
    const trend = dagen(14, i => ({ slaap: i < 7 ? 6 : 7.5 }))
    const slaap = berekenVergelijkingen(trend).find(v => v.key === 'slaap')
    expect(slaap?.tekst).not.toContain('uur uur')
    expect(slaap?.tekst).not.toMatch(/m uur/)
  })
})

describe('formatters', () => {
  test('slaap formatteert als uren en minuten', () => {
    expect(METRICS.slaap.formatWaarde(7.4)).toBe('7u 24m')
    expect(METRICS.slaap.formatWaarde(8)).toBe('8u')
  })

  test('stappen formatteert met duizendtal-scheiding', () => {
    expect(METRICS.stappen.formatWaarde(8547)).toBe('8.547')
  })
})
