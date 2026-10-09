import { describe, expect, test } from 'vitest'
import { METRIEKEN, formatDuur, formatMetWaarde, metriekenInGroep } from './gezondheid-metrics'
import { METRIEK_SLEUTELS } from '@/lib/gezondheid/types'

describe('catalogus', () => {
  test('elke metriek-sleutel heeft een configuratie met dezelfde sleutel', () => {
    for (const sleutel of METRIEK_SLEUTELS) {
      expect(METRIEKEN[sleutel].sleutel).toBe(sleutel)
      expect(METRIEKEN[sleutel].uitleg.length).toBeGreaterThan(20)
    }
  })

  test('alleen metrieken mét normaal kunnen een highlight krijgen', () => {
    for (const sleutel of METRIEK_SLEUTELS) {
      if (METRIEKEN[sleutel].highlight) expect(METRIEKEN[sleutel].heeftNormaal).toBe(true)
    }
  })

  test('groepen bevatten de metrieken in catalogusvolgorde', () => {
    expect(metriekenInGroep('slaap')).toEqual(['slaap', 'bedtijd', 'wektijd'])
  })
})

describe('opmaak', () => {
  test('duur in uren en minuten', () => {
    expect(formatDuur(444)).toBe('7 u 24 min')
    expect(formatDuur(480)).toBe('8 u')
    expect(formatDuur(34)).toBe('34 min')
  })

  test('waarden met eenheid in Nederlandse notatie', () => {
    expect(formatMetWaarde('stappen', 8547)).toBe('8.547 stappen')
    expect(formatMetWaarde('afstand', 6240)).toBe('6,2 km')
    expect(formatMetWaarde('gewicht', 78.44)).toBe('78,4 kg')
    expect(formatMetWaarde('slaap', 444)).toBe('7 u 24 min')
  })

  test('kloktijden vanuit hun anker', () => {
    expect(METRIEKEN.bedtijd.formatteer(690)).toBe('23:30')
    expect(METRIEKEN.bedtijd.formatteer(750)).toBe('00:30')
    expect(METRIEKEN.wektijd.formatteer(425)).toBe('07:05')
  })

  test('highlight-zin zonder dubbele eenheid', () => {
    const regel = METRIEKEN.slaap.highlight
    expect(regel?.beschrijf(regel.formatVerschil(34), false))
      .toBe('Je sliep de afgelopen 7 nachten gemiddeld 34 min minder dan je normaal.')
  })
})
