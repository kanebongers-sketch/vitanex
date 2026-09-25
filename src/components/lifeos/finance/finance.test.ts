import { describe, expect, test } from 'vitest'
import { parseBedrag } from './finance'

describe('parseBedrag — Nederlandse invoer', () => {
  test('komma als decimaal, punten als duizendtallen', () => {
    expect(parseBedrag('12,50')).toBe(12.5)
    expect(parseBedrag('1.234,56')).toBe(1234.56)
  })

  test('zonder komma: "1.250" is 1250, "12.50" is 12,50', () => {
    expect(parseBedrag('1.250')).toBe(1250)
    expect(parseBedrag('12.500.000')).toBe(12500000)
    expect(parseBedrag('12.50')).toBe(12.5)
    expect(parseBedrag('1234.5')).toBe(1234.5)
  })

  test('euroteken en spaties mogen', () => {
    expect(parseBedrag('€ 12,50')).toBe(12.5)
    expect(parseBedrag(' 1 250 ')).toBe(1250)
  })

  test('0, negatief of onzin → null', () => {
    expect(parseBedrag('')).toBeNull()
    expect(parseBedrag('0')).toBeNull()
    expect(parseBedrag('-5')).toBeNull()
    expect(parseBedrag('abc')).toBeNull()
  })
})
