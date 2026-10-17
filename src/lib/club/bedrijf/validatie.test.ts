import { describe, expect, it } from 'vitest'
import {
  isEmail,
  isTelefoon,
  normaliseerBtw,
  normaliseerKvk,
  normaliseerPostcode,
  normaliseerSocial,
  normaliseerTekst,
  normaliseerWebsite,
} from './validatie'

describe('normaliseerKvk', () => {
  it('accepteert 8 cijfers, ook met spaties of punten', () => {
    expect(normaliseerKvk('12345678')).toBe('12345678')
    expect(normaliseerKvk('1234 5678')).toBe('12345678')
    expect(normaliseerKvk('12.34.56.78')).toBe('12345678')
  })

  it('weigert te kort, te lang, letters en alleen nullen', () => {
    expect(normaliseerKvk('1234567')).toBeNull()
    expect(normaliseerKvk('123456789')).toBeNull()
    expect(normaliseerKvk('1234567a')).toBeNull()
    expect(normaliseerKvk('00000000')).toBeNull()
  })
})

describe('normaliseerBtw', () => {
  it('accepteert een btw-id dat de mod-97-controle haalt', () => {
    // Arrange: het voorbeeldnummer van de Belastingdienst.
    const invoer = 'nl 0000.99998 b57'
    // Act
    const uit = normaliseerBtw(invoer)
    // Assert
    expect(uit).toBe('NL000099998B57')
  })

  it('accepteert een oud nummer dat de elfproef haalt', () => {
    expect(normaliseerBtw('NL123456782B01')).toBe('NL123456782B01')
  })

  it('weigert een fout controlegetal, een verkeerde vorm of volgnummer 00', () => {
    expect(normaliseerBtw('NL123456789B01')).toBeNull()
    expect(normaliseerBtw('BE0123456789')).toBeNull()
    expect(normaliseerBtw('NL12345678B01')).toBeNull()
    expect(normaliseerBtw('NL123456782B00')).toBeNull()
  })
})

describe('normaliseerPostcode', () => {
  it('maakt er 1234 AB van', () => {
    expect(normaliseerPostcode('6021ca')).toBe('6021 CA')
    expect(normaliseerPostcode(' 6021 CA ')).toBe('6021 CA')
  })

  it('weigert een postcode die met 0 begint of verkeerd is', () => {
    expect(normaliseerPostcode('0123 AB')).toBeNull()
    expect(normaliseerPostcode('12345')).toBeNull()
  })
})

describe('contact', () => {
  it('controleert e-mail en telefoon', () => {
    expect(isEmail('info@voorbeeld.nl')).toBe(true)
    expect(isEmail('info@voorbeeld')).toBe(false)
    expect(isTelefoon('085-060 3424')).toBe(true)
    expect(isTelefoon('+31 6 12345678')).toBe(true)
    expect(isTelefoon('bel ons')).toBe(false)
    expect(isTelefoon('123')).toBe(false)
  })
})

describe('normaliseerWebsite', () => {
  it('zet https:// ervoor als het schema ontbreekt', () => {
    expect(normaliseerWebsite('www.fitfactory.nl')).toBe('https://www.fitfactory.nl/')
  })

  it('weigert http, javascript, gebruikersnamen en adressen zonder domein', () => {
    expect(normaliseerWebsite('http://www.voorbeeld.nl')).toBeNull()
    expect(normaliseerWebsite('javascript:alert(1)')).toBeNull()
    expect(normaliseerWebsite('https://iemand@voorbeeld.nl')).toBeNull()
    expect(normaliseerWebsite('https://localhost')).toBeNull()
    expect(normaliseerWebsite('https://voorbeeld.nl:8080')).toBeNull()
  })
})

describe('normaliseerSocial', () => {
  it('accepteert alleen het eigen domein van het netwerk, met of zonder www', () => {
    expect(normaliseerSocial('instagram', 'https://www.instagram.com/voorbeeldgym')).toBe('https://www.instagram.com/voorbeeldgym')
    expect(normaliseerSocial('instagram', 'instagram.com/voorbeeldgym')).toBe('https://instagram.com/voorbeeldgym')
    expect(normaliseerSocial('linkedin', 'https://nl.linkedin.com/company/voorbeeld')).toBe('https://nl.linkedin.com/company/voorbeeld')
  })

  it('weigert een ander of nagemaakt domein, http en een kale startpagina', () => {
    expect(normaliseerSocial('facebook', 'https://www.instagram.com/voorbeeldgym')).toBeNull()
    expect(normaliseerSocial('facebook', 'https://facebook.com.evil.nl/voorbeeld')).toBeNull()
    expect(normaliseerSocial('facebook', 'https://notfacebook.com/voorbeeld')).toBeNull()
    expect(normaliseerSocial('tiktok', 'http://www.tiktok.com/@voorbeeld')).toBeNull()
    expect(normaliseerSocial('tiktok', 'https://www.tiktok.com/')).toBeNull()
  })
})

describe('normaliseerTekst', () => {
  it('maakt regeleinden gelijk, haalt stuurtekens en spaties aan het eind weg', () => {
    expect(normaliseerTekst('# Kop  \r\nRegel\u0007\r\n\r\n\r\n\r\n- punt\t ')).toBe('# Kop\nRegel\n\n- punt')
  })

  it('geeft een lege tekst bij alleen witruimte', () => {
    expect(normaliseerTekst('  \n \n ')).toBe('')
  })
})
