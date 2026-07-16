import { describe, it, expect } from 'vitest'
import { KoppelFout, leesTokenAntwoord } from './oauth'
import { isVerlopen } from './koppelingen'

describe('leesTokenAntwoord', () => {
  it('leest een normaal OAuth2-antwoord', () => {
    // Arrange — de vorm die WHOOP en Oura beide teruggeven.
    const ruw = {
      access_token: 'at_123',
      refresh_token: 'rt_456',
      expires_in: 3600,
      token_type: 'bearer',
      scope: 'read:recovery read:sleep offline',
    }

    // Act
    const t = leesTokenAntwoord('whoop', ruw)

    // Assert
    expect(t.toegangstoken).toBe('at_123')
    expect(t.verversingstoken).toBe('rt_456')
    expect(t.bereik).toEqual(['read:recovery', 'read:sleep', 'offline'])
    expect(t.verlooptOp).not.toBeNull()
  })

  it('rekent expires_in om naar een tijdstip in de toekomst', () => {
    // Act
    const t = leesTokenAntwoord('oura', { access_token: 'at', expires_in: 3600 })

    // Assert — ruwweg een uur vooruit; we testen de richting, niet de ms.
    const over = new Date(t.verlooptOp ?? 0).getTime() - Date.now()
    expect(over).toBeGreaterThan(3_500_000)
    expect(over).toBeLessThan(3_700_000)
  })

  it('gooit als er geen toegangstoken in zit', () => {
    // Arrange — een 200 met een nutteloze body is nog steeds een mislukking.
    // Die stil accepteren zou een kapotte koppeling opleveren die "gelukt" heet.
    expect(() => leesTokenAntwoord('whoop', { token_type: 'bearer' })).toThrow(KoppelFout)
    expect(() => leesTokenAntwoord('whoop', null)).toThrow(KoppelFout)
    expect(() => leesTokenAntwoord('whoop', 'geen json')).toThrow(KoppelFout)
  })

  it('accepteert een antwoord zonder refresh token, maar onthoudt dat', () => {
    // Arrange — zonder `offline`-scope geeft WHOOP er geen.
    const t = leesTokenAntwoord('whoop', { access_token: 'at' })

    // Assert — null, geen lege string: "we hebben er geen" is iets anders dan ''.
    expect(t.verversingstoken).toBeNull()
    expect(t.verlooptOp).toBeNull()
    expect(t.bereik).toEqual([])
  })

  it('leest scope ook als de dienst een array stuurt i.p.v. een string', () => {
    const t = leesTokenAntwoord('oura', { access_token: 'at', scope: ['daily', 'personal'] })
    expect(t.bereik).toEqual(['daily', 'personal'])
  })
})

describe('isVerlopen', () => {
  const NU = new Date('2026-07-15T12:00:00Z').getTime()

  it('noemt een token dat over een uur verloopt niet verlopen', () => {
    expect(isVerlopen('2026-07-15T13:00:00Z', NU)).toBe(false)
  })

  it('noemt een verlopen token verlopen', () => {
    expect(isVerlopen('2026-07-15T11:00:00Z', NU)).toBe(true)
  })

  it('ververst alvast bij een token dat binnen de marge verloopt', () => {
    // Arrange — over 30 seconden. Technisch nog geldig, praktisch dood: de
    // API-call erna is zo verlopen.
    expect(isVerlopen('2026-07-15T12:00:30Z', NU)).toBe(true)
  })

  it('behandelt een onbekende vervaltijd als geldig', () => {
    // Arrange — de dienst gaf geen expires_in. Dan is verlopen-zijn niet
    // vast te stellen; een 401 verderop lost het alsnog op.
    expect(isVerlopen(null, NU)).toBe(false)
    expect(isVerlopen('geen datum', NU)).toBe(false)
  })
})
