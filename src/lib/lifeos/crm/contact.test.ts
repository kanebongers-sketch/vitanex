import { describe, expect, it } from 'vitest'
import { mailHref, normaliseerTelefoon, smsHref, telHref, whatsappHref } from './contact'

describe('normaliseerTelefoon', () => {
  it('behoudt een leidende + en gooit opmaak weg', () => {
    expect(normaliseerTelefoon('+31 6 1234 5678')).toBe('+31612345678')
    expect(normaliseerTelefoon('06-1234 5678')).toBe('0612345678')
  })

  it('geeft null bij te weinig cijfers of leeg', () => {
    expect(normaliseerTelefoon('12345')).toBeNull()
    expect(normaliseerTelefoon('')).toBeNull()
    expect(normaliseerTelefoon(null)).toBeNull()
    expect(normaliseerTelefoon(undefined)).toBeNull()
  })
})

describe('telHref / smsHref', () => {
  it('bouwt tel:/sms:-links', () => {
    expect(telHref('06-12345678')).toBe('tel:0612345678')
    expect(smsHref('+31612345678')).toBe('sms:+31612345678')
  })
  it('geeft null zonder geldig nummer', () => {
    expect(telHref('nvt')).toBeNull()
    expect(smsHref(null)).toBeNull()
  })
})

describe('whatsappHref', () => {
  it('zet een NL-mobiel (0…) om naar internationaal zonder +', () => {
    expect(whatsappHref('06-12345678')).toBe('https://wa.me/31612345678')
  })
  it('stript een leidende +31 en 0031', () => {
    expect(whatsappHref('+31 6 1234 5678')).toBe('https://wa.me/31612345678')
    expect(whatsappHref('0031612345678')).toBe('https://wa.me/31612345678')
  })
  it('geeft null bij een te kort nummer', () => {
    expect(whatsappHref('01234')).toBeNull()
    expect(whatsappHref(null)).toBeNull()
  })
})

describe('mailHref', () => {
  it('bouwt een mailto voor een plausibel adres', () => {
    expect(mailHref('kane@vitaal.nl')).toBe('mailto:kane@vitaal.nl')
    expect(mailHref('  a@b.co  ')).toBe('mailto:a@b.co')
  })
  it('geeft null voor onzin of leeg', () => {
    expect(mailHref('geen-mail')).toBeNull()
    expect(mailHref('a@b')).toBeNull()
    expect(mailHref('')).toBeNull()
    expect(mailHref(null)).toBeNull()
  })
})
