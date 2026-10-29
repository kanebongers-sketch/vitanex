import { describe, expect, it } from 'vitest'
import { leesTempoCurve, tempoNotatie } from './tempo-curve'

describe('leesTempoCurve', () => {
  it('leest vier cijfers als omlaag, onder, omhoog en boven', () => {
    const c = leesTempoCurve('3110')
    expect(c?.delen.map((d) => [d.fase, d.sec])).toEqual([['omlaag', 3], ['onder', 1], ['omhoog', 1], ['boven', 0]])
    expect(c?.totaal).toBe(5)
  })

  it('maakt een curve van boven naar onder en terug', () => {
    const c = leesTempoCurve('2020')
    expect(c?.punten).toEqual([{ x: 0, y: 0 }, { x: 0.5, y: 1 }, { x: 1, y: 0 }])
  })

  it('leest X als explosief en geeft de beweging altijd breedte', () => {
    const c = leesTempoCurve('31X0')
    expect(c?.delen[2]).toEqual({ fase: 'omhoog', teken: 'X', sec: 0.6 })
    expect(c?.punten.at(-1)).toEqual({ x: 1, y: 0 })
  })

  it('accepteert streepjes en spaties', () => {
    expect(tempoNotatie(leesTempoCurve('3-1-1-0')!)).toBe('3 1 1 0')
  })

  it('geeft null bij leeg of onleesbaar', () => {
    expect(leesTempoCurve('')).toBeNull()
    expect(leesTempoCurve(null)).toBeNull()
    expect(leesTempoCurve('31')).toBeNull()
    expect(leesTempoCurve('0000')).toBeNull()
  })
})
