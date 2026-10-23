import { describe, expect, it } from 'vitest'
import { clubDeel, openTijdensWizard, wizardVerplicht, type PoortInvoer } from './poort'
import { NIEUWE_START } from './stappen'

const KANE = 'kane-0000'
const nieuw: PoortInvoer = {
  isPlatformEigenaar: false,
  organisatie: { id: 'org-1', demo: false },
  beheerderId: KANE,
  gelezen: { ok: true, voortgang: NIEUWE_START },
  heeftData: async () => false,
}

describe('wizardVerplicht', () => {
  it('houdt een nieuwe sportschool in de wizard tot hij is afgerond', async () => {
    expect(await wizardVerplicht(nieuw)).toBe(true)
    const af = { ...NIEUWE_START, afgerondOp: '2026-10-23T10:00:00.000Z' }
    expect(await wizardVerplicht({ ...nieuw, gelezen: { ok: true, voortgang: af } })).toBe(false)
  })

  it('laat het master account, een demo en de eigen omgeving altijd door', async () => {
    expect(await wizardVerplicht({ ...nieuw, isPlatformEigenaar: true })).toBe(false)
    expect(await wizardVerplicht({ ...nieuw, organisatie: { id: 'org-1', demo: true } })).toBe(false)
    expect(await wizardVerplicht({ ...nieuw, organisatie: { id: KANE, demo: false } })).toBe(false)
  })

  it('gaat open als de voortgang niet te lezen is', async () => {
    expect(await wizardVerplicht({ ...nieuw, gelezen: { ok: false } })).toBe(false)
  })

  it('kijkt zonder voortgang naar de data: een sportschool van voor de wizard blijft open', async () => {
    expect(await wizardVerplicht({ ...nieuw, gelezen: { ok: true, voortgang: null } })).toBe(true)
    expect(await wizardVerplicht({ ...nieuw, gelezen: { ok: true, voortgang: null }, heeftData: async () => true })).toBe(false)
  })

  it('vraagt de data alleen op als er geen voortgang is', async () => {
    let gevraagd = 0
    const tel = async () => {
      gevraagd += 1
      return true
    }
    await wizardVerplicht({ ...nieuw, heeftData: tel })
    await wizardVerplicht({ ...nieuw, isPlatformEigenaar: true, gelezen: { ok: true, voortgang: null }, heeftData: tel })
    expect(gevraagd).toBe(0)
  })
})

describe('openTijdensWizard', () => {
  it('laat de wizard, hulp en het abonnement open', () => {
    for (const pad of ['/club/start', '/club/start?stap=3', '/club/hulp', '/club/hulp/meldingen', '/club/beheer/abonnement']) expect(openTijdensWizard(pad), pad).toBe(true)
  })

  it('houdt de rest dicht', () => {
    for (const pad of ['/club', '/club/leden', '/club/beheer', '/club/beheer/rechten', '/club/instellingen/medewerkers', '/club/starten', '/club/hulpje']) expect(openTijdensWizard(pad), pad).toBe(false)
  })

  it('kent het adres met de sportschool ervoor en het subdomein', () => {
    expect(clubDeel('/budel/club/start')).toBe('/club/start')
    expect(clubDeel('/start')).toBe('/club/start')
    expect(clubDeel('/')).toBe('/club')
    expect(openTijdensWizard('/testgym/club/hulp')).toBe(true)
    expect(openTijdensWizard('/testgym/club/leden')).toBe(false)
  })
})
