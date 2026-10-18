import { describe, expect, it } from 'vitest'
import { behoudVreemdeVestigingen, deeltVestiging, gewijzigdeIds, zichtbareMedewerkers, zietHeleSportschool } from './medewerker-vestigingen'

const BUDEL = { sleutel: 'budel', naam: 'Budel', standaard: true }
const medewerker = { rol: 'medewerker', vestigingen: [BUDEL] }
const kane = { rol: 'beheerder', vestigingen: [BUDEL, { sleutel: 'eersel', naam: 'Eersel', standaard: false }] }

describe('zietHeleSportschool', () => {
  it('alleen een ingelogde medewerker ziet een deel', () => {
    expect(zietHeleSportschool({ rol: 'medewerker' })).toBe(false)
    expect(zietHeleSportschool({ rol: 'eigenaar' })).toBe(true)
    expect(zietHeleSportschool({ rol: 'beheerder' })).toBe(true)
  })
})

describe('deeltVestiging', () => {
  it('een medewerker ziet alleen collega\'s uit een eigen vestiging', () => {
    expect(deeltVestiging(medewerker, ['budel', 'eersel'])).toBe(true)
    expect(deeltVestiging(medewerker, ['eersel'])).toBe(false)
    expect(deeltVestiging(medewerker, [])).toBe(false)
  })
  it('Kane en de eigenaar zien iedereen, ook zonder vestiging', () => {
    expect(deeltVestiging(kane, [])).toBe(true)
    expect(deeltVestiging({ rol: 'eigenaar', vestigingen: [BUDEL] }, ['eersel'])).toBe(true)
  })
})

describe('zichtbareMedewerkers', () => {
  const lijst = [
    { id: 'a', vestigingen: ['budel'] },
    { id: 'b', vestigingen: ['eersel'] },
    { id: 'c', vestigingen: ['eersel', 'budel'] },
  ]
  it('filtert voor een medewerker', () => {
    expect(zichtbareMedewerkers(medewerker, lijst).map((m) => m.id)).toEqual(['a', 'c'])
  })
  it('laat alles staan voor Kane', () => {
    expect(zichtbareMedewerkers(kane, lijst)).toHaveLength(3)
  })
})

describe('behoudVreemdeVestigingen', () => {
  it('houdt de vestigingen buiten de eigen zoals ze waren', () => {
    expect(behoudVreemdeVestigingen(medewerker, [], ['budel', 'eersel'])).toEqual(['eersel'])
    expect(behoudVreemdeVestigingen(medewerker, ['budel'], ['eersel'])).toEqual(['budel', 'eersel'])
  })
  it('een medewerker voegt geen vreemde vestiging toe', () => {
    expect(behoudVreemdeVestigingen(medewerker, ['budel', 'valkenswaard'], [])).toEqual(['budel'])
  })
  it('Kane mag alles vervangen', () => {
    expect(behoudVreemdeVestigingen(kane, ['budel'], ['budel', 'eersel'])).toEqual(['budel'])
  })
})

describe('gewijzigdeIds', () => {
  it('geeft toegevoegde en weggehaalde ids', () => {
    expect(gewijzigdeIds(['a', 'b'], ['b', 'c']).sort()).toEqual(['a', 'c'])
    expect(gewijzigdeIds(['a'], ['a'])).toEqual([])
  })
})
