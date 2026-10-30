import { describe, expect, it } from 'vitest'
import { orgInstellingenUitRij, ONDERDEEL_SLEUTELS } from '@/lib/club/kern/org-instellingen'
import type { Organisatie } from '@/lib/club/kern/organisatie'
import { alsTestRol, cookieWaarde, leesTestRollen, magTestRol, testRollenUitBody } from './testrol'

const ORG = { id: 'org', uit: [], instellingen: orgInstellingenUitRij({}, ONDERDEEL_SLEUTELS) } as unknown as Organisatie

describe('testen als rol', () => {
  it('leest de cookie streng: alleen bekende rollen, vaste volgorde', () => {
    expect(leesTestRollen('trainer')).toEqual(['trainer'])
    expect(leesTestRollen('roosteraar,trainer,trainer')).toEqual(['trainer', 'roosteraar'])
    expect(leesTestRollen('trainer,beheerder')).toBeNull()
    expect(leesTestRollen('')).toBeNull()
    expect(leesTestRollen(undefined)).toBeNull()
    expect(leesTestRollen(cookieWaarde(['eigenaar', 'manager']))).toEqual(['eigenaar', 'manager'])
  })

  it('leest het verzoek: lijst van rollen, leeg is stoppen', () => {
    expect(testRollenUitBody({ rollen: [] })).toEqual([])
    expect(testRollenUitBody({ rollen: ['instructeur'] })).toEqual(['instructeur'])
    expect(testRollenUitBody({ rollen: ['admin'] })).toBeNull()
    expect(testRollenUitBody({ rollen: 'trainer' })).toBeNull()
    expect(testRollenUitBody(null)).toBeNull()
  })

  it('nooit in de eigen omgeving van het master account', () => {
    expect(magTestRol({ id: 'kane' }, 'kane')).toBe(false)
    expect(magTestRol({ id: 'tester5' }, 'kane')).toBe(true)
  })

  it('een trainer is een medewerker zonder platformrechten, met de rechten van de rol', () => {
    const t = alsTestRol({ organisatie: ORG, naam: 'Kane' }, ['trainer'])
    expect(t).toMatchObject({ rol: 'medewerker', isPlatformEigenaar: false, persoonId: null, medewerkerRollen: ['trainer'], testAls: ['trainer'], naam: 'Kane (test)' })
    expect(t.profiel.rollen).toEqual(['trainer'])
    expect(t.onderdelen).toContain('vandaag')
    expect(t.profiel.niveaus.abonnement ?? 'geen').toBe('geen')
  })

  it('eigenaar en clubmanager krijgen de soort sessie van de leiding', () => {
    expect(alsTestRol({ organisatie: ORG, naam: 'Kane' }, ['eigenaar']).rol).toBe('eigenaar')
    expect(alsTestRol({ organisatie: ORG, naam: 'Kane' }, ['manager', 'trainer']).rol).toBe('clubmanager')
  })
})
