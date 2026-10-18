import { describe, expect, it } from 'vitest'
import { begin, kanOngedaan, kanOpnieuw, MAX_STAPPEN, ongedaan, opnieuw, zet } from './geschiedenis'

describe('geschiedenis', () => {
  it('maakt ongedaan en opnieuw', () => {
    let g = zet(zet(begin(1), 2), 3)
    g = ongedaan(g)
    expect(g.heden).toBe(2)
    expect(kanOpnieuw(g)).toBe(true)
    g = opnieuw(g)
    expect(g.heden).toBe(3)
    expect(ongedaan(ongedaan(ongedaan(ongedaan(g)))).heden).toBe(1)
  })

  it('voegt typen in hetzelfde veld samen tot een stap', () => {
    let g = begin('')
    g = zet(g, 'a', 'veld:x')
    g = zet(g, 'ab', 'veld:x')
    g = zet(g, 'abc', 'veld:x')
    expect(ongedaan(g).heden).toBe('')
    g = zet(g, 'abcd', 'veld:y')
    expect(ongedaan(g).heden).toBe('abc')
  })

  it('wist de toekomst na een nieuwe wijziging en negeert gelijke staat', () => {
    let g = ongedaan(zet(begin(1), 2))
    g = zet(g, 5)
    expect(kanOpnieuw(g)).toBe(false)
    expect(zet(g, 5)).toBe(g)
    expect(kanOngedaan(begin(0))).toBe(false)
  })

  it('bewaart maximaal een vast aantal stappen', () => {
    let g = begin(0)
    for (let i = 1; i <= MAX_STAPPEN + 20; i++) g = zet(g, i)
    expect(g.verleden).toHaveLength(MAX_STAPPEN)
  })
})
