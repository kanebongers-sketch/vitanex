import { describe, expect, test } from 'vitest'
import { hashPin, pinKlopt, nieuwSessieToken, tokenHash, sessieCookieNaam } from './pin'

describe('pincode', () => {
  test('goede pin klopt, foute niet, hash bevat de pin niet', () => {
    const h = hashPin('482915')
    expect(h).not.toContain('482915')
    expect(pinKlopt('482915', h)).toBe(true)
    expect(pinKlopt('482916', h)).toBe(false)
    expect(pinKlopt('482915', null)).toBe(false)
    expect(pinKlopt('482915', 'kapot')).toBe(false)
  })
  test('twee keer dezelfde pin → andere hash (eigen salt)', () => {
    expect(hashPin('111111')).not.toBe(hashPin('111111'))
  })
  test('sessietoken: willekeurig, hash is stabiel', () => {
    const t = nieuwSessieToken()
    expect(t).not.toBe(nieuwSessieToken())
    expect(tokenHash(t)).toBe(tokenHash(t))
    expect(sessieCookieNaam('joey-2')).toBe('mf_lead_joey_2')
  })
})
