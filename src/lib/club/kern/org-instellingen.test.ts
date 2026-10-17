import { describe, expect, it } from 'vitest'
import { leesOrgInstellingenInvoer, orgInstellingenNaarJson, orgInstellingenUitRij, standaardRechten, STANDAARD_LEDENAPP } from './org-instellingen'

const ONDERDELEN = ['vandaag', 'checkin', 'leden', 'berichten', 'schemas', 'rooster', 'afspraken', 'leads', 'personeel', 'taken', 'cijfers', 'instellingen']

describe('instellingen van een sportschool', () => {
  it('geeft de standaard bij een lege of kapotte rij', () => {
    expect(orgInstellingenUitRij({}, ONDERDELEN)).toEqual({ ledenapp: STANDAARD_LEDENAPP, rechten: standaardRechten() })
    expect(orgInstellingenUitRij('x', ONDERDELEN).ledenapp.qr).toBe(true)
  })

  it('leest opgeslagen waarden en laat onbekende weg', () => {
    const i = orgInstellingenUitRij({ ledenapp: { welkom: ' Welkom  bij ons ', tabs_uit: ['lessen', 'kassa'], qr: false }, rechten: { trainer: ['leden', 'geheim'] } }, ONDERDELEN)
    expect(i.ledenapp).toEqual({ welkom: 'Welkom bij ons', tabsUit: ['lessen'], qr: false })
    expect(i.rechten.trainer).toEqual(['leden'])
    expect(i.rechten.manager).toEqual(standaardRechten().manager)
  })

  it('schrijft terug in dezelfde vorm', () => {
    const i = orgInstellingenUitRij({ ledenapp: { welkom: 'Hoi', tabs_uit: ['schema'], qr: true } }, ONDERDELEN)
    expect(orgInstellingenUitRij(orgInstellingenNaarJson(i), ONDERDELEN)).toEqual(i)
  })

  it('accepteert een geldige wijziging en weigert onzin', () => {
    const huidig = orgInstellingenUitRij({}, ONDERDELEN)
    const goed = leesOrgInstellingenInvoer({ ledenapp: { welkom: 'Train slim', tabsUit: ['lessen'], qr: false } }, huidig, ONDERDELEN)
    expect(goed.ok && goed.waarde.ledenapp).toEqual({ welkom: 'Train slim', tabsUit: ['lessen'], qr: false })
    expect(goed.ok && goed.waarde.rechten).toEqual(huidig.rechten)
    expect(leesOrgInstellingenInvoer({ ledenapp: { welkom: 'x'.repeat(161), tabsUit: [], qr: true } }, huidig, ONDERDELEN).ok).toBe(false)
    expect(leesOrgInstellingenInvoer({ rechten: { baas: ['leden'] } }, huidig, ONDERDELEN).ok).toBe(false)
    expect(leesOrgInstellingenInvoer({ rechten: { trainer: ['kassa'] } }, huidig, ONDERDELEN).ok).toBe(false)
    const rechten = leesOrgInstellingenInvoer({ rechten: { trainer: ['leden', 'leden', 'checkin'] } }, huidig, ONDERDELEN)
    expect(rechten.ok && rechten.waarde.rechten.trainer).toEqual(['leden', 'checkin'])
  })
})

describe('onderdelen voor rechten', () => {
  it('heeft dezelfde sleutels als het menu', async () => {
    const { ONDERDELEN } = await import('@/components/club/shell/onderdelen')
    const { ONDERDEEL_SLEUTELS } = await import('./org-instellingen')
    expect([...ONDERDEEL_SLEUTELS].sort()).toEqual(ONDERDELEN.map((o) => o.sleutel).sort())
  })
})
