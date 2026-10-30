import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { standaardRechten } from '@/lib/club/kern/org-instellingen'
import { ONDERDELEN } from '@/components/club/shell/onderdelen'
import { apiOnderdeel, magApi, magBeheerdersBeheren, magOnderdeel, toegestaneOnderdelen } from './rechten'

const KANE = { isPlatformEigenaar: true, rol: 'beheerder' } as const
const EIGENAAR = { isPlatformEigenaar: false, rol: 'eigenaar' } as const
const MANAGER = { isPlatformEigenaar: false, rol: 'clubmanager' } as const

describe('wie beheert beheerders en het adres', () => {
  it('Kane en de eigenaar wel, de clubmanager niet', () => {
    expect(magBeheerdersBeheren(KANE)).toBe(true)
    expect(magBeheerdersBeheren(EIGENAAR)).toBe(true)
    expect(magBeheerdersBeheren(MANAGER)).toBe(false)
  })
})

describe('toegestaneOnderdelen', () => {
  const rechten = { ...standaardRechten(), manager: ['leden', 'rooster'] }
  it('Kane en de eigenaar: alles', () => {
    expect(toegestaneOnderdelen(KANE, rechten)).toBeNull()
    expect(toegestaneOnderdelen(EIGENAAR, rechten)).toBeNull()
  })
  it('beheer en huisstijl nooit voor een clubmanager, ook niet als ze opgeslagen zijn', () => {
    const t = toegestaneOnderdelen(MANAGER, { ...standaardRechten(), manager: ['leden', 'beheer', 'huisstijl', 'bedrijf', 'sluiting'] })
    expect(t).toEqual(['vandaag', 'leden'])
  })
  it('clubmanager: de rechten van de rol Clubmanager, altijd met Vandaag', () => {
    const t = toegestaneOnderdelen(MANAGER, rechten)
    expect(t).toEqual(['vandaag', 'leden', 'rooster'])
    expect(magOnderdeel(t, 'leden')).toBe(true)
    expect(magOnderdeel(t, 'cijfers')).toBe(false)
    expect(magOnderdeel(t, 'huisstijl')).toBe(false)
  })
})

describe('apiOnderdeel', () => {
  it('koppelt API-paden aan onderdelen die echt bestaan', () => {
    const sleutels = new Set(ONDERDELEN.map((o) => o.sleutel))
    for (const pad of ['/api/club/leden/1', '/api/club/berichten', '/api/club/bedrijf', '/api/club/sluiting', '/api/club/kladblok', '/api/club/training/schemas', '/api/club/vestigingen', '/api/club/organisatie', '/api/club/organisatie/instellingen']) {
      const sleutel = apiOnderdeel(pad)
      expect(sleutel, pad).not.toBeNull()
      expect(sleutels.has(sleutel ?? '')).toBe(true)
    }
    expect(apiOnderdeel('/api/club/kladblok')).toBe('notities')
    expect(apiOnderdeel('/api/club/training/x')).toBe('schemas')
    expect(apiOnderdeel('/api/club/voortgang/1')).toBe('leden')
    expect(apiOnderdeel('/api/club/berichten')).toBe('berichten')
    expect(apiOnderdeel('/api/club/sluiting/feestdagen')).toBe('sluiting')
    expect(apiOnderdeel('/api/club/bedrijf')).toBe('bedrijf')
  })
  it('beheerders, adres, wisselen en nieuwe sportschool horen bij geen onderdeel', () => {
    for (const pad of ['/api/club/beheerders', '/api/club/organisatie/adres', '/api/club/organisatie/wissel', '/api/club/organisatie/nieuw', '/api/club/onbekend']) {
      expect(apiOnderdeel(pad), pad).toBeNull()
    }
  })
})

