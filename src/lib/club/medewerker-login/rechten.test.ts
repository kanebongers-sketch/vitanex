import { describe, expect, it } from 'vitest'
import { standaardRechten, orgInstellingenUitRij, ONDERDEEL_SLEUTELS } from '@/lib/club/kern/org-instellingen'
import { apiOnderdeel, magApi, magBeheerdersBeheren, toegestaneOnderdelen } from '@/lib/club/beheerders/rechten'
import type { Organisatie } from '@/lib/club/kern/organisatie'
import type { VestigingInfo } from '@/lib/club/kern/vestigingen'
import { magApiAlsMedewerker, magMedewerkerLoginsBeheren, medewerkerOnderdelen, medewerkerVestigingen } from './rechten'
import { medewerkerToegangVelden } from './toegang-velden'
import type { MedewerkerMetOrg, MedewerkerToegang } from './medewerker-login'

const GYM = 'de000000-0000-4000-8000-0000000000c1'
const KANE = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const MW = '33333333-3333-4333-8333-333333333333'

const VESTIGINGEN: VestigingInfo[] = [
  { sleutel: 'budel', naam: 'Budel', standaard: true },
  { sleutel: 'eersel', naam: 'Eersel', standaard: false },
  { sleutel: 'valkenswaard', naam: 'Valkenswaard', standaard: false },
]

describe('medewerkerOnderdelen: rechten per rol', () => {
  it('een rol: zijn rechten, altijd met Vandaag', () => {
    const r = { ...standaardRechten(), administratie: ['personeel'] }
    expect(medewerkerOnderdelen(['administratie'], r)).toEqual(['vandaag', 'personeel'])
  })
  it('meer rollen: de vereniging, zonder dubbelen', () => {
    const r = { ...standaardRechten(), instructeur: ['rooster', 'personeel'], administratie: ['personeel', 'rapporten'] }
    expect(medewerkerOnderdelen(['instructeur', 'administratie'], r)).toEqual(['vandaag', 'rooster', 'personeel', 'rapporten'])
  })
  it('nooit beheer, huisstijl, bedrijf, sluiting of lidmaatschappen, ook als de eigenaar het aanvinkt', () => {
    const r = { ...standaardRechten(), manager: ['leden', 'beheer', 'huisstijl', 'bedrijf', 'sluiting', 'lidmaatschappen'] }
    expect(medewerkerOnderdelen(['manager'], r)).toEqual(['vandaag', 'leden'])
  })
  it('volgt wat de eigenaar per sportschool instelt', () => {
    const { rechten } = orgInstellingenUitRij({ rechten: { trainer: ['leden'] } }, ONDERDEEL_SLEUTELS)
    expect(medewerkerOnderdelen(['trainer'], rechten)).toEqual(['vandaag', 'leden'])
  })
})

describe('medewerkerVestigingen', () => {
  it('alleen de eigen vestigingen, in de vaste volgorde van de sportschool', () => {
    expect(medewerkerVestigingen(VESTIGINGEN, ['valkenswaard', 'budel']).map((v) => v.sleutel)).toEqual(['budel', 'valkenswaard'])
  })
  it('een vestiging die niet (meer) bestaat telt niet', () => {
    expect(medewerkerVestigingen(VESTIGINGEN, ['weg'])).toEqual([])
  })
})

describe('API voor een medewerker', () => {
  it('vestigingen alleen lezen, nooit wijzigen', () => {
    expect(magApiAlsMedewerker('/api/club/vestigingen', 'GET')).toBe(true)
    expect(magApiAlsMedewerker('/api/club/vestigingen', 'POST')).toBe(false)
    expect(magApiAlsMedewerker('/api/club/vestigingen/budel', 'PATCH')).toBe(false)
  })
  it('inloglinks, beheerders en sportscholen: altijd dicht', () => {
    expect(magApiAlsMedewerker(`/api/club/medewerker-toegang/${MW}`, 'PATCH')).toBe(false)
    expect(magApiAlsMedewerker('/api/club/beheerders', 'POST')).toBe(false)
    expect(magApiAlsMedewerker('/api/club/organisatie/wissel', 'POST')).toBe(false)
  })
  it('de rest volgt gewoon de rechten', () => {
    expect(magApiAlsMedewerker('/api/club/leden', 'POST')).toBe(true)
    expect(magApi(['vandaag', 'rooster'], '/api/club/rooster', 'POST')).toBe(true)
    expect(magApi(['vandaag', 'rooster'], '/api/club/leden', 'GET')).toBe(false)
  })
  it('de inloglink-API hoort bij Instellingen', () => {
    expect(apiOnderdeel(`/api/club/medewerker-toegang/${MW}`)).toBe('instellingen')
  })
})

