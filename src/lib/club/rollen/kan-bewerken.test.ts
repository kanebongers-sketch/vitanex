import { describe, expect, it } from 'vitest'
import { zonderLosseBeheerders } from './model'
import { kanBewerken, type ProfielToegang } from './wie'

const profiel = (niveaus: ProfielToegang['niveaus']): ProfielToegang => ({ id: 'p', rollen: ['eigenaar'], niveaus, start: '/club', alleVestigingen: true })

describe('kanBewerken (pagina zonder bewerkknoppen bij alleen zien)', () => {
  it('alleen zien: geen bewerkknoppen (de eigenaar ziet leden standaard alleen)', () => {
    expect(kanBewerken({ isPlatformEigenaar: false, profiel: profiel({ leden: 'zien' }) }, 'leden')).toBe(false)
  })

  it('bewerken of beheren: wel', () => {
    expect(kanBewerken({ isPlatformEigenaar: false, profiel: profiel({ leden: 'bewerken' }) }, 'leden')).toBe(true)
    expect(kanBewerken({ isPlatformEigenaar: false, profiel: profiel({ leads: 'beheren' }) }, 'leads')).toBe(true)
  })

  it('geen niveau voor de sleutel: niet', () => {
    expect(kanBewerken({ isPlatformEigenaar: false, profiel: profiel({}) }, 'leden')).toBe(false)
  })

  it('het master account en het oude model (zonder v2): altijd', () => {
    expect(kanBewerken({ isPlatformEigenaar: true, profiel: profiel({ leden: 'zien' }) }, 'leden')).toBe(true)
    expect(kanBewerken({ isPlatformEigenaar: false, profiel: null }, 'leden')).toBe(true)
  })
})

describe('zonderLosseBeheerders (Medewerkers-pagina)', () => {
  const lijst = [
    { id: 'a', actief: true },
    { id: 'eigenaar-zonder-werkrol', actief: false },
    { id: 'eigenaar-met-werkrol', actief: true },
    { id: 'oud-medewerker', actief: false },
  ]
  const beheerders = new Set(['eigenaar-zonder-werkrol', 'eigenaar-met-werkrol'])

  it('verbergt alleen een beheerdersprofiel zonder werkrol, niet een medewerker uit dienst', () => {
    expect(zonderLosseBeheerders(lijst, beheerders).map((m) => m.id)).toEqual(['a', 'eigenaar-met-werkrol', 'oud-medewerker'])
  })

  it('zonder beheerders blijft de lijst gelijk', () => {
    expect(zonderLosseBeheerders(lijst, new Set())).toHaveLength(4)
  })
})
