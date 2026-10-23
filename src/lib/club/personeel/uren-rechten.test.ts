import { describe, expect, it } from 'vitest'
import { magUrenActie, magUrenBeheren, type UrenKijker } from './uren-rechten'

const LISA = '11111111-1111-4111-8111-111111111111'
const COLLEGA = '22222222-2222-4222-8222-222222222222'

const trainer: UrenKijker = { rol: 'medewerker', persoonId: LISA, medewerkerRollen: ['trainer'] }
const administratie: UrenKijker = { rol: 'medewerker', persoonId: LISA, medewerkerRollen: ['trainer', 'administratie'] }
const eigenaar: UrenKijker = { rol: 'eigenaar', persoonId: 'b1', medewerkerRollen: [] }

describe('uren beheren', () => {
  it('is voor eigenaar, clubmanager, platform en medewerkers met rol Clubmanager of Administratie', () => {
    expect(magUrenBeheren(eigenaar)).toBe(true)
    expect(magUrenBeheren({ rol: 'clubmanager', persoonId: 'b2' })).toBe(true)
    expect(magUrenBeheren({ rol: 'beheerder', persoonId: null })).toBe(true)
    expect(magUrenBeheren(administratie)).toBe(true)
    expect(magUrenBeheren({ rol: 'medewerker', persoonId: LISA, medewerkerRollen: ['manager'] })).toBe(true)
  })

  it('is niet voor een trainer of instructeur', () => {
    expect(magUrenBeheren(trainer)).toBe(false)
    expect(magUrenBeheren({ rol: 'medewerker', persoonId: LISA, medewerkerRollen: ['instructeur'] })).toBe(false)
    expect(magUrenBeheren({ rol: 'medewerker', persoonId: LISA })).toBe(false)
  })
})

describe('uren van een dienst', () => {
  const eigen = { medewerkerId: LISA, uurStatus: 'gepland' as const }

  it('een trainer bevestigt de eigen uren, maar keurt ze nooit goed', () => {
    expect(magUrenActie(trainer, eigen, 'bevestig')).toBe(true)
    expect(magUrenActie(trainer, { ...eigen, uurStatus: 'gewerkt' }, 'opslaan')).toBe(true)
    expect(magUrenActie(trainer, { ...eigen, uurStatus: 'gewerkt' }, 'terug')).toBe(true)
    expect(magUrenActie(trainer, eigen, 'goedkeuren')).toBe(false)
  })

  it('een trainer verandert niets aan goedgekeurde uren of aan die van een collega', () => {
    expect(magUrenActie(trainer, { ...eigen, uurStatus: 'goedgekeurd' }, 'opslaan')).toBe(false)
    expect(magUrenActie(trainer, { ...eigen, uurStatus: 'goedgekeurd' }, 'terug')).toBe(false)
    expect(magUrenActie(trainer, { medewerkerId: COLLEGA, uurStatus: 'gepland' }, 'bevestig')).toBe(false)
    expect(magUrenActie(trainer, { medewerkerId: null, uurStatus: 'gepland' }, 'bevestig')).toBe(false)
  })

  it('wie uren beheert, mag elke stap', () => {
    expect(magUrenActie(eigenaar, { medewerkerId: COLLEGA, uurStatus: 'gewerkt' }, 'goedkeuren')).toBe(true)
    expect(magUrenActie(administratie, { medewerkerId: COLLEGA, uurStatus: 'goedgekeurd' }, 'terug')).toBe(true)
  })
})
