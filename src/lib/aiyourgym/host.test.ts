import { describe, expect, it } from 'vitest'
import { aygDomeinDicht, beslisAyg, beslisAygTaalElders, engelsOmleidUrl, isAygHost, zichtbaarPad } from './host'
import { GERESERVEERD } from '@/lib/club/kern/subdomein'
import { beslisClub, slugUitHost } from '@/lib/club/kern/subdomein'
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
  it('laat de eigen API, het voorvoegsel en vaste bestanden door', () => {
    expect(beslisAyg('aiyourgym.com', '/api/aiyourgym/checkout', true)).toEqual({ soort: 'door' })
    expect(beslisAyg('aiyourgym.com', '/aiyourgym/voorwaarden', true)).toEqual({ soort: 'door', publiek: '/voorwaarden' })
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
    expect(beslisAyg('aiyourgym.com', '/aiyourgym/en', true)).toEqual({ soort: 'engels-omleiden', pad: '/aiyourgym' })
    expect(beslisAyg('aiyourgym.com', '/aiyourgym/en/prijzen', true)).toEqual({ soort: 'engels-omleiden', pad: '/aiyourgym/prijzen' })
  })
  it('geen enkele pagina wordt naar een Engels pad herschreven', () => {
    for (const pad of ['/', '/functies', '/prijzen', '/aiyourgym/functies']) {
      expect(JSON.stringify(beslisAyg('aiyourgym.com', pad, true))).not.toMatch(/\/en(\/|"|$)/)
    }
  })
  it('lijkende paden zijn geen Engels', () => {
    expect(beslisAyg('aiyourgym.com', '/english', true)).toEqual({ soort: 'herschrijven', pad: '/aiyourgym/english', publiek: '/english' })
    expect(beslisAyg('aiyourgym.com', '/aiyourgym/enquete', true)).toEqual({ soort: 'door', publiek: '/enquete' })
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
