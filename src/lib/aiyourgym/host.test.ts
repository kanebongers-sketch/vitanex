import { describe, expect, it } from 'vitest'
import { aygDomeinDicht, beslisAyg, beslisAygTaalElders, isAygHost, zichtbaarPad } from './host'
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
    expect(beslisAyg('aiyourgym.com', '/', true)).toEqual({ soort: 'herschrijven', pad: '/aiyourgym', site: { taal: 'nl', publiek: '/' } })
    expect(beslisAyg('www.aiyourgym.com', '/aanmelden', true)).toEqual({
      soort: 'herschrijven',
      pad: '/aiyourgym/aanmelden',
      site: { taal: 'nl', publiek: '/aanmelden' },
    })
  })
  it('laat de eigen API, het voorvoegsel en vaste bestanden door', () => {
    expect(beslisAyg('aiyourgym.com', '/api/aiyourgym/checkout', true)).toEqual({ soort: 'door' })
    expect(beslisAyg('aiyourgym.com', '/aiyourgym/voorwaarden', true)).toEqual({ soort: 'door', site: { taal: 'nl', publiek: '/voorwaarden' } })
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

describe('Engels op aiyourgym.com (/en)', () => {
  it('/en is de Engelse voorpagina', () => {
    expect(beslisAyg('aiyourgym.com', '/en', true)).toEqual({ soort: 'herschrijven', pad: '/aiyourgym', site: { taal: 'en', publiek: '/' } })
    expect(beslisAyg('aiyourgym.com', '/en/', true)).toEqual({ soort: 'herschrijven', pad: '/aiyourgym', site: { taal: 'en', publiek: '/' } })
  })
  it('/en/... is dezelfde route in het Engels', () => {
    expect(beslisAyg('aiyourgym.com', '/en/functies', true)).toEqual({
      soort: 'herschrijven',
      pad: '/aiyourgym/functies',
      site: { taal: 'en', publiek: '/functies' },
    })
    expect(beslisAyg('www.aiyourgym.com', '/en/voor-wie', true)).toMatchObject({ pad: '/aiyourgym/voor-wie', site: { taal: 'en' } })
  })
  it('de interne Engelse links (/aiyourgym/en/...) werken ook', () => {
    expect(beslisAyg('aiyourgym.com', '/aiyourgym/en', true)).toEqual({ soort: 'herschrijven', pad: '/aiyourgym', site: { taal: 'en', publiek: '/' } })
    expect(beslisAyg('aiyourgym.com', '/aiyourgym/en/prijzen', true)).toEqual({
      soort: 'herschrijven',
      pad: '/aiyourgym/prijzen',
      site: { taal: 'en', publiek: '/prijzen' },
    })
  })
  it('lijkende paden zijn geen Engels', () => {
    expect(beslisAyg('aiyourgym.com', '/english', true)).toMatchObject({ pad: '/aiyourgym/english', site: { taal: 'nl' } })
    expect(beslisAyg('aiyourgym.com', '/aiyourgym/enquete', true)).toEqual({ soort: 'door', site: { taal: 'nl', publiek: '/enquete' } })
    expect(beslisAyg('aiyourgym.com', '/EN/functies', true)).toMatchObject({ site: { taal: 'nl' } })
  })
  it('Club, API en vaste bestanden krijgen geen taal en blijven door', () => {
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
})

describe('beslisAygTaalElders (fitfactorypt.nl/aiyourgym/en)', () => {
  it('herschrijft de Engelse websitepaden', () => {
    expect(beslisAygTaalElders('/aiyourgym/en')).toEqual({ pad: '/aiyourgym', site: { taal: 'en', publiek: '/' } })
    expect(beslisAygTaalElders('/aiyourgym/en/functies')).toEqual({ pad: '/aiyourgym/functies', site: { taal: 'en', publiek: '/functies' } })
  })
  it('laat Nederlands en andere paden met rust', () => {
    expect(beslisAygTaalElders('/aiyourgym/functies')).toBeNull()
    expect(beslisAygTaalElders('/aiyourgym')).toBeNull()
    expect(beslisAygTaalElders('/en/functies')).toBeNull()
    expect(beslisAygTaalElders('/lifeoskane')).toBeNull()
    expect(beslisAygTaalElders('/aiyourgymen')).toBeNull()
  })
})
