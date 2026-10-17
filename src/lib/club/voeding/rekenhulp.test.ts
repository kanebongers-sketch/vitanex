import { describe, expect, it } from 'vitest'
import { afwijkingTekst, bereken, controleerInvoer, kcalUitMacros, leeftijdOp, rustverbruik, verdeling, type RekenInvoer } from './rekenhulp'

const man: RekenInvoer = { gewichtKg: 80, lengteCm: 180, leeftijd: 30, geslacht: 'man', activiteit: 'matig', doel: 'onderhoud', eiwitPerKg: 1.6, vetPercentage: 25 }

describe('rustverbruik (Mifflin-St Jeor)', () => {
  it('rekent voor een man met +5', () => {
    // 10*80 + 6.25*180 - 5*30 + 5 = 800 + 1125 - 150 + 5
    expect(rustverbruik(man)).toBe(1780)
  })

  it('rekent voor een vrouw met -161', () => {
    expect(rustverbruik({ gewichtKg: 65, lengteCm: 168, leeftijd: 40, geslacht: 'vrouw' })).toBe(650 + 1050 - 200 - 161)
  })

  it('neemt bij anders het midden tussen man en vrouw', () => {
    const m = rustverbruik({ ...man, geslacht: 'man' })
    const v = rustverbruik({ ...man, geslacht: 'vrouw' })
    expect(rustverbruik({ ...man, geslacht: 'anders' })).toBe((m + v) / 2)
  })
})

describe('bereken', () => {
  it('geeft bij onderhoud het dagverbruik, afgerond op 10', () => {
    const u = bereken(man)
    expect(u.dagverbruik).toBe(Math.round(1780 * 1.55))
    expect(u.kcal).toBe(2760)
    expect(u.begrensd).toBe(false)
  })

  it('rekent eiwit per kilo, vet als deel van de kcal en koolhydraten als rest', () => {
    const u = bereken(man)
    expect(u.eiwitG).toBe(128)
    expect(u.vetG).toBe(Math.round((2760 * 0.25) / 9))
    expect(u.koolhydratenG).toBe(Math.round((2760 - 128 * 4 - u.vetG * 9) / 4))
    expect(Math.abs(kcalUitMacros(u) - u.kcal)).toBeLessThanOrEqual(10)
  })

  it('haalt bij afvallen ongeveer 15% eraf en bij aankomen 10% erbij', () => {
    const dag = 1780 * 1.55
    expect(bereken({ ...man, doel: 'afvallen' }).kcal).toBe(Math.round((dag * 0.85) / 10) * 10)
    expect(bereken({ ...man, doel: 'aankomen' }).kcal).toBe(Math.round((dag * 1.1) / 10) * 10)
  })

  it('gaat bij afvallen nooit onder het rustverbruik', () => {
    for (const activiteit of ['zittend', 'licht', 'matig', 'actief', 'zeer_actief'] as const) {
      const u = bereken({ ...man, activiteit, doel: 'afvallen' })
      expect(u.kcal).toBeGreaterThanOrEqual(Math.round(u.rustverbruik / 10) * 10)
      expect(u.begrensd).toBe(false)
    }
  })

  it('zet koolhydraten op nul als eiwit en vet alles vullen', () => {
    const u = bereken({ gewichtKg: 120, lengteCm: 150, leeftijd: 80, geslacht: 'vrouw', activiteit: 'zittend', doel: 'afvallen', eiwitPerKg: 2.5, vetPercentage: 40 })
    expect(u.koolhydratenG).toBe(0)
    expect(u.geenRuimteKh).toBe(true)
  })
})

describe('controleerInvoer', () => {
  it('keurt een volledige invoer goed', () => {
    expect(controleerInvoer(man)).toEqual([])
  })

  it('noemt wat mist of buiten de grenzen valt', () => {
    const fouten = controleerInvoer({ gewichtKg: 20, lengteCm: 180, leeftijd: 12, eiwitPerKg: 3, vetPercentage: 25, geslacht: 'man', activiteit: 'matig' })
    expect(fouten).toHaveLength(4)
    expect(fouten.join(' ')).toMatch(/Gewicht/)
    expect(fouten.join(' ')).toMatch(/Kies een doel/)
  })

  it('weigert NaN', () => {
    expect(controleerInvoer({ ...man, gewichtKg: Number.NaN })).toHaveLength(1)
  })
})

describe('verdeling en afwijking', () => {
  it('geeft percentages die samen 100 zijn', () => {
    const v = verdeling({ eiwitG: 150, koolhydratenG: 250, vetG: 70 })
    expect(v.eiwit + v.koolhydraten + v.vet).toBe(100)
    expect(v.vet).toBe(Math.round((70 * 9 * 100) / (150 * 4 + 250 * 4 + 70 * 9)))
  })

  it('geeft nullen zonder macros', () => {
    expect(verdeling({ eiwitG: 0, koolhydratenG: 0, vetG: 0 })).toEqual({ eiwit: 0, koolhydraten: 0, vet: 0 })
  })

  it('meldt een flinke afwijking tussen kcal en macros, een kleine niet', () => {
    expect(afwijkingTekst({ kcal: 2000, eiwitG: 150, koolhydratenG: 200, vetG: 60 })).toBeNull()
    expect(afwijkingTekst({ kcal: 2000, eiwitG: 150, koolhydratenG: 400, vetG: 90 })).toMatch(/boven het dagdoel/)
    expect(afwijkingTekst({ kcal: 3000, eiwitG: 100, koolhydratenG: 200, vetG: 50 })).toMatch(/onder het dagdoel/)
  })
})

describe('leeftijdOp', () => {
  it('telt hele jaren, met de verjaardag mee', () => {
    expect(leeftijdOp('1990-10-17', '2026-10-17')).toBe(36)
    expect(leeftijdOp('1990-10-18', '2026-10-17')).toBe(35)
  })

  it('geeft null zonder of met een rare datum', () => {
    expect(leeftijdOp(null, '2026-10-17')).toBeNull()
    expect(leeftijdOp('onzin', '2026-10-17')).toBeNull()
  })
})
