import { describe, it, expect } from 'vitest'
import { huidigeMijlpaal, volgendeMijlpaal, dagenTotVolgende } from './mijlpaal'

describe('huidigeMijlpaal', () => {
  it('viert exact op een drempel', () => {
    expect(huidigeMijlpaal(7)?.dagen).toBe(7)
    expect(huidigeMijlpaal(30)?.titel).toContain('maand')
  })
  it('is null tussen drempels', () => {
    expect(huidigeMijlpaal(5)).toBeNull()
    expect(huidigeMijlpaal(0)).toBeNull()
  })
})

describe('volgendeMijlpaal + dagenTotVolgende', () => {
  it('wijst naar de eerstvolgende drempel', () => {
    expect(volgendeMijlpaal(0)?.dagen).toBe(3)
    expect(volgendeMijlpaal(5)?.dagen).toBe(7)
    expect(dagenTotVolgende(5)).toBe(2)
    expect(dagenTotVolgende(7)).toBe(7) // volgende is 14
  })
  it('is null voorbij de laatste mijlpaal', () => {
    expect(volgendeMijlpaal(100)).toBeNull()
    expect(dagenTotVolgende(150)).toBeNull()
  })
})
