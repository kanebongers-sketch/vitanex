import { describe, expect, it } from 'vitest'
import { controleerOpeningstijden, openingstijdenNaarJson, openingstijdenUitJson, ruimsteOpening } from './openingstijden'

const DEMO = { '1': ['06:00', '23:00'], '5': ['06:00', '22:00'], '6': ['08:00', '17:00'] }

describe('openingstijden', () => {
  it('leest de jsonb, ontbrekende dagen zijn gesloten', () => {
    const o = openingstijdenUitJson(DEMO)
    expect(o[0]).toEqual({ van: '06:00', tot: '23:00' })
    expect(o[1]).toBeNull()
    expect(openingstijdenUitJson('onzin').every((d) => d === null)).toBe(true)
  })

  it('schrijft terug naar dezelfde vorm', () => {
    expect(openingstijdenNaarJson(openingstijdenUitJson(DEMO))).toEqual(DEMO)
  })

  it('controleert formulierinvoer', () => {
    const goed = [{ van: '06:00', tot: '23:00' }, null, null, null, null, null, { van: '08:00', tot: '16:00' }]
    expect(controleerOpeningstijden(goed).ok).toBe(true)
    const fout = controleerOpeningstijden([{ van: '10:00', tot: '09:00' }, null, null, null, null, null, null])
    expect(fout).toEqual({ ok: false, fout: 'Maandag: sluiten moet na openen.' })
    expect(controleerOpeningstijden([]).ok).toBe(false)
  })

  it('vindt de ruimste opening van de week', () => {
    expect(ruimsteOpening(openingstijdenUitJson(DEMO))).toEqual({ van: '06:00', tot: '23:00' })
    expect(ruimsteOpening(openingstijdenUitJson({}))).toBeNull()
  })
})
