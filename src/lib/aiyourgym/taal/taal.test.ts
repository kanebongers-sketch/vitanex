import { describe, expect, it } from 'vitest'
import { formatDatum, formatEuro, formatEuroCenten, formatGetal, formatProcent, formatTijd } from './formaat'
import { taalAlternates } from './metadata'
import { ontleedSitePad, splitsTaal, taalPad, wisselTaalPad } from './pad'
import { isTaal, kiesTaal, taalUitAcceptLanguage } from './taal'

// Spaties in Intl-uitvoer kunnen een harde spatie zijn; vergelijk zonder dat verschil.
const gewoon = (s: string) => s.replace(/[  ]/g, ' ')

describe('taal kiezen (Club en ledenapp)', () => {
  it('herkent alleen nl en en', () => {
    expect(isTaal('nl')).toBe(true)
    expect(isTaal('en')).toBe(true)
    expect(isTaal('de')).toBe(false)
    expect(isTaal(undefined)).toBe(false)
  })
  it('leest de beste taal uit Accept-Language', () => {
    expect(taalUitAcceptLanguage('en-GB,en;q=0.9,nl;q=0.8')).toBe('en')
    expect(taalUitAcceptLanguage('nl-NL,nl;q=0.9,en-US;q=0.8')).toBe('nl')
    expect(taalUitAcceptLanguage('de-DE,de;q=0.9,en;q=0.5')).toBe('en')
    expect(taalUitAcceptLanguage('en;q=0.4,nl;q=0.6')).toBe('nl')
    expect(taalUitAcceptLanguage('fr,de')).toBeNull()
    expect(taalUitAcceptLanguage('en;q=0')).toBeNull()
    expect(taalUitAcceptLanguage('')).toBeNull()
    expect(taalUitAcceptLanguage(null)).toBeNull()
  })
  it('voorkeur gaat voor de browser, daarna Nederlands', () => {
    expect(kiesTaal('en', 'nl-NL')).toBe('en')
    expect(kiesTaal('nl', 'en-GB')).toBe('nl')
    expect(kiesTaal(undefined, 'en-GB')).toBe('en')
    expect(kiesTaal('xx', 'en-GB')).toBe('en')
    expect(kiesTaal(null, 'fr-FR')).toBe('nl')
    expect(kiesTaal(null, null)).toBe('nl')
  })
})

describe('taal in het adres', () => {
  it('splitst /en eraf', () => {
    expect(splitsTaal('/en')).toEqual({ taal: 'en', rest: '/' })
    expect(splitsTaal('/en/functies')).toEqual({ taal: 'en', rest: '/functies' })
    expect(splitsTaal('/en#vragen')).toEqual({ taal: 'en', rest: '/#vragen' })
    expect(splitsTaal('/functies')).toEqual({ taal: 'nl', rest: '/functies' })
    expect(splitsTaal('/english')).toEqual({ taal: 'nl', rest: '/english' })
  })
  it('zet een pad in een taal', () => {
    expect(taalPad('nl', '/functies')).toBe('/functies')
    expect(taalPad('en', '/functies')).toBe('/en/functies')
    expect(taalPad('en', '/')).toBe('/en')
    expect(taalPad('en', '')).toBe('/en')
    expect(taalPad('nl', '')).toBe('/')
  })
  it('wisselt van taal met en zonder /aiyourgym', () => {
    expect(wisselTaalPad('/functies', 'en')).toBe('/en/functies')
    expect(wisselTaalPad('/en/functies', 'nl')).toBe('/functies')
    expect(wisselTaalPad('/', 'en')).toBe('/en')
    expect(wisselTaalPad('/en', 'nl')).toBe('/')
    expect(wisselTaalPad('/aiyourgym/functies', 'en')).toBe('/aiyourgym/en/functies')
    expect(wisselTaalPad('/aiyourgym/en/functies', 'nl')).toBe('/aiyourgym/functies')
    expect(wisselTaalPad('/aiyourgym', 'en')).toBe('/aiyourgym/en')
    expect(wisselTaalPad('/aiyourgym/en', 'nl')).toBe('/aiyourgym')
    expect(wisselTaalPad('/en/functies', 'en')).toBe('/en/functies')
  })
  it('ontleedt een websitepad tot route, taal en publiek pad', () => {
    expect(ontleedSitePad('/en/prijzen')).toEqual({ taal: 'en', route: '/aiyourgym/prijzen', publiek: '/prijzen' })
    expect(ontleedSitePad('/aiyourgym/en')).toEqual({ taal: 'en', route: '/aiyourgym', publiek: '/' })
    expect(ontleedSitePad('/aiyourgym/prijzen')).toEqual({ taal: 'nl', route: '/aiyourgym/prijzen', publiek: '/prijzen' })
    expect(ontleedSitePad('/aiyourgym')).toEqual({ taal: 'nl', route: '/aiyourgym', publiek: '/' })
    expect(ontleedSitePad('/prijzen')).toBeNull()
  })
  it('geeft hreflang voor beide talen en x-default', () => {
    expect(taalAlternates('/functies', 'en')).toEqual({
      canonical: '/en/functies',
      languages: { nl: '/functies', en: '/en/functies', 'x-default': '/functies' },
    })
    expect(taalAlternates('/', 'nl')).toEqual({ canonical: '/', languages: { nl: '/', en: '/en', 'x-default': '/' } })
  })
})

describe('formaat per taal', () => {
  const datum = new Date('2026-10-24T07:30:00Z')
  it('datums in nl-NL en en-GB, in Amsterdamse tijd', () => {
    expect(formatDatum(datum, 'nl')).toBe('24 oktober 2026')
    expect(formatDatum(datum, 'en')).toBe('24 October 2026')
    expect(formatDatum(datum, 'nl', 'cijfers')).toBe('24-10-2026')
    expect(formatDatum(datum, 'en', 'cijfers')).toBe('24/10/2026')
    expect(formatDatum(datum, 'en', 'dag')).toBe('Saturday 24 October')
    expect(formatDatum('geen datum', 'nl')).toBe('')
  })
  it('tijd altijd met 24 uur', () => {
    expect(formatTijd(datum, 'nl')).toBe('09:30')
    expect(formatTijd(datum, 'en')).toBe('09:30')
    expect(formatTijd(new Date('2026-10-24T13:05:00Z'), 'en')).toBe('15:05')
  })
  it('getallen en procenten', () => {
    expect(formatGetal(1234.5, 'nl')).toBe('1.234,5')
    expect(formatGetal(1234.5, 'en')).toBe('1,234.5')
    expect(gewoon(formatProcent(0.42, 'nl'))).toMatch(/^42 ?%$/)
    expect(formatProcent(0.42, 'en')).toBe('42%')
  })
  it('bedragen in euro', () => {
    expect(gewoon(formatEuro(49.95, 'nl'))).toBe('€ 49,95')
    expect(formatEuro(49.95, 'en')).toBe('€49.95')
    expect(gewoon(formatEuro(49, 'nl'))).toBe('€ 49')
    expect(formatEuro(49, 'en', true)).toBe('€49.00')
    expect(gewoon(formatEuroCenten(129900, 'nl'))).toBe('€ 1.299,00')
    expect(formatEuroCenten(129900, 'en')).toBe('€1,299.00')
  })
})
