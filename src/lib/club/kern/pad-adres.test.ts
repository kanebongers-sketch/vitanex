import { describe, expect, it } from 'vitest'
import { beslisClubPad, kiesAdres, kiesOrganisatie, splitsSlugPad, subdomeinUrl, type AdresBron, type VerzoekAdres } from './pad-adres'

const BESTAAT = new Set(['budel', 'limitless', 'fitfactory'])
const bestaat = (slug: string): boolean => BESTAAT.has(slug)

describe('adres als pad: aiyourgym.com/<slug>', () => {
  it('splitst het eerste deel af als het een vrije slug kan zijn', () => {
    expect(splitsSlugPad('/budel')).toEqual({ slug: 'budel', rest: '' })
    expect(splitsSlugPad('/budel/')).toEqual({ slug: 'budel', rest: '/' })
    expect(splitsSlugPad('/budel/leden/123')).toEqual({ slug: 'budel', rest: '/leden/123' })
    for (const pad of ['/', '', 'budel', '/Budel', '/ab', '/-gym', '/gym--x', '/prijzen', '/club', '/mijn', '/inloggen', '/api', '/aiyourgym', '/clubinloggen', '/widget', '/favicon.ico', '/_next']) {
      expect(splitsSlugPad(pad)).toBeNull()
    }
  })

  it('herschrijft de omgeving zoals op het subdomein', () => {
    expect(beslisClubPad('/budel', false, bestaat)).toEqual({ soort: 'herschrijven', slug: 'budel', pad: '/club' })
    expect(beslisClubPad('/budel/', false, bestaat)).toEqual({ soort: 'herschrijven', slug: 'budel', pad: '/club' })
    expect(beslisClubPad('/budel/leden', false, bestaat)).toEqual({ soort: 'herschrijven', slug: 'budel', pad: '/club/leden' })
    expect(beslisClubPad('/budel/club/rooster', false, bestaat)).toEqual({ soort: 'herschrijven', slug: 'budel', pad: '/club/rooster' })
    expect(beslisClubPad('/budel/mijn', false, bestaat)).toEqual({ soort: 'herschrijven', slug: 'budel', pad: '/mijn' })
    expect(beslisClubPad('/budel/mijn/start/abc', false, bestaat)).toEqual({ soort: 'herschrijven', slug: 'budel', pad: '/mijn/start/abc' })
    expect(beslisClubPad('/budel/inloggen', false, bestaat)).toEqual({ soort: 'herschrijven', slug: 'budel', pad: '/aiyourgym/inloggen' })
    expect(beslisClubPad('/budel/clubinloggen/abc', false, bestaat)).toEqual({ soort: 'herschrijven', slug: 'budel', pad: '/clubinloggen/abc' })
    expect(beslisClubPad('/budel/api/club/leden', false, bestaat)).toEqual({ soort: 'herschrijven', slug: 'budel', pad: '/api/club/leden' })
    expect(beslisClubPad('/budel/club-app/sw.js', false, bestaat)).toEqual({ soort: 'herschrijven', slug: 'budel', pad: '/club-app/sw.js' })
  })

  it('laat bestaande paden en websitepagina\'s voorgaan', () => {
    const paden = ['/', '/club', '/club/leden', '/mijn', '/mijn/inloggen', '/inloggen', '/clubinloggen/abc', '/api/club/leden', '/prijzen', '/functies', '/aanmelden', '/voor-wie', '/aiyourgym/prijzen', '/club-app/sw.js', '/widget/a/b']
    for (const pad of paden) {
      expect(beslisClubPad(pad, false, () => true)).toEqual({ soort: 'niet-van-mij' })
    }
  })

  it('een onbekende slug is niet van Club (dan de 404 van de website)', () => {
    expect(beslisClubPad('/onbekend', false, bestaat)).toEqual({ soort: 'niet-van-mij' })
    expect(beslisClubPad('/onbekend/leden', false, bestaat)).toEqual({ soort: 'niet-van-mij' })
  })

  it('stuurt met subdomeinen aan door naar het subdomein', () => {
    expect(beslisClubPad('/budel/leden', true, bestaat)).toEqual({ soort: 'omleiden', slug: 'budel', rest: '/leden' })
    expect(beslisClubPad('/budel', true, bestaat)).toEqual({ soort: 'omleiden', slug: 'budel', rest: '/' })
    expect(subdomeinUrl('budel', '/leden', '?a=1', 'aiyourgym.com')).toBe('https://budel.aiyourgym.com/leden?a=1')
    expect(subdomeinUrl('budel', '/', '', 'aiyourgym.localhost:3000')).toBe('http://budel.club.localhost:3000/')
  })
})

