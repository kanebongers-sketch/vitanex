import { describe, expect, it } from 'vitest'
import { APP_BALK, BALK_SECTIES, balkVan, kiesScherm, sectiesVan, zichtbareBalk } from './tabs'
import { LEDENAPP_TABBLADEN } from '@/lib/club/ledenlogin/contract'

describe('onderbalk van de ledenapp', () => {
  it('heeft hoogstens vijf tabbladen', () => {
    expect(APP_BALK.length).toBeLessThanOrEqual(5)
    expect(zichtbareBalk([])).toEqual(['home', 'boeken', 'schema', 'voeding', 'profiel'])
  })

  it('elke sectie hoort bij precies een tabblad', () => {
    for (const s of LEDENAPP_TABBLADEN) {
      expect(APP_BALK.filter((b) => BALK_SECTIES[b].includes(s))).toHaveLength(1)
    }
    expect(balkVan('afspraken')).toBe('boeken')
    expect(balkVan('voortgang')).toBe('schema')
  })

  it('Boeken valt weg zonder lessen en afspraken, Schema zonder schema en voortgang', () => {
    expect(zichtbareBalk(['lessen', 'afspraken'])).toEqual(['home', 'schema', 'voeding', 'profiel'])
    expect(zichtbareBalk(['lessen'])).toContain('boeken')
    expect(zichtbareBalk(['schema', 'voortgang', 'voeding'])).toEqual(['home', 'boeken', 'profiel'])
  })

  it('Home en Profiel staan altijd aan', () => {
    expect(zichtbareBalk([...LEDENAPP_TABBLADEN])).toEqual(['home', 'profiel'])
    expect(sectiesVan('profiel', ['profiel'])).toEqual(['profiel'])
  })
})

describe('kiesScherm', () => {
  it('oude adressen openen het nieuwe tabblad met de sectie', () => {
    expect(kiesScherm('lessen', [])).toEqual({ balk: 'boeken', sectie: 'lessen' })
    expect(kiesScherm('afspraken', [])).toEqual({ balk: 'boeken', sectie: 'afspraken' })
    expect(kiesScherm('voortgang', [])).toEqual({ balk: 'schema', sectie: 'voortgang' })
    expect(kiesScherm(['schema'], [])).toEqual({ balk: 'schema', sectie: 'schema' })
  })

  it('het nieuwe tabblad opent de eerste sectie die aan staat', () => {
    expect(kiesScherm('boeken', [])).toEqual({ balk: 'boeken', sectie: 'lessen' })
    expect(kiesScherm('boeken', ['lessen'])).toEqual({ balk: 'boeken', sectie: 'afspraken' })
  })

  it('een sectie die uit staat valt terug op hetzelfde tabblad, anders op Home', () => {
    expect(kiesScherm('lessen', ['lessen'])).toEqual({ balk: 'boeken', sectie: 'afspraken' })
    expect(kiesScherm('schema', ['schema'])).toEqual({ balk: 'schema', sectie: 'voortgang' })
    expect(kiesScherm('lessen', ['lessen', 'afspraken'])).toEqual({ balk: 'home', sectie: 'home' })
    expect(kiesScherm('voeding', ['voeding'])).toEqual({ balk: 'home', sectie: 'home' })
  })

  it('onbekend of leeg is Home', () => {
    expect(kiesScherm(undefined, [])).toEqual({ balk: 'home', sectie: 'home' })
    expect(kiesScherm('meldingen', [])).toEqual({ balk: 'home', sectie: 'home' })
  })
})
