import { describe, expect, test } from 'vitest'
import {
  heeftFeature,
  heeftMinimaalPlan,
  normaliseerPlan,
  PLAN_INFO,
  PLAN_VOLGORDE,
  VITA_GRATIS_BERICHTEN_PER_DAG,
} from './plan'

describe('normaliseerPlan', () => {
  test('laat geldige plannen door', () => {
    expect(normaliseerPlan('starter')).toBe('starter')
    expect(normaliseerPlan('groei')).toBe('groei')
    expect(normaliseerPlan('enterprise')).toBe('enterprise')
  })

  test('valt terug op starter voor null, undefined en onbekende waarden', () => {
    expect(normaliseerPlan(null)).toBe('starter')
    expect(normaliseerPlan(undefined)).toBe('starter')
    expect(normaliseerPlan('premium')).toBe('starter')
    expect(normaliseerPlan(42)).toBe('starter')
  })
})

describe('heeftMinimaalPlan', () => {
  test('een plan voldoet aan zichzelf als minimum', () => {
    for (const plan of PLAN_VOLGORDE) {
      expect(heeftMinimaalPlan(plan, plan)).toBe(true)
    }
  })

  test('hogere plannen voldoen aan lagere minima, niet andersom', () => {
    expect(heeftMinimaalPlan('groei', 'starter')).toBe(true)
    expect(heeftMinimaalPlan('enterprise', 'groei')).toBe(true)
    expect(heeftMinimaalPlan('starter', 'groei')).toBe(false)
    expect(heeftMinimaalPlan('groei', 'enterprise')).toBe(false)
  })
})

describe('heeftFeature', () => {
  test('starter (gratis) heeft geen premium-features', () => {
    expect(heeftFeature('starter', 'vita_onbeperkt')).toBe(false)
    expect(heeftFeature('starter', 'persoonlijke_patronen')).toBe(false)
    expect(heeftFeature('starter', 'hr_analytics')).toBe(false)
  })

  test('groei en enterprise hebben alle premium-features', () => {
    for (const plan of ['groei', 'enterprise'] as const) {
      expect(heeftFeature(plan, 'vita_onbeperkt')).toBe(true)
      expect(heeftFeature(plan, 'persoonlijke_patronen')).toBe(true)
      expect(heeftFeature(plan, 'hr_analytics')).toBe(true)
    }
  })

  test('de gratis Vita-daglimiet is een werkbaar aantal', () => {
    expect(VITA_GRATIS_BERICHTEN_PER_DAG).toBeGreaterThanOrEqual(5)
  })
})

describe('PLAN_INFO', () => {
  test('elk plan heeft een positieve prijs en een naam', () => {
    for (const plan of PLAN_VOLGORDE) {
      expect(PLAN_INFO[plan].prijsPerGebruiker).toBeGreaterThan(0)
      expect(PLAN_INFO[plan].naam.length).toBeGreaterThan(0)
    }
  })

  test('alleen enterprise is niet zelf online af te sluiten', () => {
    expect(PLAN_INFO.starter.zelfService).toBe(true)
    expect(PLAN_INFO.groei.zelfService).toBe(true)
    expect(PLAN_INFO.enterprise.zelfService).toBe(false)
  })
})