describe('magApi', () => {
  const manager = ['vandaag', 'leden']
  it('alles mag bij null (Kane, eigenaar)', () => {
    expect(magApi(null, '/api/club/beheerders', 'POST')).toBe(true)
  })
  it('clubmanager: alleen eigen onderdelen, onbekend is dicht', () => {
    expect(magApi(manager, '/api/club/leden/123', 'PATCH')).toBe(true)
    expect(magApi(manager, '/api/club/rooster', 'GET')).toBe(false)
    expect(magApi(manager, '/api/club/beheerders', 'POST')).toBe(false)
    expect(magApi(manager, '/api/club/organisatie/adres', 'PATCH')).toBe(false)
    expect(magApi(manager, '/api/club/organisatie/instellingen', 'PATCH')).toBe(false)
    expect(magApi(manager, '/api/club/iets-nieuws', 'GET')).toBe(false)
    expect(magApi(manager, '/api/club/sluiting', 'POST')).toBe(false)
    expect(magApi(manager, '/api/club/voortgang', 'POST')).toBe(true)
  })
  it('het logo ophalen mag altijd (de balk toont het), uploaden niet', () => {
    expect(magApi(manager, '/api/club/organisatie/logo', 'GET')).toBe(true)
    expect(magApi(manager, '/api/club/organisatie/logo', 'POST')).toBe(false)
  })
})

describe('elke API-map onder /api/club hoort bij een onderdeel', () => {
  // Bewust zonder onderdeel (dus dicht voor een clubmanager via magApi, of buiten vereisClubToegang):
  const BEWUST_ZONDER: Record<string, string> = {
    beheerders: 'alleen Kane en de eigenaar (vereisBeheerdersBeheer)',
    inloggen: 'voor het inloggen, nog geen sessie',
    uitloggen: 'sessie beeindigen, geen onderdeel',
    ledenapp: 'icoon en manifest van de PWA, openbaar',
    lid: 'ledenapp, eigen sessie (ledenlogin/toegang.ts)',
    platform: 'alleen Kane (vereisPlatformEigenaar)',
    organisatie: 'eigen tabel ORGANISATIE_ONDERDEEL',
    profielfoto: "eigen foto en foto's tonen voor iedereen die binnen is; eigen controle in de route",
    uitleg: 'eerste-keer-uitleg wegklikken voor het eigen profiel, voor iedereen die binnen is (migratie 476)',
  }
  const mappen = readdirSync(join(process.cwd(), 'src/app/(aiyourgym)/api/club'), { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)

  it('staat in API_ONDERDEEL of is bewust uitgezonderd', () => {
    const sleutels = new Set(ONDERDELEN.map((o) => o.sleutel))
    for (const map of mappen) {
      if (map in BEWUST_ZONDER) continue
      const sleutel = apiOnderdeel(`/api/club/${map}`)
      expect(sleutel, `/api/club/${map} mist in API_ONDERDEEL (rechten.ts)`).not.toBeNull()
      expect(sleutels.has(sleutel ?? ''), `/api/club/${map} wijst naar onbekend onderdeel ${sleutel}`).toBe(true)
    }
  })
  it('de uitzonderingen bestaan nog', () => {
    for (const map of Object.keys(BEWUST_ZONDER)) expect(mappen, map).toContain(map)
  })
})

describe('betalen: plannen en kortingen horen bij Lidmaatschappen', () => {
  it('plannen en kortingen onder lidmaatschappen, de rest van betalen onder beheer', () => {
    expect(apiOnderdeel('/api/club/betalen/plannen')).toBe('lidmaatschappen')
    expect(apiOnderdeel('/api/club/betalen/plannen/abc/prijzen?vanaf=2026-12-01')).toBe('lidmaatschappen')
    expect(apiOnderdeel('/api/club/betalen/kortingen/gezinnen/abc')).toBe('lidmaatschappen')
    expect(apiOnderdeel('/api/club/betalen/connect')).toBe('beheer')
    expect(apiOnderdeel('/api/club/betalen/lidgeld')).toBe('beheer')
    expect(apiOnderdeel('/api/club/betalen')).toBe('beheer')
  })
  it('een clubmanager komt er nooit bij, ook niet met het recht in zijn lijst', () => {
    const manager = toegestaneOnderdelen(MANAGER, { ...standaardRechten(), manager: ['lidmaatschappen', 'beheer', 'leden'] })
    expect(magApi(manager, '/api/club/betalen/plannen', 'POST')).toBe(false)
    expect(magApi(manager, '/api/club/betalen/kortingen', 'POST')).toBe(false)
    expect(magApi(null, '/api/club/betalen/plannen', 'POST')).toBe(true)
  })
})
