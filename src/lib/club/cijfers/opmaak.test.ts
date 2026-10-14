import { describe, expect, it } from 'vitest'
import { aantal, eenDecimaal, heel, metTeken, mooieAs, mooiMaximum, procent } from './opmaak'

describe('opmaak', () => {
  it('schrijft getallen en procenten op zijn Nederlands', () => {
    expect(heel(1234.4)).toBe('1.234')
    expect(eenDecimaal(2.25)).toMatch(/^2,[23]$/)
    expect(procent(0.734)).toBe('73%')
    expect(procent(null)).toBe('geen data')
  })

  it('zet een teken voor groei', () => {
    expect(metTeken(3)).toBe('+3')
    expect(metTeken(-2)).toBe('−2')
    expect(metTeken(0)).toBe('0')
  })

  it('kiest een mooie bovengrens voor een as', () => {
    expect(mooiMaximum(0)).toBe(1)
    expect(mooiMaximum(7)).toBe(10)
    expect(mooiMaximum(180)).toBe(200)
    expect(mooiMaximum(230)).toBe(250)
    expect(mooiMaximum(1000)).toBe(1000)
  })

  it('kent enkelvoud en meervoud', () => {
    expect(aantal(1, 'lid', 'leden')).toBe('1 lid')
    expect(aantal(0, 'lid', 'leden')).toBe('0 leden')
    expect(aantal(1200, 'lid', 'leden')).toBe('1.200 leden')
  })

  it('maakt een as met ronde streepjes rond de waarden', () => {
    expect(mooieAs(210, 222)).toEqual({ min: 200, max: 230, streepjes: [200, 210, 220, 230] })
    const a = mooieAs(0, 7)
    expect(a.min).toBe(0)
    expect(a.max).toBeGreaterThanOrEqual(7)
    expect(a.streepjes[0]).toBe(0)
    expect(mooieAs(0, 0)).toEqual({ min: 0, max: 1, streepjes: [0, 1] })
    const b = mooieAs(5, 5)
    expect(b.min).toBeLessThanOrEqual(5)
    expect(b.max).toBeGreaterThan(5)
  })
})
