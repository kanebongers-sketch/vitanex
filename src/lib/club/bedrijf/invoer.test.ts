import { describe, expect, it } from 'vitest'
import { leesBedrijfInvoer } from './invoer'
import { bedrijfUitRij, ingevuldeTeksten, MAX_TEKST } from './model'

describe('leesBedrijfInvoer: gegevens', () => {
  it('normaliseert en maakt lege velden null', () => {
    // Arrange
    const body = { soort: 'gegevens', bedrijfsnaam: '  Voorbeeld  Gym B.V. ', kvk: '1234 5678', postcode: '1234ab', email: 'INFO@voorbeeld.nl', website: 'www.voorbeeld.nl', btw: '' }
    // Act
    const u = leesBedrijfInvoer(body)
    // Assert
    expect(u.ok && u.waarde).toEqual({
      soort: 'gegevens',
      gegevens: expect.objectContaining({
        bedrijfsnaam: 'Voorbeeld Gym B.V.',
        kvk: '12345678',
        postcode: '1234 AB',
        email: 'info@voorbeeld.nl',
        website: 'https://www.voorbeeld.nl/',
        btw: null,
        instagram: null,
      }),
    })
  })

  it('noemt het veld dat niet klopt', () => {
    expect(leesBedrijfInvoer({ soort: 'gegevens', kvk: '123' })).toMatchObject({ ok: false, veld: 'kvk' })
    expect(leesBedrijfInvoer({ soort: 'gegevens', btw: 'NL123456789B01' })).toMatchObject({ ok: false, veld: 'btw' })
    expect(leesBedrijfInvoer({ soort: 'gegevens', facebook: 'https://evil.nl/facebook.com' })).toMatchObject({ ok: false, veld: 'facebook' })
    expect(leesBedrijfInvoer({ soort: 'gegevens', bedrijfsnaam: 'x'.repeat(161) })).toMatchObject({ ok: false, veld: 'bedrijfsnaam' })
    expect(leesBedrijfInvoer({ soort: 'gegevens', plaats: 42 })).toMatchObject({ ok: false, veld: 'plaats' })
  })
})

describe('leesBedrijfInvoer: teksten', () => {
  it('bewaart opgeschoonde teksten en maakt lege teksten null', () => {
    const u = leesBedrijfInvoer({ soort: 'teksten', huisregels: '# Kop\r\n- punt  ', voorwaarden: '   ', privacy: undefined })
    expect(u.ok && u.waarde).toEqual({ soort: 'teksten', teksten: { huisregels: '# Kop\n- punt', voorwaarden: null, privacy: null } })
  })

  it('weigert een tekst boven de grens, maar accepteert precies de grens', () => {
    expect(leesBedrijfInvoer({ soort: 'teksten', privacy: 'a'.repeat(MAX_TEKST + 1) })).toMatchObject({ ok: false, veld: 'privacy' })
    expect(leesBedrijfInvoer({ soort: 'teksten', privacy: 'a'.repeat(MAX_TEKST) })).toMatchObject({ ok: true })
  })

  it('weigert iets dat geen tekst is', () => {
    expect(leesBedrijfInvoer({ soort: 'teksten', huisregels: ['a'] })).toMatchObject({ ok: false, veld: 'huisregels' })
  })
})

describe('leesBedrijfInvoer: vorm', () => {
  it('weigert onleesbare invoer en een onbekend onderdeel', () => {
    expect(leesBedrijfInvoer(null)).toMatchObject({ ok: false })
    expect(leesBedrijfInvoer([])).toMatchObject({ ok: false })
    expect(leesBedrijfInvoer({ soort: 'alles' })).toMatchObject({ ok: false })
  })
})

describe('bedrijfUitRij en ingevuldeTeksten', () => {
  it('geeft een leeg bedrijf zonder rij en alleen ingevulde teksten in vaste volgorde', () => {
    expect(bedrijfUitRij(null).gegevens.kvk).toBeNull()
    const b = bedrijfUitRij({ kvk: '12345678', privacy: 'P', huisregels: 'H', voorwaarden: ' ', onbekend: 'x' })
    expect(b.gegevens.kvk).toBe('12345678')
    expect(ingevuldeTeksten(b.teksten)).toEqual([
      { soort: 'huisregels', tekst: 'H' },
      { soort: 'privacy', tekst: 'P' },
    ])
  })
})
