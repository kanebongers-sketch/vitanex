import { describe, it, expect } from 'vitest'
import { macroVerdeling, isDieetvoorkeur } from './voeding'

describe('macroVerdeling', () => {
  it('geeft null wanneer geen macro is ingevuld', () => {
    expect(macroVerdeling({ eiwit_g: null, koolhydraat_g: null, vet_g: null })).toBeNull()
    expect(macroVerdeling({ eiwit_g: 0, koolhydraat_g: 0, vet_g: 0 })).toBeNull()
  })

  it('rekent de macro-energie exact met de Atwater-factoren (4/4/9)', () => {
    const v = macroVerdeling({ eiwit_g: 150, koolhydraat_g: 200, vet_g: 60 })
    expect(v).not.toBeNull()
    expect(v!.eiwit_kcal).toBe(600)
    expect(v!.koolhydraat_kcal).toBe(800)
    expect(v!.vet_kcal).toBe(540)
    expect(v!.totaal_kcal).toBe(1940)
  })

  it('geeft afgeronde percentages die samen ~100 zijn', () => {
    const v = macroVerdeling({ eiwit_g: 150, koolhydraat_g: 200, vet_g: 60 })!
    expect(v.eiwit_pct).toBe(31)
    expect(v.koolhydraat_pct).toBe(41)
    expect(v.vet_pct).toBe(28)
    expect(v.eiwit_pct + v.koolhydraat_pct + v.vet_pct).toBe(100)
  })

  it('werkt met slechts één macro ingevuld', () => {
    const v = macroVerdeling({ eiwit_g: 100, koolhydraat_g: null, vet_g: null })!
    expect(v.totaal_kcal).toBe(400)
    expect(v.eiwit_pct).toBe(100)
  })
})

describe('isDieetvoorkeur', () => {
  it('herkent geldige voorkeuren', () => {
    expect(isDieetvoorkeur('vegetarisch')).toBe(true)
    expect(isDieetvoorkeur('keto')).toBe(true)
  })

  it('wijst onbekende/niet-string waarden af', () => {
    expect(isDieetvoorkeur('carnivoor')).toBe(false)
    expect(isDieetvoorkeur(42)).toBe(false)
    expect(isDieetvoorkeur(null)).toBe(false)
  })
})
