import { describe, expect, test } from 'vitest'
import { isRateLimited } from './rate-limit'

describe('isRateLimited', () => {
  test('staat aanroepen toe tot het maximum en blokkeert daarna', () => {
    const sleutel = `test-max-${Math.random()}`
    const nu = 1_000_000

    expect(isRateLimited(sleutel, 3, 60_000, nu)).toBe(false)
    expect(isRateLimited(sleutel, 3, 60_000, nu + 1)).toBe(false)
    expect(isRateLimited(sleutel, 3, 60_000, nu + 2)).toBe(false)
    expect(isRateLimited(sleutel, 3, 60_000, nu + 3)).toBe(true)
  })

  test('laat weer door zodra het venster is verstreken', () => {
    const sleutel = `test-venster-${Math.random()}`
    const nu = 2_000_000

    expect(isRateLimited(sleutel, 1, 60_000, nu)).toBe(false)
    expect(isRateLimited(sleutel, 1, 60_000, nu + 30_000)).toBe(true)
    expect(isRateLimited(sleutel, 1, 60_000, nu + 61_000)).toBe(false)
  })

  test('houdt sleutels gescheiden', () => {
    const nu = 3_000_000
    expect(isRateLimited(`a-${nu}`, 1, 60_000, nu)).toBe(false)
    expect(isRateLimited(`b-${nu}`, 1, 60_000, nu)).toBe(false)
  })
})
