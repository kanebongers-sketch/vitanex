import { describe, it, expect } from 'vitest'
import { HUISHOUDMATEN, gramVoor } from './huishoudmaten'

describe('gramVoor', () => {
  it('rekent een aantal maal het maatgewicht', () => {
    expect(gramVoor('snee', 2)).toBe(70) // 2 × 35
    expect(gramVoor('glas', 1)).toBe(250)
  })

  it('valt terug op 1 bij een ongeldig aantal', () => {
    expect(gramVoor('stuk', 0)).toBe(100)
    expect(gramVoor('stuk', -3)).toBe(100)
    expect(gramVoor('stuk', NaN)).toBe(100)
  })

  it('rondt af op hele grammen', () => {
    expect(gramVoor('theelepel', 3)).toBe(15)
  })

  it('geeft null bij een onbekende maat', () => {
    expect(gramVoor('emmer', 1)).toBeNull()
  })

  it('heeft alleen positieve maatgewichten', () => {
    for (const m of HUISHOUDMATEN) expect(m.gram).toBeGreaterThan(0)
  })
})
