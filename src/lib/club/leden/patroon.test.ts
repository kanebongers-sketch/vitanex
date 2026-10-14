import { describe, expect, it } from 'vitest'
import { asSchaal, perWeekdag, weekBalken } from './patroon'

const NU = new Date('2026-10-14T12:00:00+02:00') // woensdag

function op(...dagenGeleden: number[]): Date[] {
  return dagenGeleden.map((d) => new Date(NU.getTime() - d * 86_400_000))
}

describe('weekBalken', () => {
  it('maakt 12 blokken van 7 dagen, het laatste eindigt vandaag', () => {
    const balken = weekBalken(op(0, 6, 7, 83, 84), NU)
    expect(balken).toHaveLength(12)
    expect(balken[11]).toMatchObject({ aantal: 2, huidig: true })
    expect(balken[10].aantal).toBe(1)
    expect(balken[0].aantal).toBe(1)
    expect(balken.reduce((s, b) => s + b.aantal, 0)).toBe(4)
  })

  it('telt twee check-ins op een dag als een bezoek', () => {
    const balken = weekBalken([...op(1), ...op(1)], NU)
    expect(balken[11].aantal).toBe(1)
  })

  it('zet de eerste dag van het blok als label', () => {
    expect(weekBalken([], NU)[11].label).toMatch(/^8 okt/)
  })
})

describe('perWeekdag', () => {
  it('telt per weekdag met maandag eerst', () => {
    // 0 = woensdag, 2 = maandag, 3 = zondag
    expect(perWeekdag(op(0, 2, 3, 7), NU)).toEqual([1, 0, 2, 0, 0, 0, 1])
  })
})

describe('asSchaal', () => {
  it('is minstens 3 hoog met stappen van 1', () => {
    expect(asSchaal(0)).toEqual({ top: 3, ticks: [0, 1, 2, 3] })
    expect(asSchaal(4)).toEqual({ top: 4, ticks: [0, 1, 2, 3, 4] })
  })

  it('neemt stappen van 2 boven de 4 en rondt naar boven af', () => {
    expect(asSchaal(5)).toEqual({ top: 6, ticks: [0, 2, 4, 6] })
    expect(asSchaal(7)).toEqual({ top: 8, ticks: [0, 2, 4, 6, 8] })
  })
})
