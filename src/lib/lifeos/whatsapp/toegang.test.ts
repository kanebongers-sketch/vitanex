import { describe, it, expect } from 'vitest'
import { beoordeelAfzender } from './toegang'

// De allowlist is het slot dat bewijst "dit komt van Kane". De Meta-handtekening
// bewijst alleen "dit komt van WhatsApp". Deze tests bewaken vooral één ding: dat
// een ontbrekende allowlist NIET stilletjes iedereen doorlaat.

describe('beoordeelAfzender — fail-closed', () => {
  it('weigert als er geen allowlist is (undefined)', () => {
    // Arrange / Act / Assert
    expect(beoordeelAfzender('31612345678', undefined)).toEqual({ soort: 'geweigerd' })
  })

  it('weigert bij een lege allowlist', () => {
    expect(beoordeelAfzender('31612345678', '')).toEqual({ soort: 'geweigerd' })
  })

  it('weigert bij een allowlist van alleen witruimte en komma\'s', () => {
    expect(beoordeelAfzender('31612345678', '  ,  , ')).toEqual({ soort: 'geweigerd' })
  })

  it('weigert een from zonder cijfers', () => {
    expect(beoordeelAfzender('geen-nummer', '31612345678')).toEqual({ soort: 'geweigerd' })
  })
})

describe('beoordeelAfzender — normalisatie', () => {
  it('matcht ondanks + en spaties aan de from-kant', () => {
    // Arrange
    const from = '+31 6 12345678'
    const allowlist = '31612345678'
    // Act
    const besluit = beoordeelAfzender(from, allowlist)
    // Assert
    expect(besluit).toEqual({ soort: 'toegestaan' })
  })

  it('matcht ondanks + en spaties/streepjes aan de allowlist-kant', () => {
    // Arrange: beide kanten "vies", maar dezelfde cijfers.
    const from = '+31612345678'
    const allowlist = '+31 6-12345678'
    // Act
    const besluit = beoordeelAfzender(from, allowlist)
    // Assert
    expect(besluit).toEqual({ soort: 'toegestaan' })
  })

  it('weigert een nummer dat niet op de lijst staat', () => {
    expect(beoordeelAfzender('+31 6 99999999', '31612345678')).toEqual({ soort: 'geweigerd' })
  })

  it('matcht op het hele nummer, niet op een prefix', () => {
    // 316 mag niet meeliften op 31612345678 — anders opent een prefix de deur.
    expect(beoordeelAfzender('316', '31612345678')).toEqual({ soort: 'geweigerd' })
  })
})

describe('beoordeelAfzender — meerdere nummers', () => {
  it('laat elk nummer op een komma-gescheiden lijst door', () => {
    // Arrange: drie nummers, elk met andere opmaak dan hun from-tegenhanger.
    const allowlist = '+31 6 12345678, +31 6 87654321 , 3120 1234567'
    // Act / Assert
    expect(beoordeelAfzender('+31612345678', allowlist)).toEqual({ soort: 'toegestaan' })
    expect(beoordeelAfzender('31687654321', allowlist)).toEqual({ soort: 'toegestaan' })
    expect(beoordeelAfzender('+31 20 1234567', allowlist)).toEqual({ soort: 'toegestaan' })
  })

  it('weigert een nummer dat op geen enkel item matcht', () => {
    const allowlist = '31612345678, 31687654321'
    expect(beoordeelAfzender('31600000000', allowlist)).toEqual({ soort: 'geweigerd' })
  })
})
