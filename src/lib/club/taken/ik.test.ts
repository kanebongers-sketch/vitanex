import { describe, expect, it } from 'vitest'
import { ikAlsAfvinker } from './ik'

describe('ikAlsAfvinker', () => {
  it('een ingelogde medewerker vinkt meteen af onder de eigen naam', () => {
    expect(ikAlsAfvinker({ rol: 'medewerker', persoonId: 'm1', naam: 'Lisa de Vries' })).toEqual({ wie: 'Lisa de Vries', medewerkerId: 'm1' })
  })

  it('een beheerder met een profiel (rollen v2) ook', () => {
    const profiel = { id: 'p1', rollen: [], niveaus: {}, start: '/club', alleVestigingen: true }
    expect(ikAlsAfvinker({ rol: 'eigenaar', persoonId: 'b1', naam: 'Sam', profiel })).toEqual({ wie: 'Sam', medewerkerId: 'p1' })
  })

  it('zonder profiel of naam kiest de balie zelf', () => {
    expect(ikAlsAfvinker({ rol: 'beheerder', persoonId: null, naam: 'Kane' })).toBeNull()
    expect(ikAlsAfvinker({ rol: 'medewerker', persoonId: 'm1', naam: '  ' })).toBeNull()
  })
})