describe('wie beheert wat', () => {
  it('inloglinks: Kane, eigenaar en clubmanager; een medewerker nooit', () => {
    expect(magMedewerkerLoginsBeheren({ isPlatformEigenaar: true, rol: 'beheerder' })).toBe(true)
    expect(magMedewerkerLoginsBeheren({ isPlatformEigenaar: false, rol: 'eigenaar' })).toBe(true)
    expect(magMedewerkerLoginsBeheren({ isPlatformEigenaar: false, rol: 'clubmanager' })).toBe(true)
    expect(magMedewerkerLoginsBeheren({ isPlatformEigenaar: false, rol: 'medewerker' })).toBe(false)
  })
  it('een medewerker beheert geen beheerders en krijgt via de oude weg niets extra', () => {
    expect(magBeheerdersBeheren({ isPlatformEigenaar: false, rol: 'medewerker' })).toBe(false)
    expect(toegestaneOnderdelen({ isPlatformEigenaar: false, rol: 'medewerker' }, standaardRechten())).toEqual(['vandaag'])
  })
})

describe('medewerkerToegangVelden', () => {
  const org = { id: GYM, naam: 'Gym A', instellingen: orgInstellingenUitRij({ rechten: { trainer: ['leden', 'rooster', 'beheer'] } }, ONDERDEEL_SLEUTELS) } as Organisatie
  const toegang: MedewerkerToegang = { id: '44444444-4444-4444-8444-444444444444', userId: GYM, medewerkerId: MW, code: 'abcdefghijklmnopqrstuvwx', actief: true, pinStatus: 'actief', pinHash: 'x', mislukt: 0, geblokkeerdTot: null, blokkades: 0, laatstIngelogdOp: null }
  const mens: MedewerkerMetOrg = { id: MW, userId: GYM, naam: 'Lotte de Vries', email: null, rollen: ['trainer'], vestigingen: ['eersel'], actief: true }
  const bron = { toegang, medewerker: mens, organisatie: org, eigenaarId: KANE, vestigingen: VESTIGINGEN }

  it('een sportschool, eigen vestigingen, rechten van de rol en de volle naam voor het logboek', () => {
    const v = medewerkerToegangVelden(bron)
    expect(v).toMatchObject({ userId: GYM, rol: 'medewerker', isPlatformEigenaar: false, persoonId: MW, naam: 'Lotte de Vries', code: null, beheerderId: KANE })
    expect(v?.organisaties.map((o) => o.id)).toEqual([GYM])
    expect(v?.vestigingen.map((x) => x.sleutel)).toEqual(['eersel'])
    expect(v?.onderdelen).toEqual(['vandaag', 'leden', 'rooster'])
  })
  it('organisatie past niet bij de link of ontbreekt: null', () => {
    expect(medewerkerToegangVelden({ ...bron, organisatie: { ...org, id: KANE } })).toBeNull()
    expect(medewerkerToegangVelden({ ...bron, organisatie: null })).toBeNull()
    expect(medewerkerToegangVelden({ ...bron, eigenaarId: null })).toBeNull()
  })
  it('zonder eigen vestiging, uit dienst of met een pin die wacht: null', () => {
    expect(medewerkerToegangVelden({ ...bron, medewerker: { ...mens, vestigingen: ['weg'] } })).toBeNull()
    expect(medewerkerToegangVelden({ ...bron, medewerker: { ...mens, actief: false } })).toBeNull()
    expect(medewerkerToegangVelden({ ...bron, toegang: { ...toegang, pinStatus: 'wacht' } })).toBeNull()
  })
})
