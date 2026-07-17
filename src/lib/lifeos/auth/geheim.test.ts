import { describe, expect, it } from 'vitest'
import { geheimGelijk } from '@/lib/lifeos/auth/geheim'

describe('geheimGelijk', () => {
  it('herkent een exact gelijk geheim', () => {
    expect(geheimGelijk('super-geheim-token', 'super-geheim-token')).toBe(true)
  })

  it('wijst een verkeerd geheim af', () => {
    expect(geheimGelijk('super-geheim-token', 'iets-anders')).toBe(false)
  })

  // Fail-closed: een niet-geconfigureerd slot hoort dicht te zijn. Zonder deze
  // regel zou een lege env-var een route openzetten voor iedereen die óók niets
  // meestuurt.
  it('is fail-closed bij een leeg verwacht geheim', () => {
    expect(geheimGelijk('', '')).toBe(false)
    expect(geheimGelijk('', 'wat-dan-ook')).toBe(false)
  })

  it('wijst een ontbrekende (null) invoer af', () => {
    expect(geheimGelijk('super-geheim-token', null)).toBe(false)
  })

  it('wijst een lege invoer af tegen een echt geheim', () => {
    expect(geheimGelijk('super-geheim-token', '')).toBe(false)
  })

  // De hash naar 32 vaste bytes betekent dat een langere gok geen fout gooit
  // (timingSafeEqual eist gelijke lengtes) maar netjes false teruggeeft.
  it('gooit niet bij ongelijke lengtes, maar geeft false', () => {
    expect(geheimGelijk('kort', 'een-veel-langer-geheim-dan-verwacht')).toBe(false)
  })

  it('is gevoelig voor één afwijkend teken', () => {
    expect(geheimGelijk('token-abc', 'token-abd')).toBe(false)
  })
})
