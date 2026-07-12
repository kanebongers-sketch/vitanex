import { describe, expect, test } from 'vitest'
import { isToegestaanEvent, schoonMeta } from './analytics'

describe('isToegestaanEvent', () => {
  test('accepteert events uit de allowlist', () => {
    expect(isToegestaanEvent('check_in_completed')).toBe(true)
    expect(isToegestaanEvent('session_start')).toBe(true)
    expect(isToegestaanEvent('client_error')).toBe(true)
  })

  test('weigert onbekende of niet-string waarden', () => {
    expect(isToegestaanEvent('drop_table')).toBe(false)
    expect(isToegestaanEvent('')).toBe(false)
    expect(isToegestaanEvent(null)).toBe(false)
    expect(isToegestaanEvent(42)).toBe(false)
  })
})

describe('schoonMeta', () => {
  test('laat alleen bekende string-velden door en kapt ze af', () => {
    const resultaat = schoonMeta({
      kind: 'stress',
      melding: 'x'.repeat(500),
      pad: '/home',
      wachtwoord: 'geheim',
      diepte: { nested: true },
    })
    expect(resultaat).toEqual({
      kind: 'stress',
      melding: 'x'.repeat(200),
      pad: '/home',
    })
  })

  test('geeft null voor lege, ongeldige of veldloze input', () => {
    expect(schoonMeta(null)).toBeNull()
    expect(schoonMeta('tekst')).toBeNull()
    expect(schoonMeta({})).toBeNull()
    expect(schoonMeta({ onbekend: 'x' })).toBeNull()
    expect(schoonMeta({ kind: 42 })).toBeNull()
  })
})
