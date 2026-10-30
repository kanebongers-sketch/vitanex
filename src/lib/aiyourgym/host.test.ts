import { describe, expect, it } from 'vitest'
import { aygDomeinDicht, beslisAyg, beslisAygElders, beslisAygTaalElders, engelsOmleidUrl, isAygHost, omleidUrl, zichtbaarPad, zonderPrefix } from './host'
import { GERESERVEERD } from '@/lib/club/kern/subdomein'
import { beslisClub, clubDoelPad, slugUitHost } from '@/lib/club/kern/subdomein'
import { isReleaseVHost } from '@/releasev/lib/host-routing'

describe('isAygHost', () => {
  it('kent de website, ook met poort en hoofdletters', () => {
    expect(isAygHost('aiyourgym.com')).toBe(true)
    expect(isAygHost('WWW.AIYOURGYM.COM:443')).toBe(true)
    expect(isAygHost('aiyourgym.localhost:3000')).toBe(true)
  })
  it('een sportschool, een ander domein of niets is niet van de website', () => {
    expect(isAygHost('fitfactory.aiyourgym.com')).toBe(false)
    expect(isAygHost('aiyourgym.com.evil.nl')).toBe(false)
    expect(isAygHost('fitfactorypt.nl')).toBe(false)
    expect(isAygHost(null)).toBe(false)
  })
})

describe('beslisAyg', () => {
  it('met de schakelaar uit verandert er niets', () => {
    expect(beslisAyg('aiyourgym.com', '/', false)).toEqual({ soort: 'niet-van-mij' })
  })
  it('herschrijft pagina naar /aiyourgym', () => {
    expect(beslisAyg('aiyourgym.com', '/', true)).toEqual({ soort: 'herschrijven', pad: '/aiyourgym', publiek: '/' })
    expect(beslisAyg('www.aiyourgym.com', '/aanmelden', true)).toEqual({
      soort: 'herschrijven',
      pad: '/aiyourgym/aanmelden',
      publiek: '/aanmelden',
    })
  })
  it('laat de eigen API en vaste bestanden door', () => {
    expect(beslisAyg('aiyourgym.com', '/api/aiyourgym/checkout', true)).toEqual({ soort: 'door' })
    expect(beslisAyg('aiyourgym.com', '/robots.txt', true)).toEqual({ soort: 'door' })
  })
  it('andere API-paden gaan niet naar de app van Fit Factory', () => {
    expect(beslisAyg('aiyourgym.com', '/api/lifeos/taken', true)).toMatchObject({ soort: 'herschrijven', pad: '/aiyourgym/api/lifeos/taken' })
    expect(beslisAyg('aiyourgym.com', '/api/aiyourgymx', true)).toMatchObject({ soort: 'herschrijven', pad: '/aiyourgym/api/aiyourgymx' })
  })
  it('geen sitemap van de app: /sitemap.xml blijft binnen de website (404 daar)', () => {
    expect(beslisAyg('aiyourgym.com', '/sitemap.xml', true)).toMatchObject({ soort: 'herschrijven', pad: '/aiyourgym/sitemap.xml' })
  })
  it('een subdomein van een sportschool blijft van Club', () => {
    expect(beslisAyg('fitfactory.aiyourgym.com', '/', true)).toEqual({ soort: 'niet-van-mij' })
    expect(beslisClub('fitfactory.aiyourgym.com', '/', true)).toEqual({ soort: 'herschrijven', slug: 'fitfactory', pad: '/club' })
  })
  it('www en de kale website zijn nooit een sportschool, en releasev.nl is niet van ons', () => {
    expect(slugUitHost('www.aiyourgym.com')).toBeNull()
    expect(slugUitHost('aiyourgym.com')).toBeNull()
    expect(beslisClub('www.aiyourgym.com', '/', true)).toEqual({ soort: 'niet-van-mij' })
    expect(beslisAyg('releasev.nl', '/', true)).toEqual({ soort: 'niet-van-mij' })
    expect(isReleaseVHost('aiyourgym.com')).toBe(false)
  })
})

