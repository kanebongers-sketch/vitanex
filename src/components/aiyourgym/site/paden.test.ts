import { describe, expect, it } from 'vitest'
import { AANMELDEN, INLOGGEN, OVERSTAPPEN, PRIJZEN_VRAGEN, SITE_PADEN, aygPad, isHuidig, navLinks, voorWie } from './paden'

// Besluit Kane (30-10-2026): schone adressen zonder /aiyourgym op aiyourgym.com.

describe('aygPad', () => {
  it('geeft schone paden zonder /aiyourgym', () => {
    expect(aygPad()).toBe('/')
    expect(aygPad('/')).toBe('/')
    expect(aygPad('/prijzen')).toBe('/prijzen')
    expect(aygPad('overstappen')).toBe('/overstappen')
    expect(aygPad('/functies#beheer')).toBe('/functies#beheer')
    expect(aygPad('#vragen')).toBe('/#vragen')
  })
  it('is idempotent en haalt een per ongeluk meegegeven /aiyourgym weg', () => {
    expect(aygPad(aygPad('/functies#beheer'))).toBe('/functies#beheer')
    expect(aygPad('/aiyourgym/prijzen')).toBe('/prijzen')
    expect(aygPad('/aiyourgym')).toBe('/')
    expect(aygPad('/aiyourgym#vragen')).toBe('/#vragen')
  })
  it('laat lijkende paden met rust', () => {
    expect(aygPad('/aiyourgymx')).toBe('/aiyourgymx')
  })
})

describe('vaste links', () => {
  it('bevatten nergens /aiyourgym', () => {
    const alle = [...Object.values(SITE_PADEN), PRIJZEN_VRAGEN, voorWie(), voorWie('boutique'), ...navLinks('nl').map((l) => l.pad), ...navLinks('en').map((l) => l.pad)]
    for (const pad of alle) {
      expect(pad.startsWith('/')).toBe(true)
      expect(pad).not.toMatch(/\/aiyourgym(\/|#|$)/)
    }
    expect(SITE_PADEN.HOME).toBe('/')
    expect(AANMELDEN).toBe('/aanmelden')
    expect(OVERSTAPPEN).toBe('/overstappen')
    expect(INLOGGEN).toBe('/inloggen')
    expect(voorWie('gym')).toBe('/voor-wie#gym')
  })
})

describe('isHuidig', () => {
  it('kent de pagina aan het schone adres in de adresbalk', () => {
    expect(isHuidig('/overstappen', '/overstappen')).toBe(true)
    expect(isHuidig('/prijzen', '/prijzen/')).toBe(true)
    expect(isHuidig('/functies', '/functies/iets')).toBe(true)
    expect(isHuidig('/prijzen', '/overstappen')).toBe(false)
  })
  it('werkt ook met het interne pad onder /aiyourgym', () => {
    expect(isHuidig('/overstappen', '/aiyourgym/overstappen')).toBe(true)
    expect(isHuidig('/', '/aiyourgym')).toBe(true)
  })
  it('de voorpagina is alleen de voorpagina', () => {
    expect(isHuidig('/', '/')).toBe(true)
    expect(isHuidig('/', '/prijzen')).toBe(false)
    expect(isHuidig('/', null)).toBe(false)
  })
})