describe('welke sportschool het adres noemt', () => {
  const bron = (b: Partial<AdresBron>): AdresBron => ({ subdomein: null, subdomeinenAan: false, websiteHost: true, kop: null, cookie: null, ...b })

  it('het pad is hard, de cookie zacht', () => {
    expect(kiesAdres(bron({ kop: 'budel' }))).toEqual({ slug: 'budel', vast: true })
    expect(kiesAdres(bron({ kop: 'budel', cookie: 'limitless' }))).toEqual({ slug: 'budel', vast: true })
    expect(kiesAdres(bron({ cookie: 'limitless' }))).toEqual({ slug: 'limitless', vast: false })
    expect(kiesAdres(bron({}))).toBeNull()
  })

  it('negeert onzin, andere hosts en met subdomeinen aan het pad', () => {
    expect(kiesAdres(bron({ kop: 'Budel', cookie: '../x' }))).toBeNull()
    expect(kiesAdres(bron({ kop: 'prijzen' }))).toBeNull()
    expect(kiesAdres(bron({ websiteHost: false, kop: 'budel', cookie: 'budel' }))).toBeNull()
    expect(kiesAdres(bron({ subdomeinenAan: true, kop: 'budel', cookie: 'budel' }))).toBeNull()
    expect(kiesAdres(bron({ subdomeinenAan: true, subdomein: 'budel' }))).toEqual({ slug: 'budel', vast: true })
  })
})

describe('toegang per sportschool', () => {
  const budel = { id: 'b', slug: 'budel' }
  const limitless = { id: 'l', slug: 'limitless' }
  const zonderSlug = { id: 'z', slug: null }
  const vast = (slug: string): VerzoekAdres => ({ slug, vast: true })
  const zacht = (slug: string): VerzoekAdres => ({ slug, vast: false })

  it('een sessie van een eigenaar, clubmanager, medewerker of lid komt nooit bij een andere sportschool', () => {
    expect(kiesOrganisatie([budel], vast('budel'), 'vast')).toBe(budel)
    expect(kiesOrganisatie([budel], vast('limitless'), 'vast')).toBeNull()
    expect(kiesOrganisatie([zonderSlug], vast('budel'), 'vast')).toBeNull()
    // De cookie telt voor een sessie niet: Club blijft bij de eigen sportschool.
    expect(kiesOrganisatie([budel], zacht('limitless'), 'vast')).toBeUndefined()
    expect(kiesOrganisatie([budel], null, 'vast')).toBeUndefined()
  })

  it('het master account opent de sportschool van het pad en kiest met de cookie', () => {
    expect(kiesOrganisatie([budel, limitless], vast('limitless'), 'voorkeur')).toBe(limitless)
    expect(kiesOrganisatie([budel, limitless], zacht('limitless'), 'voorkeur')).toBe(limitless)
    expect(kiesOrganisatie([budel], vast('onbekend'), 'voorkeur')).toBeNull()
    expect(kiesOrganisatie([budel], zacht('onbekend'), 'voorkeur')).toBeUndefined()
  })

  it('inloggen kan alleen met een account van de sportschool van het adres', () => {
    expect(kiesOrganisatie([budel], vast('budel'), 'streng')).toBe(budel)
    expect(kiesOrganisatie([budel], zacht('budel'), 'streng')).toBe(budel)
    expect(kiesOrganisatie([budel], vast('limitless'), 'streng')).toBeNull()
    expect(kiesOrganisatie([budel], zacht('limitless'), 'streng')).toBeNull()
    expect(kiesOrganisatie([budel], null, 'streng')).toBeUndefined()
  })
})
