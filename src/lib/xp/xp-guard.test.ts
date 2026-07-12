import { describe, expect, test } from 'vitest'
import { isVerdachteXpSprong, MAX_XP_DELTA_PER_SYNC } from './xp-guard'

describe('isVerdachteXpSprong', () => {
  test('staat de allereerste sync toe, ook met veel opgebouwde localStorage-XP', () => {
    expect(isVerdachteXpSprong(null, 12_500)).toBe(false)
  })

  test('staat een normale dagelijkse toename toe', () => {
    expect(isVerdachteXpSprong(500, 575)).toBe(false)
    expect(isVerdachteXpSprong(500, 500)).toBe(false)
  })

  test('staat een sprong van exact het maximum toe (grensgeval)', () => {
    expect(isVerdachteXpSprong(500, 500 + MAX_XP_DELTA_PER_SYNC)).toBe(false)
  })

  test('weigert een sprong groter dan het maximum', () => {
    expect(isVerdachteXpSprong(500, 501 + MAX_XP_DELTA_PER_SYNC)).toBe(true)
    expect(isVerdachteXpSprong(0, 999_999)).toBe(true)
  })

  test('staat een daling toe (server-truth kan hoger liggen dan de client)', () => {
    expect(isVerdachteXpSprong(2000, 100)).toBe(false)
  })
})
