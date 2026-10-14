import { describe, expect, it } from 'vitest'
import { eenDecimaal, heel, metTeken, mooiMaximum, procent } from './opmaak'

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
})
