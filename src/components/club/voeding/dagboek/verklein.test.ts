import { describe, expect, it } from 'vitest'
import { MAX_ZIJDE, verkleinMaat } from './verklein'

describe('verkleinMaat', () => {
  it('brengt de langste zijde naar 1024 px en houdt de verhouding', () => {
    expect(verkleinMaat(4032, 3024)).toEqual({ breedte: MAX_ZIJDE, hoogte: 768 })
    expect(verkleinMaat(3024, 4032)).toEqual({ breedte: 768, hoogte: MAX_ZIJDE })
  })

  it('maakt een kleine foto nooit groter', () => {
    expect(verkleinMaat(800, 600)).toEqual({ breedte: 800, hoogte: 600 })
  })

  it('geeft 0 bij een onleesbare maat', () => {
    expect(verkleinMaat(0, 100)).toEqual({ breedte: 0, hoogte: 0 })
    expect(verkleinMaat(Number.NaN, 100)).toEqual({ breedte: 0, hoogte: 0 })
  })
})
