import { describe, expect, test } from 'vitest'
import { heeftMinimaalPlan, normaliseerPlan, PLAN_INFO, PLAN_VOLGORDE } from './plan'

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