describe('zichtbaarPad', () => {
  it('op aiyourgym.com zonder voorvoegsel', () => {
    expect(zichtbaarPad('aiyourgym.com', '/aiyourgym/welkom', true)).toBe('/welkom')
    expect(zichtbaarPad('aiyourgym.com', '/aiyourgym', true)).toBe('/')
  })
  it('elders met voorvoegsel', () => {
    expect(zichtbaarPad('fitfactorypt.nl', '/aiyourgym/welkom', true)).toBe('/aiyourgym/welkom')
    expect(zichtbaarPad('aiyourgym.com', '/welkom', false)).toBe('/aiyourgym/welkom')
  })
})

describe('aygDomeinDicht', () => {
  it('houdt aiyourgym.com dicht zolang de website uit staat', () => {
    expect(aygDomeinDicht('aiyourgym.com', false, false)).toBe(true)
    expect(aygDomeinDicht('www.aiyourgym.com:443', false, true)).toBe(true)
    expect(aygDomeinDicht('aiyourgym.com', true, false)).toBe(false)
  })
  it('houdt subdomeinen dicht zolang die schakelaar uit staat', () => {
    expect(aygDomeinDicht('budel.aiyourgym.com', true, false)).toBe(true)
    expect(aygDomeinDicht('budel.aiyourgym.com', false, true)).toBe(false)
    expect(aygDomeinDicht('budel.aiyourgym.localhost', false, false)).toBe(true)
  })
  it('laat andere domeinen met rust', () => {
    expect(aygDomeinDicht('fitfactorypt.nl', false, false)).toBe(false)
    expect(aygDomeinDicht('aiyourgym.com.evil.nl', false, false)).toBe(false)
    expect(aygDomeinDicht('notaiyourgym.com', false, false)).toBe(false)
  })
})

describe('Club op aiyourgym.com', () => {
  it('laat Club, inloggen en de ledenapp door', () => {
    for (const pad of ['/club', '/club/leden', '/clubinloggen/platform/abc', '/mijn', '/mijn/start/x', '/api/club/leden', '/api/club-afmelden/t']) {
      expect(beslisAyg('aiyourgym.com', pad, true)).toEqual({ soort: 'door' })
    }
  })
  it('stuurt lijkende paden gewoon naar de website', () => {
    expect(beslisAyg('aiyourgym.com', '/clubs', true)).toMatchObject({ soort: 'herschrijven', pad: '/aiyourgym/clubs' })
    expect(beslisAyg('aiyourgym.com', '/mijnheer', true)).toMatchObject({ soort: 'herschrijven', pad: '/aiyourgym/mijnheer' })
  })
})

