import { describe, it, expect } from 'vitest'
import {
  clamp0100,
  vanSchaal1tot5,
  vanStress1tot10,
  vanCheckin4tot20,
  vanSlaapUren,
  vanDoelRatio,
  pijlerScore,
  wellbeingScore,
  scoreNiveau,
  berekenTrend,
} from './score'

describe('clamp0100', () => {
  it('klemt binnen 0–100 en vangt NaN op', () => {
    expect(clamp0100(-10)).toBe(0)
    expect(clamp0100(150)).toBe(100)
    expect(clamp0100(42)).toBe(42)
    expect(clamp0100(Number.NaN)).toBe(0)
  })
})

describe('normalisatie', () => {
  it('vanSchaal1tot5: 1→0, 3→50, 5→100', () => {
    expect(vanSchaal1tot5(1)).toBe(0)
    expect(vanSchaal1tot5(3)).toBe(50)
    expect(vanSchaal1tot5(5)).toBe(100)
  })

  it('vanStress1tot10 is geïnverteerd: 1→100, 10→0', () => {
    expect(vanStress1tot10(1)).toBe(100)
    expect(vanStress1tot10(10)).toBe(0)
    expect(Math.round(vanStress1tot10(5.5))).toBe(50)
  })

  it('vanCheckin4tot20: 4→0, 12→50, 20→100', () => {
    expect(vanCheckin4tot20(4)).toBe(0)
    expect(vanCheckin4tot20(12)).toBe(50)
    expect(vanCheckin4tot20(20)).toBe(100)
  })

  it('vanSlaapUren: optimaal 7–9u = 100, tekort en teveel dalen', () => {
    expect(vanSlaapUren(8)).toBe(100)
    expect(vanSlaapUren(7)).toBe(100)
    expect(vanSlaapUren(9)).toBe(100)
    expect(vanSlaapUren(6)).toBe(80) // 1u tekort × 20
    expect(vanSlaapUren(5)).toBe(60)
    expect(vanSlaapUren(10)).toBe(88) // 1u teveel × 12
    expect(vanSlaapUren(0)).toBe(0)
  })

  it('vanDoelRatio: onder doel schaalt, boven doel klemt op 100, doel≤0→0', () => {
    expect(vanDoelRatio(5000, 10000)).toBe(50)
    expect(vanDoelRatio(12000, 10000)).toBe(100)
    expect(vanDoelRatio(1000, 0)).toBe(0)
  })
})

describe('pijlerScore', () => {
  it('geeft null bij geen enkele geldige bron', () => {
    expect(pijlerScore([])).toBeNull()
    expect(pijlerScore([{ waarde: Number.NaN }])).toBeNull()
  })

  it('neemt het gemiddelde van bronnen met data', () => {
    expect(pijlerScore([{ waarde: 40 }, { waarde: 60 }])).toBe(50)
  })

  it('respecteert gewichten', () => {
    // 100×3 + 0×1 = 300 / 4 = 75
    expect(pijlerScore([{ waarde: 100, gewicht: 3 }, { waarde: 0, gewicht: 1 }])).toBe(75)
  })

  it('negeert bronnen zonder data en klemt buitenwaarden', () => {
    expect(pijlerScore([{ waarde: 80 }, { waarde: Number.NaN }, { waarde: 200 }])).toBe(90)
  })
})

describe('wellbeingScore', () => {
  it('null als geen enkele pijler data heeft', () => {
    const r = wellbeingScore([
      { key: 'energie', score: null },
      { key: 'slaap', score: null },
    ])
    expect(r).toEqual({ score: null, gemeten: 0, totaal: 2 })
  })

  it('middelt alleen pijlers met data en telt gemeten/totaal', () => {
    const r = wellbeingScore([
      { key: 'energie', score: 80 },
      { key: 'slaap', score: 40 },
      { key: 'stress', score: null },
      { key: 'stemming', score: null },
      { key: 'beweging', score: null },
      { key: 'voeding', score: null },
    ])
    expect(r).toEqual({ score: 60, gemeten: 2, totaal: 6 })
  })
})

describe('scoreNiveau', () => {
  it('mapt elke band op het juiste niveau', () => {
    expect(scoreNiveau(null).niveau).toBe('geen')
    expect(scoreNiveau(85).niveau).toBe('goed')
    expect(scoreNiveau(70).niveau).toBe('goed')
    expect(scoreNiveau(55).niveau).toBe('matig')
    expect(scoreNiveau(40).niveau).toBe('matig')
    expect(scoreNiveau(20).niveau).toBe('laag')
  })

  it('gebruikt canonieke tokens, geen hardcoded hex', () => {
    expect(scoreNiveau(90).kleur).toBe('var(--brand)')
    expect(scoreNiveau(50).kleur).toBe('var(--status-warning)')
    expect(scoreNiveau(10).kleur).toBe('var(--status-danger)')
    expect(scoreNiveau(null).kleur).toBe('var(--text-4)')
  })
})

describe('berekenTrend', () => {
  it('geen richting bij ontbrekende of nul-basis', () => {
    expect(berekenTrend(null, 50)).toEqual({ richting: 'geen', deltaPct: null })
    expect(berekenTrend(50, null)).toEqual({ richting: 'geen', deltaPct: null })
    expect(berekenTrend(50, 0)).toEqual({ richting: 'geen', deltaPct: null })
  })

  it('op/neer boven de ruisdrempel, stabiel eronder', () => {
    expect(berekenTrend(66, 60)).toEqual({ richting: 'op', deltaPct: 10 })
    expect(berekenTrend(54, 60)).toEqual({ richting: 'neer', deltaPct: -10 })
    expect(berekenTrend(61, 60)).toEqual({ richting: 'stabiel', deltaPct: 2 })
  })
})
