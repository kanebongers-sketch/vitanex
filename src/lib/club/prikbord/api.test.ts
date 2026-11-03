import { describe, expect, it } from 'vitest'
import { magApiV2 } from '@/lib/club/rollen/api'
import { bouwProfiel } from '@/lib/club/rollen/profiel'
import { leesRolrechten } from '@/lib/club/rollen/model'
import { STANDAARD_RECHTEN } from '@/lib/club/rollen/standaard'
import { ALLE_PAKKETTEN, verborgenVoor } from '@/lib/club/kern/pakketten'
import { apiAfgenomen } from '@/lib/club/kern/pakketten'
import type { Rol } from '@/lib/club/rollen/typen'
import { magBeheren, magPlaatsen, prikbordNiveau, prikbordZichtbaar, type PrikbordWie } from './toegang'

// Rechten per niveau op het Prikbord: zien = lezen, bevestigen en uitvoeren;
// bewerken = mededeling plaatsen; beheren = werkwijzen en versies.

const UIT = verborgenVoor([], ALLE_PAKKETTEN)
const ORG = { instellingen: { ledenapp: { welkom: null, tabsUit: [], qr: true }, rechten: { trainer: [], instructeur: [], manager: [], administratie: [] }, checkin: { methode: 'beide' as const } }, uit: UIT }

function wie(rollen: Rol[], afgenomen = ALLE_PAKKETTEN): PrikbordWie {
  const { profiel, onderdelen } = bouwProfiel({ id: '00000000-0000-4000-8000-000000000001', rollen, alleVestigingen: true }, { ...ORG, uit: verborgenVoor([], afgenomen) })
  return { isPlatformEigenaar: false, rol: 'medewerker', profiel, onderdelen, organisatie: { afgenomen }, vestigingen: [{ sleutel: 'budel', naam: 'Budel', standaard: true }], persoonId: null }
}

const VERZOEKEN: [string, string][] = [
  ['POST', '/api/club/prikbord/gelezen'],
  ['POST', '/api/club/prikbord/uitvoeringen'],
  ['POST', '/api/club/prikbord/mededelingen'],
  ['PATCH', '/api/club/prikbord/mededelingen/x'],
  ['POST', '/api/club/prikbord/werkwijzen'],
  ['PATCH', '/api/club/prikbord/werkwijzen/x'],
]

function mag(rollen: Rol[]): string[] {
  const t = wie(rollen)
  return VERZOEKEN.filter(([m, p]) => t.profiel && magApiV2(t.profiel.niveaus, p, m)).map(([m, p]) => `${m} ${p}`)
}

describe('prikbord: rechten per niveau', () => {
  it('standaard: eigenaar en clubmanager beheren, de rest ziet', () => {
    expect(STANDAARD_RECHTEN.eigenaar.prikbord).toBe('beheren')
    expect(STANDAARD_RECHTEN.manager.prikbord).toBe('beheren')
    for (const r of ['trainer', 'instructeur', 'roosteraar', 'administratie'] as const) expect(STANDAARD_RECHTEN[r].prikbord, r).toBe('zien')
  })

  it('zien: lezen, bevestigen en uitvoeren mag; plaatsen en werkwijzen niet', () => {
    // Act
    const trainer = mag(['trainer'])
    // Assert
    expect(trainer).toEqual(['POST /api/club/prikbord/gelezen', 'POST /api/club/prikbord/uitvoeringen'])
    expect(magPlaatsen(wie(['trainer']))).toBe(false)
    expect(magBeheren(wie(['trainer']))).toBe(false)
  })

  it('beheren: alles, ook werkwijzen en versies', () => {
    expect(mag(['manager'])).toHaveLength(VERZOEKEN.length)
    expect(magBeheren(wie(['manager']))).toBe(true)
    expect(magBeheren(wie(['eigenaar']))).toBe(true)
  })

  it('zonder rol: dicht', () => {
    expect(mag([])).toEqual([])
    expect(prikbordNiveau(wie([]))).toBe('geen')
  })

  it('het Prikbord hoort bij Team en vloer: zonder dat pakket bestaat het niet', () => {
    const zonderTeam = ALLE_PAKKETTEN.filter((p) => p !== 'team')
    expect(prikbordZichtbaar(wie(['eigenaar'], zonderTeam))).toBe(false)
    expect(apiAfgenomen(zonderTeam, '/api/club/prikbord/gelezen')).toBe(false)
    expect(apiAfgenomen(ALLE_PAKKETTEN, '/api/club/prikbord/gelezen')).toBe(true)
    expect(prikbordZichtbaar(wie(['trainer']))).toBe(true)
  })

  it('een opgeslagen kaart van voor het Prikbord krijgt de standaard; een eigen keuze geen blijft', () => {
    // Arrange
    const oud = { rolrechten: { rollen: { eigenaar: { leden: 'beheren' }, trainer: { leden: 'bewerken' } } } }
    const gekozen = { rolrechten: { rollen: { trainer: { leden: 'bewerken', prikbord: 'geen' } } } }
    // Act
    const a = leesRolrechten(oud)
    const b = leesRolrechten(gekozen)
    // Assert
    expect(a.rollen.eigenaar.prikbord).toBe('beheren')
    expect(a.rollen.trainer.prikbord).toBe('zien')
    expect(b.rollen.trainer.prikbord).toBe('geen')
  })
})