describe('oude Engelse links op aiyourgym.com (/en)', () => {
  it('/en wordt een 308 naar dezelfde pagina zonder /en', () => {
    expect(beslisAyg('aiyourgym.com', '/en', true)).toEqual({ soort: 'engels-omleiden', pad: '/' })
    expect(beslisAyg('aiyourgym.com', '/en/', true)).toEqual({ soort: 'engels-omleiden', pad: '/' })
    expect(beslisAyg('aiyourgym.com', '/en/functies', true)).toEqual({ soort: 'engels-omleiden', pad: '/functies' })
    expect(beslisAyg('www.aiyourgym.com', '/en/voor-wie', true)).toEqual({ soort: 'engels-omleiden', pad: '/voor-wie' })
  })
  it('ook de oude interne links (/aiyourgym/en/...)', () => {
    expect(beslisAyg('aiyourgym.com', '/aiyourgym/en', true)).toEqual({ soort: 'engels-omleiden', pad: '/' })
    expect(beslisAyg('aiyourgym.com', '/aiyourgym/en/prijzen', true)).toEqual({ soort: 'engels-omleiden', pad: '/prijzen' })
  })
  it('geen enkele pagina wordt naar een Engels pad herschreven', () => {
    for (const pad of ['/', '/functies', '/prijzen', '/aiyourgym/functies']) {
      expect(JSON.stringify(beslisAyg('aiyourgym.com', pad, true))).not.toMatch(/\/en(\/|"|$)/)
    }
  })
  it('lijkende paden zijn geen Engels', () => {
    expect(beslisAyg('aiyourgym.com', '/english', true)).toEqual({ soort: 'herschrijven', pad: '/aiyourgym/english', publiek: '/english' })
    expect(beslisAyg('aiyourgym.com', '/aiyourgym/enquete', true)).toEqual({ soort: 'omleiden', pad: '/enquete' })
    expect(beslisAyg('aiyourgym.com', '/EN/functies', true)).toMatchObject({ soort: 'herschrijven', pad: '/aiyourgym/EN/functies' })
  })
  it('Club, API en vaste bestanden blijven door', () => {
    for (const pad of ['/club', '/mijn', '/api/aiyourgym/checkout', '/api/club/leden', '/robots.txt', '/favicon.ico']) {
      expect(beslisAyg('aiyourgym.com', pad, true)).toEqual({ soort: 'door' })
    }
  })
  it('met de schakelaar uit of op een ander domein niets', () => {
    expect(beslisAyg('aiyourgym.com', '/en', false)).toEqual({ soort: 'niet-van-mij' })
    expect(beslisAyg('fitfactorypt.nl', '/en/functies', true)).toEqual({ soort: 'niet-van-mij' })
  })
  it('en en nl kunnen nooit het adres van een sportschool zijn', () => {
    expect(GERESERVEERD.has('en')).toBe(true)
    expect(GERESERVEERD.has('nl')).toBe(true)
  })
  it('de 308 blijft op dezelfde host, met de zoekstring', () => {
    expect(engelsOmleidUrl('aiyourgym.com', '/functies', '?pakket=club')).toBe('https://aiyourgym.com/functies?pakket=club')
    expect(engelsOmleidUrl('www.aiyourgym.com', '/', '')).toBe('https://www.aiyourgym.com/')
    expect(engelsOmleidUrl('aiyourgym.localhost:3000', '/prijzen', '')).toBe('http://aiyourgym.localhost:3000/prijzen')
    expect(engelsOmleidUrl('fitfactorypt.nl', '/aiyourgym', '')).toBe('https://fitfactorypt.nl/aiyourgym')
  })
})

describe('beslisAygTaalElders (fitfactorypt.nl/aiyourgym/en)', () => {
  it('stuurt de oude Engelse websitepaden door zonder /en', () => {
    expect(beslisAygTaalElders('/aiyourgym/en')).toEqual({ pad: '/aiyourgym' })
    expect(beslisAygTaalElders('/aiyourgym/en/functies')).toEqual({ pad: '/aiyourgym/functies' })
  })
  it('laat Nederlands en andere paden met rust', () => {
    expect(beslisAygTaalElders('/aiyourgym/functies')).toBeNull()
    expect(beslisAygTaalElders('/aiyourgym')).toBeNull()
    expect(beslisAygTaalElders('/en/functies')).toBeNull()
    expect(beslisAygTaalElders('/lifeoskane')).toBeNull()
    expect(beslisAygTaalElders('/aiyourgymen')).toBeNull()
  })
})

describe('schone adressen op aiyourgym.com (besluit Kane 30-10-2026)', () => {
  it('een oud adres met /aiyourgym wordt een 308 naar het schone adres', () => {
    expect(beslisAyg('aiyourgym.com', '/aiyourgym', true)).toEqual({ soort: 'omleiden', pad: '/' })
    expect(beslisAyg('aiyourgym.com', '/aiyourgym/', true)).toEqual({ soort: 'omleiden', pad: '/' })
    expect(beslisAyg('aiyourgym.com', '/aiyourgym/overstappen', true)).toEqual({ soort: 'omleiden', pad: '/overstappen' })
    expect(beslisAyg('www.aiyourgym.com', '/aiyourgym/prijzen', true)).toEqual({ soort: 'omleiden', pad: '/prijzen' })
    expect(beslisAyg('aiyourgym.com', '/aiyourgym/aiyourgym/aanmelden', true)).toEqual({ soort: 'omleiden', pad: '/aanmelden' })
    expect(beslisAyg('aiyourgym.localhost:3000', '/aiyourgym/inloggen', true)).toEqual({ soort: 'omleiden', pad: '/inloggen' })
  })
  it('geen lus: het schone adres wordt herschreven, nooit omgeleid', () => {
    for (const pad of ['/', '/overstappen', '/prijzen', '/aanmelden', '/inloggen', '/voor-wie']) {
      const besluit = beslisAyg('aiyourgym.com', pad, true)
      expect(besluit.soort).toBe('herschrijven')
      const doel = besluit.soort === 'herschrijven' ? besluit.pad : ''
      expect(zonderPrefix(doel)).toBe(pad)
    }
    for (const pad of ['/aiyourgym/overstappen', '/aiyourgym']) {
      const besluit = beslisAyg('aiyourgym.com', pad, true)
      const doel = besluit.soort === 'omleiden' ? besluit.pad : ''
      expect(beslisAyg('aiyourgym.com', doel, true).soort).toBe('herschrijven')
    }
  })
  it('lijkende paden zijn geen oud adres', () => {
    expect(beslisAyg('aiyourgym.com', '/aiyourgymx', true)).toMatchObject({ soort: 'herschrijven', pad: '/aiyourgym/aiyourgymx' })
  })
  it('bestanden en beelden van Next (og:image, icoon) gaan door zonder omleiding', () => {
    for (const pad of ['/aiyourgym/icon.svg', '/aiyourgym/apple-icon.png', '/aiyourgym/avatars/daan.webp', '/aiyourgym/opengraph-image', '/aiyourgym/opengraph-image-1a2b3c', '/aiyourgym/twitter-image', '/aiyourgym/icon']) {
      expect(beslisAyg('aiyourgym.com', pad, true)).toEqual({ soort: 'door' })
    }
  })
  it('Club houdt zijn eigen paden en het intern herschreven inloggen', () => {
    expect(beslisAyg('aiyourgym.com', '/club/leden', true)).toEqual({ soort: 'door' })
    expect(clubDoelPad('/inloggen')).toBe('/aiyourgym/inloggen')
    expect(GERESERVEERD.has('aiyourgym')).toBe(true)
  })
  it('de 308 houdt host en zoekstring', () => {
    expect(omleidUrl('aiyourgym.com', '/overstappen', '?naam=Kernhal')).toBe('https://aiyourgym.com/overstappen?naam=Kernhal')
    expect(omleidUrl('aiyourgym.localhost:3000', '/', '')).toBe('http://aiyourgym.localhost:3000/')
  })
})

describe('beslisAygElders (de website op andere domeinen)', () => {
  it('met de site aan is /aiyourgym elders een 404', () => {
    expect(beslisAygElders('fitfactorypt.nl', '/aiyourgym', true)).toBe('verbergen')
    expect(beslisAygElders('fitfactorypt.nl', '/aiyourgym/prijzen', true)).toBe('verbergen')
    expect(beslisAygElders('localhost:3000', '/aiyourgym/aanmelden', true)).toBe('verbergen')
  })
  it('met de site uit blijft het de voorvertoning voor Kane', () => {
    expect(beslisAygElders('fitfactorypt.nl', '/aiyourgym/prijzen', false)).toBeNull()
  })
  it('raakt de website zelf, andere paden, bestanden en de API niet', () => {
    expect(beslisAygElders('aiyourgym.com', '/aiyourgym/prijzen', true)).toBeNull()
    expect(beslisAygElders('fitfactorypt.nl', '/prijzen', true)).toBeNull()
    expect(beslisAygElders('fitfactorypt.nl', '/api/aiyourgym/checkout', true)).toBeNull()
    expect(beslisAygElders('fitfactorypt.nl', '/aiyourgymx', true)).toBeNull()
    expect(beslisAygElders('fitfactorypt.nl', '/aiyourgym/avatars/daan.webp', true)).toBeNull()
  })
})
