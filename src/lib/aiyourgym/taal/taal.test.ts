import { describe, expect, it } from 'vitest'
import { formatDatum, formatEuro, formatEuroCenten, formatGetal, formatProcent, formatTijd } from './formaat'
import { siteAlternates } from './metadata'
import { oudEngelsPad } from './pad'
import { TAAL_COOKIE, TAAL_COOKIE_OPTIES, isTaal, kiesTaal } from './taal'

// Spaties in Intl-uitvoer kunnen een harde spatie zijn; vergelijk zonder dat verschil.
const gewoon = (s: string) => s.replace(/[  ]/g, ' ')

describe('taal kiezen (website, Club en ledenapp)', () => {
  it('herkent alleen nl en en', () => {
    expect(isTaal('nl')).toBe(true)
    expect(isTaal('en')).toBe(true)
    expect(isTaal('de')).toBe(false)
    expect(isTaal(undefined)).toBe(false)
  })
  it('zonder cookie altijd Nederlands', () => {
    expect(kiesTaal(undefined)).toBe('nl')
    expect(kiesTaal(null)).toBe('nl')
    expect(kiesTaal('')).toBe('nl')
    expect(kiesTaal('xx')).toBe('nl')
    expect(kiesTaal('EN')).toBe('nl')
  })
  it('de cookie bepaalt de taal', () => {
    expect(kiesTaal('en')).toBe('en')
    expect(kiesTaal('nl')).toBe('nl')
  })
  it('de cookie heet ayg-taal, een jaar, voor de hele site en leesbaar voor de taalkeuze', () => {
    expect(TAAL_COOKIE).toBe('ayg-taal')
    expect(TAAL_COOKIE_OPTIES).toEqual({ path: '/', sameSite: 'lax', secure: true, httpOnly: false, maxAge: 60 * 60 * 24 * 365 })
  })
})

describe('oude Engelse adressen', () => {
  it('haalt /en eraf', () => {
    expect(oudEngelsPad('/en')).toBe('/')
    expect(oudEngelsPad('/en/')).toBe('/')
    expect(oudEngelsPad('/en/functies')).toBe('/functies')
    expect(oudEngelsPad('/en/voor-wie/gym')).toBe('/voor-wie/gym')
  })
  it('ook onder /aiyourgym', () => {
    expect(oudEngelsPad('/aiyourgym/en')).toBe('/aiyourgym')
    expect(oudEngelsPad('/aiyourgym/en/')).toBe('/aiyourgym')
    expect(oudEngelsPad('/aiyourgym/en/prijzen')).toBe('/aiyourgym/prijzen')
  })
  it('laat gewone en lijkende paden met rust', () => {
    expect(oudEngelsPad('/')).toBeNull()
    expect(oudEngelsPad('/functies')).toBeNull()
    expect(oudEngelsPad('/english')).toBeNull()
    expect(oudEngelsPad('/EN/functies')).toBeNull()
    expect(oudEngelsPad('/aiyourgym')).toBeNull()
    expect(oudEngelsPad('/aiyourgym/enquete')).toBeNull()
    expect(oudEngelsPad('/aiyourgymen')).toBeNull()
  })
})

describe('canonical', () => {
  it('een adres per pagina, zonder hreflang en zonder /en', () => {
    expect(siteAlternates('/functies')).toEqual({ canonical: '/functies' })
    expect(siteAlternates('/')).toEqual({ canonical: '/' })
    expect(siteAlternates('')).toEqual({ canonical: '/' })
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
