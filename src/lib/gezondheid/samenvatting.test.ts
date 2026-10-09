import { describe, expect, test } from 'vitest'
import { bronnenVan, liggingTovNormaal, meetmomentLabel, vatAllesSamen, vatMetriekSamen } from './samenvatting'
import { gemiddeldeFases } from './slaap'
import { leesVastgezet, verdeelSamenvatting, wisselVastgezet, STANDAARD_VASTGEZET } from './vastgezet'
import { verschuifDatum } from './statistiek'
import type { GezondheidsDag } from './types'

const VANDAAG = '2026-10-09'

function dag(geleden: number, waarden: GezondheidsDag['waarden'], fases: GezondheidsDag['fases'] = null): GezondheidsDag {
  return { datum: verschuifDatum(VANDAAG, -geleden), waarden, fases, herkomst: {} }
}

describe('vatMetriekSamen', () => {
  test('laatste meting, minitrend en normaal', () => {
    // Arrange
    const dagen = Array.from({ length: 10 }, (_, i) => dag(9 - i, { rusthartslag: 55 + i }))
    // Act
    const s = vatMetriekSamen(dagen, 'rusthartslag', VANDAAG)
    // Assert
    expect(s?.laatste).toEqual({ waarde: 64, datum: VANDAAG, dagenGeleden: 0 })
    expect(s?.actueel).toBe(true)
    expect(s?.mini).toHaveLength(7)
    expect(s?.normaal?.aantal).toBe(9)
  })

  test('een oude meting is niet meer actueel', () => {
    const s = vatMetriekSamen([dag(5, { stappen: 9000 })], 'stappen', VANDAAG)
    expect(s?.actueel).toBe(false)
    expect(s?.normaal).toBeNull()
  })

  test('alleen metrieken met data komen in de samenvatting', () => {
    const lijst = vatAllesSamen([dag(1, { slaap: 420, gewicht: 80 })], VANDAAG)
    expect(lijst.map((s) => s.sleutel)).toEqual(['slaap', 'gewicht'])
  })
})

describe('meetmomentLabel', () => {
  test('slaap van vandaag is de afgelopen nacht; stappen van vandaag zijn nog niet af', () => {
    expect(meetmomentLabel('slaap', VANDAAG, VANDAAG)).toBe('Afgelopen nacht')
    expect(meetmomentLabel('stappen', VANDAAG, VANDAAG)).toBe('Vandaag, tot nu toe')
    expect(meetmomentLabel('gewicht', VANDAAG, VANDAAG)).toBe('Vandaag')
    expect(meetmomentLabel('stappen', '2026-10-08', VANDAAG)).toBe('Gisteren')
  })
})

describe('liggingTovNormaal', () => {
  const normaal = { mediaan: 60, laag: 57, hoog: 63, aantal: 20, vanaf: '2026-09-11', tot: '2026-10-08' }
  test('binnen, boven en onder het gebruikelijke bereik', () => {
    expect(liggingTovNormaal(60, normaal)).toBe('binnen')
    expect(liggingTovNormaal(65, normaal)).toBe('boven')
    expect(liggingTovNormaal(50, normaal)).toBe('onder')
  })
})

describe('gemiddeldeFases', () => {
  test('gemiddelde per fase over nachten met fases; ongemeten fase blijft null', () => {
    const dagen = [
      dag(0, { slaap: 420 }, { diep: 60, licht: 240, rem: 90, wakker: null }),
      dag(1, { slaap: 400 }, { diep: 80, licht: 220, rem: 100, wakker: null }),
      dag(2, { slaap: 400 }),
    ]
    expect(gemiddeldeFases(dagen, VANDAAG)).toEqual({
      fases: { diep: 70, licht: 230, rem: 95, wakker: null }, nachten: 2,
    })
  })

  test('zonder fases geen gemiddelde', () => {
    expect(gemiddeldeFases([dag(0, { slaap: 400 })], VANDAAG)).toBeNull()
  })
})

describe('vastgezet', () => {
  test('leest alleen geldige, unieke sleutels', () => {
    expect(leesVastgezet('["slaap","onzin","slaap","hrv"]')).toEqual(['slaap', 'hrv'])
    expect(leesVastgezet('{kapot')).toBeNull()
    expect(leesVastgezet('"slaap"')).toBeNull()
    expect(leesVastgezet(null)).toBeNull()
  })

  test('wisselen is onveranderlijk', () => {
    const lijst = ['slaap', 'hrv'] as const
    expect(wisselVastgezet(lijst, 'hrv')).toEqual(['slaap'])
    expect(wisselVastgezet(lijst, 'gewicht')).toEqual(['slaap', 'hrv', 'gewicht'])
    expect(lijst).toEqual(['slaap', 'hrv'])
  })

  test('verdeelt in vastgezet en overig; valt terug als niets vastgezets data heeft', () => {
    expect(verdeelSamenvatting(['hrv', 'slaap'], ['stappen', 'slaap', 'hrv']))
      .toEqual({ boven: ['hrv', 'slaap'], overig: ['stappen'] })
    expect(verdeelSamenvatting(['vo2max'], ['stappen', 'slaap']))
      .toEqual({ boven: ['stappen', 'slaap'], overig: [] })
    expect(STANDAARD_VASTGEZET).toContain('slaap')
  })
})

describe('bronnenVan', () => {
  test('leesbare bronnen per metriek, meest gebruikte eerst', () => {
    const dagen: GezondheidsDag[] = [
      { datum: '2026-10-07', waarden: { stappen: 1 }, fases: null, herkomst: { stappen: 'handmatig' } },
      { datum: '2026-10-08', waarden: { stappen: 1, slaap: 1 }, fases: null, herkomst: { stappen: 'healthkit', slaap: 'handmatig' } },
      { datum: '2026-10-09', waarden: { stappen: 1 }, fases: null, herkomst: { stappen: 'apple_health' } },
    ]
    expect(bronnenVan(dagen, 'stappen')).toEqual(['Apple Health', 'Eigen invoer'])
    expect(bronnenVan(dagen, 'hrv')).toEqual([])
  })
})
