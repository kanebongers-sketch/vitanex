import { describe, expect, it } from 'vitest'
import { aygDomeinDicht, beslisAyg, isAygHost, zichtbaarPad } from './host'
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
    expect(beslisAyg('aiyourgym.com', '/', true)).toEqual({ soort: 'herschrijven', pad: '/aiyourgym' })
    expect(beslisAyg('www.aiyourgym.com', '/aanmelden', true)).toEqual({ soort: 'herschrijven', pad: '/aiyourgym/aanmelden' })
  })
  it('laat de eigen API, het voorvoegsel en vaste bestanden door', () => {
    expect(beslisAyg('aiyourgym.com', '/api/aiyourgym/checkout', true)).toEqual({ soort: 'door' })
    expect(beslisAyg('aiyourgym.com', '/aiyourgym/voorwaarden', true)).toEqual({ soort: 'door' })
    expect(beslisAyg('aiyourgym.com', '/robots.txt', true)).toEqual({ soort: 'door' })
  })
  it('andere API-paden gaan niet naar de app van Fit Factory', () => {
    expect(beslisAyg('aiyourgym.com', '/api/club/leden', true)).toEqual({ soort: 'herschrijven', pad: '/aiyourgym/api/club/leden' })
    expect(beslisAyg('aiyourgym.com', '/api/aiyourgymx', true)).toEqual({ soort: 'herschrijven', pad: '/aiyourgym/api/aiyourgymx' })
  })
  it('een subdomein van een sportschool blijft van Club', () => {
    expect(beslisAyg('fitfactory.aiyourgym.com', '/', true)).toEqual({ soort: 'niet-van-mij' })
    expect(beslisClub('fitfactory.aiyourgym.com', '/', true)).toEqual({ soort: 'herschrijven', slug: 'fitfactory', pad: '/clubkane' })
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
