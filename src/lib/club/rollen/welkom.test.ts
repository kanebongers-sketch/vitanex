import { describe, expect, it } from 'vitest'
import { isUitlegCode, ledenWelkomSleutel, metGezien, uitlegCode, welkomRol, welkomSleutel } from './welkom'

const basis = { isPlatformEigenaar: false, rol: 'medewerker' as const }

describe('welkomRol', () => {
  it('geeft Kane (platform-eigenaar) de uitleg van de clubmanager', () => {
    expect(welkomRol({ ...basis, isPlatformEigenaar: true, rol: 'beheerder' })).toBe('manager')
  })

  it('kiest bij meerdere rollen de rol van de startpagina', () => {
    const profiel = { id: 'p', rollen: ['administratie', 'trainer'] as const, niveaus: {}, start: '/club', alleVestigingen: true }
    expect(welkomRol({ ...basis, profiel: { ...profiel, rollen: [...profiel.rollen] } })).toBe('trainer')
  })

  it('leest de oude medewerkerrollen zonder v2', () => {
    expect(welkomRol({ ...basis, medewerkerRollen: ['instructeur'] })).toBe('instructeur')
  })

  it('valt terug op de beheerderslogin van het oude model', () => {
    expect(welkomRol({ isPlatformEigenaar: false, rol: 'eigenaar' })).toBe('eigenaar')
    expect(welkomRol({ isPlatformEigenaar: false, rol: 'clubmanager' })).toBe('manager')
  })

  it('geeft niets voor een profiel zonder rollen', () => {
    expect(welkomRol({ ...basis, profiel: { id: 'p', rollen: [], niveaus: {}, start: '/club', alleVestigingen: true } })).toBeNull()
  })
})

describe('sleutels', () => {
  it('zijn per sportschool, persoon, rol en versie', () => {
    expect(welkomSleutel('org', 'p1', 'trainer')).toBe('ayg-welkom:org:p1:trainer:v1')
    expect(welkomSleutel('org', null, 'eigenaar')).toBe('ayg-welkom:org:beheer:eigenaar:v1')
    expect(ledenWelkomSleutel('lid')).toBe('ayg-welkom-lid:lid:v1')
  })
})

describe('weggeklikt per account', () => {
  it('maakt en controleert codes', () => {
    expect(uitlegCode('trainer')).toBe('trainer:v1')
    expect(isUitlegCode(uitlegCode('leden'))).toBe(true)
    expect(isUitlegCode('trainer')).toBe(false)
    expect(isUitlegCode('hacker:v1')).toBe(false)
    expect(isUitlegCode(42)).toBe(false)
  })

  it('voegt toe zonder dubbele en houdt hoogstens 20', () => {
    expect(metGezien(['trainer:v1'], 'trainer:v1')).toEqual(['trainer:v1'])
    const vol = Array.from({ length: 20 }, (_, i) => `trainer:v${i}`)
    const uit = metGezien(vol, 'leden:v1')
    expect(uit).toHaveLength(20)
    expect(uit[19]).toBe('leden:v1')
    expect(uit[0]).toBe('trainer:v1')
  })
})
