import { describe, expect, it } from 'vitest'
import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { GERESERVEERD, SLUG, adresVan, adresVeld, beslisClub, clubDoelPad, leesSlug, slugUitHost, slugVoorstel, sportschoolUrl } from './subdomein'

describe('subdomein per sportschool', () => {
  it('leest een geldige slug en weigert de rest', () => {
    expect(leesSlug(' FitFactory ')).toEqual({ ok: true, slug: 'fitfactory' })
    expect(leesSlug('gym-noord')).toEqual({ ok: true, slug: 'gym-noord' })
    for (const fout of ['ab', '-gym', 'gym-', 'gym--noord', 'gym noord', 'gým', 'x'.repeat(41), 'www', 'admin', 'api', 42]) {
      expect(leesSlug(fout).ok).toBe(false)
    }
  })

  it('stelt een slug voor uit de naam', () => {
    expect(slugVoorstel('Fit Factory')).toBe('fitfactory')
    expect(slugVoorstel('Kracht & Co')).toBe('krachtenco')
    expect(slugVoorstel('Gym Café Zuid')).toBe('gymcafezuid')
    expect(slugVoorstel('X')).toBe('xclub')
  })

  it('haalt de slug uit de host', () => {
    expect(slugUitHost('fitfactory.aiyourgym.com')).toBe('fitfactory')
    expect(slugUitHost('FitFactory.AiYourGym.com:443')).toBe('fitfactory')
    expect(slugUitHost('gym.club.localhost:3000')).toBe('gym')
    expect(slugUitHost('aiyourgym.com')).toBeNull()
    expect(slugUitHost('www.aiyourgym.com')).toBeNull()
    expect(slugUitHost('a.b.aiyourgym.com')).toBeNull()
    expect(slugUitHost('fitfactory.aiyourgym.com.evil.nl')).toBeNull()
    expect(slugUitHost('fitfactorypt.nl')).toBeNull()
    expect(slugUitHost(null)).toBeNull()
  })

  it('doet niets met de schakelaar uit', () => {
    expect(beslisClub('fitfactory.aiyourgym.com', '/leden', false)).toEqual({ soort: 'niet-van-mij' })
  })

  it('herschrijft op een subdomein naar /club en laat bestaande paden door', () => {
    expect(beslisClub('gym.aiyourgym.com', '/', true)).toEqual({ soort: 'herschrijven', slug: 'gym', pad: '/club' })
    expect(beslisClub('gym.aiyourgym.com', '/leden', true)).toEqual({ soort: 'herschrijven', slug: 'gym', pad: '/club/leden' })
    expect(beslisClub('gym.aiyourgym.com', '/club/leden', true)).toEqual({ soort: 'door', slug: 'gym' })
    expect(beslisClub('gym.aiyourgym.com', '/api/club/leden', true)).toEqual({ soort: 'door', slug: 'gym' })
    expect(beslisClub('gym.aiyourgym.com', '/clubinloggen/abcdefghijklmnopqrstuvwx', true)).toEqual({ soort: 'door', slug: 'gym' })
    expect(beslisClub('fitfactorypt.nl', '/leden', true)).toEqual({ soort: 'niet-van-mij' })
  })

  it('inloggen op het eigen subdomein gaat naar de inlogpagina', () => {
    expect(beslisClub('gym.aiyourgym.com', '/inloggen', true)).toEqual({ soort: 'herschrijven', slug: 'gym', pad: '/aiyourgym/inloggen' })
  })

  it('laat de ledenapp en haar bestanden door', () => {
    expect(beslisClub('gym.aiyourgym.com', '/mijn', true)).toEqual({ soort: 'door', slug: 'gym' })
    expect(beslisClub('gym.aiyourgym.com', '/mijn/start/abcdefghijklmnopqrstuvwx', true)).toEqual({ soort: 'door', slug: 'gym' })
    expect(beslisClub('gym.aiyourgym.com', '/club-app/sw.js', true)).toEqual({ soort: 'door', slug: 'gym' })
    expect(beslisClub('gym.aiyourgym.com', '/mijnheer', true)).toEqual({ soort: 'herschrijven', slug: 'gym', pad: '/club/mijnheer' })
  })
})

