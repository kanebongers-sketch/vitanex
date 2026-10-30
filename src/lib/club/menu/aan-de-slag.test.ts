import { describe, expect, it } from 'vitest'
import { NIEUWE_START, nodigeStappen, startPad, stappenStand, type StartFeiten, type StartVoortgang } from '@/lib/club/start/stappen'
import { TE_DOEN_IDS, type TeDoenId } from '@/lib/club/kern/instel-te-doen'
import { aanDeSlagStand, aanDeSlagStappen, verborgenSleutel, TE_DOEN_IN_WIZARD } from './aan-de-slag'

const LEEG: StartFeiten = {
  heeftLogo: false, heeftAdres: false, vestigingen: 0, vestigingenMetAdres: 0, vestigingenIngericht: 0,
  lestypen: 0, vasteLessen: 0, medewerkers: 0, leden: 0, uit: [],
}

const teDoen = (klaar: Partial<Record<TeDoenId, boolean>>) =>
  TE_DOEN_IDS.filter((id) => id in klaar).map((id) => ({ id, klaar: Boolean(klaar[id]), titel: id, href: `/club/beheer/${id}` }))

const wizard = (v: StartVoortgang | null, f: StartFeiten) => nodigeStappen(stappenStand(v, f))

describe('Aan de slag', () => {
  it('elk punt van Nog te doen heeft een plek (in de wizard of eigen)', () => {
    for (const id of TE_DOEN_IDS) expect(id in TE_DOEN_IN_WIZARD).toBe(true)
  })

  it('een nieuwe sportschool: de stappen van de wizard plus wat de wizard niet dekt', () => {
    const stappen = aanDeSlagStappen({ wizard: wizard(NIEUWE_START, LEEG), wizardHref: (n) => startPad(n, null), teDoen: teDoen({ vestigingen: false, huisstijl: false, adres: false, bedrijf: false }) })
    // 8 stappen in de wizard plus Bedrijf; huisstijl, adres en vestigingen zitten al in de wizard.
    expect(stappen.map((s) => s.id)).toEqual([
      'wizard-soort', 'wizard-huisstijl', 'wizard-vestigingen', 'wizard-onderdelen', 'wizard-lessen', 'wizard-team', 'wizard-leden', 'wizard-klaar', 'instel-bedrijf',
    ])
    const stand = aanDeSlagStand(stappen)
    expect(stand).toMatchObject({ af: 0, totaal: 9, volgende: { id: 'wizard-soort', href: '/club/start?stap=1' } })
  })

  it('telt af volgens de regels van de wizard en wijst de eerste open stap aan', () => {
    const v: StartVoortgang = { ...NIEUWE_START, soort: 'gym', klaar: ['onderdelen'] }
    const f: StartFeiten = { ...LEEG, heeftLogo: true, heeftAdres: true, vestigingen: 1, vestigingenMetAdres: 1, vestigingenIngericht: 1 }
    const stand = aanDeSlagStand(aanDeSlagStappen({ wizard: wizard(v, f), wizardHref: (n) => startPad(n, null), teDoen: teDoen({ bedrijf: true }) }))
    expect(stand?.af).toBe(5)
    expect(stand?.totaal).toBe(9)
    expect(stand?.volgende.id).toBe('wizard-lessen')
  })

  it('zonder pakket Groepslessen telt de stap Lessen niet mee', () => {
    const stand = stappenStand(NIEUWE_START, LEEG, 'nl', ['administratie'])
    const stappen = aanDeSlagStappen({ wizard: nodigeStappen(stand), wizardHref: null, teDoen: [] })
    expect(stappen.map((s) => s.id)).not.toContain('wizard-lessen')
  })

  it('alles af: niets in de kop', () => {
    const v: StartVoortgang = { ...NIEUWE_START, soort: 'gym', klaar: ['onderdelen'], afgerondOp: '2026-10-29T10:00:00Z', bevestigd: ['alleen', 'zonder_leden'] }
    const f: StartFeiten = { ...LEEG, heeftLogo: true, heeftAdres: true, vestigingen: 1, vestigingenMetAdres: 1, vestigingenIngericht: 1, lestypen: 2, vasteLessen: 4 }
    expect(aanDeSlagStand(aanDeSlagStappen({ wizard: wizard(v, f), wizardHref: null, teDoen: teDoen({ bedrijf: true }) }))).toBeNull()
    // Wizard af maar de KvK ontbreekt nog: dan is Bedrijf de volgende stap.
    const stand = aanDeSlagStand(aanDeSlagStappen({ wizard: wizard(v, f), wizardHref: null, teDoen: teDoen({ bedrijf: false }) }))
    expect(stand).toMatchObject({ af: 8, totaal: 9, volgende: { id: 'instel-bedrijf', href: '/club/beheer/bedrijf' } })
  })

  it('wie de wizard niet mag openen (clubmanager) krijgt geen link naar de wizard', () => {
    const stand = aanDeSlagStand(aanDeSlagStappen({ wizard: wizard(NIEUWE_START, LEEG), wizardHref: null, teDoen: [] }))
    expect(stand?.volgende.href).toBeNull()
  })

  it('zonder wizardstappen tellen de punten van Nog te doen zelf (huisstijl, adres, vestigingen)', () => {
    const stappen = aanDeSlagStappen({ wizard: [], wizardHref: null, teDoen: teDoen({ vestigingen: true, huisstijl: false, adres: true, bedrijf: false }) })
    expect(stappen.map((s) => s.id)).toEqual(['instel-vestigingen', 'instel-huisstijl', 'instel-adres', 'instel-bedrijf'])
    expect(aanDeSlagStand(stappen)).toMatchObject({ af: 2, totaal: 4, volgende: { id: 'instel-huisstijl' } })
  })

  it('wegklikken geldt per persoon, sportschool en aantal stappen', () => {
    const a = verborgenSleutel('kane', 'org-1', { totaal: 9 })
    expect(a).not.toBe(verborgenSleutel('anna', 'org-1', { totaal: 9 }))
    expect(a).not.toBe(verborgenSleutel('kane', 'org-2', { totaal: 9 }))
    expect(a).not.toBe(verborgenSleutel('kane', 'org-1', { totaal: 10 }))
  })
})
