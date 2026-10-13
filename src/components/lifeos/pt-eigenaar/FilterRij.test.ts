import { describe, expect, test } from 'vitest'
import { filterClubs, gekozenClub, metFilters } from './FilterRij'

describe('clubfilter', () => {
  test('clubmanager: zijn eigen clubs, maar alleen een filter bij meer dan één', () => {
    expect(filterClubs(['someren', 'eindhoven_boschdijk'], ['bladel'])).toEqual(['someren', 'eindhoven_boschdijk'])
    expect(filterClubs(['bladel'], ['bladel', 'budel'])).toEqual([])
  })
  test('eigenaar/beheerder: de clubs die in de gegevens voorkomen, in vaste volgorde', () => {
    expect(filterClubs([], ['eersel', 'budel', null, 'eersel'])).toEqual(['budel', 'eersel'])
    expect(filterClubs([], ['budel'])).toEqual([])
  })
  test('een club uit de URL telt alleen als hij in de lijst staat', () => {
    expect(gekozenClub('budel', ['budel', 'eersel'])).toBe('budel')
    expect(gekozenClub('bladel', ['budel', 'eersel'])).toBeNull()
    expect(gekozenClub(null, ['budel'])).toBeNull()
  })
  test('filters in de URL: lege waarden vallen weg', () => {
    expect(metFilters('/kane/lead', { pt: null, toon: 'alle', club: 'budel' })).toBe('/kane/lead?toon=alle&club=budel')
    expect(metFilters('/kane/lead', { pt: null })).toBe('/kane/lead')
  })
})
