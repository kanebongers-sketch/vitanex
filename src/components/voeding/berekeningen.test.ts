import { describe, it, expect } from 'vitest'
import { berekenDagTotaal, schaalNaarPortie, waterDoelInGlazen } from './berekeningen'
import type { VoedingLog } from './types'

// De rekenkern van de voedingsapp: een fout hier laat Kane's calorie-/macrocijfers
// liegen. Daarom de randgevallen: ontbrekende (null) waarden, en de afronding die
// exact moet matchen met wat er in de log wordt weggeschreven.

function log(over: Partial<VoedingLog>): VoedingLog {
  return {
    id: 'x', datum: '2026-08-07', maaltijd_type: 'lunch', omschrijving: '',
    calorieen: null, eiwitten_g: null, koolhydraten_g: null, vetten_g: null,
    vezels_g: null, portie_gram: null, bron: 'manueel', foto_url: null, ai_analyse: null,
    ...over,
  }
}

describe('berekenDagTotaal', () => {
  it('is nul voor een lege dag', () => {
    expect(berekenDagTotaal([])).toEqual({ calorieen: 0, eiwitten_g: 0, koolhydraten_g: 0, vetten_g: 0, vezels_g: 0 })
  })

  it('telt macro\'s op en behandelt null als 0', () => {
    const t = berekenDagTotaal([
      log({ calorieen: 500, eiwitten_g: 30, koolhydraten_g: 50, vetten_g: 20, vezels_g: 5 }),
      log({ calorieen: 300, eiwitten_g: 10 }), // rest null → telt als 0
    ])
    expect(t).toEqual({ calorieen: 800, eiwitten_g: 40, koolhydraten_g: 50, vetten_g: 20, vezels_g: 5 })
  })
})

describe('schaalNaarPortie', () => {
  const per100 = { calorieen: 250, eiwitten_g: 12.4, koolhydraten_g: 30.2, vetten_g: 8.6, vezels_g: 3.1 }

  it('laat 100 g ongemoeid (afgerond)', () => {
    expect(schaalNaarPortie(per100, 100)).toEqual({ calorieen: 250, eiwitten_g: 12.4, koolhydraten_g: 30.2, vetten_g: 8.6, vezels_g: 3.1 })
  })

  it('schaalt naar een halve portie met kcal heel en macro\'s op 1 decimaal', () => {
    const s = schaalNaarPortie(per100, 50)
    expect(s.calorieen).toBe(125)
    expect(s.eiwitten_g).toBe(6.2)
    expect(s.koolhydraten_g).toBe(15.1)
    expect(s.vetten_g).toBe(4.3)
  })

  it('rekent 150 g correct op', () => {
    const s = schaalNaarPortie({ calorieen: 100, eiwitten_g: 10, koolhydraten_g: 0, vetten_g: 0, vezels_g: 0 }, 150)
    expect(s.calorieen).toBe(150)
    expect(s.eiwitten_g).toBe(15)
  })
})

describe('waterDoelInGlazen', () => {
  it('rekent milliliters om naar glazen', () => {
    expect(waterDoelInGlazen(2000)).toBe(8) // 2000/250
    expect(waterDoelInGlazen(2500)).toBe(10)
  })
  it('houdt een ondergrens van 4 glazen aan', () => {
    expect(waterDoelInGlazen(500)).toBe(4)
  })
})
