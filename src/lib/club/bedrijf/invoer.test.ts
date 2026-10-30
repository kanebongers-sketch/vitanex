import { describe, expect, it } from 'vitest'
import { leesBedrijfInvoer } from './invoer'
import { bedrijfCompleet, bedrijfUitRij, ingevuldeTeksten, MAX_TEKST } from './model'

describe('leesBedrijfInvoer: gegevens', () => {
  it('normaliseert en maakt lege velden null', () => {
    // Arrange
    const body = { soort: 'gegevens', bedrijfsnaam: '  Voorbeeld  Gym B.V. ', kvk: '1234 5678', postcode: '1234ab', email: 'INFO@voorbeeld.nl', website: 'www.voorbeeld.nl', btw: '', kor: true }
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
      kor: true,
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

describe('leesBedrijfInvoer: verplicht (KvK altijd, btw tenzij KOR)', () => {
  it('weigert zonder KvK-nummer', () => {
    expect(leesBedrijfInvoer({ soort: 'gegevens', btw: '' })).toMatchObject({ ok: false, veld: 'kvk' })
    expect(leesBedrijfInvoer({ soort: 'gegevens', kor: true })).toMatchObject({ ok: false, veld: 'kvk' })
  })
  it('weigert zonder btw-nummer als de KOR niet aan staat', () => {
    expect(leesBedrijfInvoer({ soort: 'gegevens', kvk: '12345678' })).toMatchObject({ ok: false, veld: 'btw' })
    expect(leesBedrijfInvoer({ soort: 'gegevens', kvk: '12345678', kor: false })).toMatchObject({ ok: false, veld: 'btw' })
  })
  it('KOR: btw mag leeg, mag ook ingevuld', () => {
    expect(leesBedrijfInvoer({ soort: 'gegevens', kvk: '12345678', kor: true })).toMatchObject({ ok: true, waarde: { kor: true } })
    expect(leesBedrijfInvoer({ soort: 'gegevens', kvk: '12345678', kor: true, btw: 'NL000099998B57' })).toMatchObject({ ok: true })
  })
  it('KOR moet een ja of nee zijn', () => {
    expect(leesBedrijfInvoer({ soort: 'gegevens', kvk: '12345678', kor: 'ja' })).toMatchObject({ ok: false, veld: 'kor' })
  })
})

describe('bedrijfCompleet', () => {
  it('KvK altijd, btw tenzij KOR', () => {
    expect(bedrijfCompleet({ kvk: null, btw: 'NL000099998B57' }, false)).toBe(false)
    expect(bedrijfCompleet({ kvk: '12345678', btw: null }, false)).toBe(false)
    expect(bedrijfCompleet({ kvk: '12345678', btw: null }, true)).toBe(true)
    expect(bedrijfCompleet({ kvk: '12345678', btw: 'NL000099998B57' }, false)).toBe(true)
  })
  it('leest kor uit de rij, standaard nee', () => {
    expect(bedrijfUitRij({ kor: true }).kor).toBe(true)
    expect(bedrijfUitRij({ kor: 'true' }).kor).toBe(false)
    expect(bedrijfUitRij(null).kor).toBe(false)
  })
})
