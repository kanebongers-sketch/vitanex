import { describe, it, expect } from 'vitest'
import { targetOmschrijving, isFrequentie, isPijler, PIJLER_LABELS } from './taken'
import { PIJLERS } from './pijlers'

describe('targetOmschrijving', () => {
  it('toont "Elke dag" voor dagelijkse taken', () => {
    expect(targetOmschrijving({ frequentie: 'dagelijks', target_per_week: 7 })).toBe('Elke dag')
  })

  it('toont "N× per week" voor wekelijkse taken', () => {
    expect(targetOmschrijving({ frequentie: 'wekelijks', target_per_week: 3 })).toBe('3× per week')
  })
})

describe('isFrequentie', () => {
  it('herkent geldige frequenties', () => {
    expect(isFrequentie('dagelijks')).toBe(true)
    expect(isFrequentie('wekelijks')).toBe(true)
  })
  it('wijst onbekende waarden af', () => {
    expect(isFrequentie('maandelijks')).toBe(false)
    expect(isFrequentie(null)).toBe(false)
  })
})

describe('isPijler (re-export uit pijlers)', () => {
  it('herkent de drie pijlers', () => {
    expect(isPijler('body')).toBe(true)
    expect(isPijler('mind')).toBe(true)
    expect(isPijler('performance')).toBe(true)
  })
  it('wijst onbekende pijlers af', () => {
    expect(isPijler('spirit')).toBe(false)
  })
})

describe('PIJLER_LABELS reconcile', () => {
  it('leidt labels af uit de centrale pijlers-bron (één consistente definitie)', () => {
    expect(PIJLER_LABELS.body).toBe(PIJLERS.body.label)
    expect(PIJLER_LABELS.mind).toBe(PIJLERS.mind.label)
    expect(PIJLER_LABELS.performance).toBe(PIJLERS.performance.label)
  })
})