describe('adres van een sportschool (besluit Kane 23-10-2026)', () => {
  it('is een pad zolang de subdomeinen uit staan, en een subdomein als ze aan staan', () => {
    expect(adresVan('budel', false)).toBe('aiyourgym.com/budel')
    expect(adresVan('budel', true)).toBe('budel.aiyourgym.com')
    expect(sportschoolUrl('budel', false)).toBe('https://aiyourgym.com/budel')
    expect(sportschoolUrl('budel', false, '/mijn')).toBe('https://aiyourgym.com/budel/mijn')
    expect(sportschoolUrl('budel', false, 'mijn')).toBe('https://aiyourgym.com/budel/mijn')
    expect(sportschoolUrl('budel', true, '/clubinloggen/abc')).toBe('https://budel.aiyourgym.com/clubinloggen/abc')
  })

  it('zet aiyourgym.com/ voor het veld, of .aiyourgym.com erachter', () => {
    expect(adresVeld(false)).toEqual({ voor: 'aiyourgym.com/', achter: null })
    expect(adresVeld(true)).toEqual({ voor: null, achter: '.aiyourgym.com' })
  })

  it('kent hetzelfde doel voor elk pad binnen de omgeving', () => {
    expect(clubDoelPad('')).toBe('/club')
    expect(clubDoelPad('/')).toBe('/club')
    expect(clubDoelPad('/leden')).toBe('/club/leden')
    expect(clubDoelPad('/inloggen')).toBe('/aiyourgym/inloggen')
    expect(clubDoelPad('/club/leden')).toBeNull()
    expect(clubDoelPad('/mijn/inloggen')).toBeNull()
    expect(clubDoelPad('/api/club/leden')).toBeNull()
  })
})

describe('gereserveerde namen', () => {
  /** De mappen (het eerste deel van een pad), door route-groepen heen en zonder [..]. Bestanden hebben een extensie en zijn nooit een slug. */
  function namenIn(map: string): string[] {
    const uit: string[] = []
    for (const ding of readdirSync(join(process.cwd(), map), { withFileTypes: true })) {
      if (!ding.isDirectory() || ding.name.startsWith('[')) continue
      if (ding.name.startsWith('(')) uit.push(...namenIn(join(map, ding.name)))
      else uit.push(ding.name)
    }
    return uit
  }

  it('bevat elke pagina van de website, Club, de ledenapp en public/', () => {
    const namen = [
      ...namenIn('src/app/(aiyourgym)/(website)/aiyourgym'),
      ...namenIn('src/app/(aiyourgym)/(club)'),
      ...namenIn('src/app/(aiyourgym)/api'),
      // public/fitfactory heeft alleen beelden en "fitfactory" is de slug van Fit Factory zelf.
      ...namenIn('public').filter((n) => n !== 'fitfactory'),
      'api', 'aiyourgym', 'club',
    ]
    const ontbreekt = namen.filter((n) => SLUG.test(n) && !GERESERVEERD.has(n))
    expect(ontbreekt).toEqual([])
  })

  it('weigert die namen bij het kiezen van een adres (aanmelden, startwizard, huisstijl)', () => {
    for (const naam of ['prijzen', 'functies', 'aanmelden', 'inloggen', 'mijn', 'clubinloggen', 'widget', 'club-app', 'voor-wie', 'demo-aanvragen', 'welkom']) {
      expect(leesSlug(naam)).toEqual({ ok: false, fout: 'Dit adres is gereserveerd. Kies een ander.' })
    }
    expect(leesSlug('budel').ok).toBe(true)
    expect(leesSlug('fitfactory').ok).toBe(true)
  })
})
