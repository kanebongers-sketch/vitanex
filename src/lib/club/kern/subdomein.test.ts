import { describe, expect, it } from 'vitest'
import { adresVan, beslisClub, leesSlug, slugUitHost, slugVoorstel } from './subdomein'

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
    expect(adresVan('gym')).toBe('gym.aiyourgym.com')
  })

  it('doet niets met de schakelaar uit', () => {
    expect(beslisClub('fitfactory.aiyourgym.com', '/leden', false)).toEqual({ soort: 'niet-van-mij' })
  })

  it('herschrijft op een subdomein naar /clubkane en laat bestaande paden door', () => {
    expect(beslisClub('gym.aiyourgym.com', '/', true)).toEqual({ soort: 'herschrijven', slug: 'gym', pad: '/clubkane' })
    expect(beslisClub('gym.aiyourgym.com', '/leden', true)).toEqual({ soort: 'herschrijven', slug: 'gym', pad: '/clubkane/leden' })
    expect(beslisClub('gym.aiyourgym.com', '/clubkane/leden', true)).toEqual({ soort: 'door', slug: 'gym' })
    expect(beslisClub('gym.aiyourgym.com', '/api/club/leden', true)).toEqual({ soort: 'door', slug: 'gym' })
    expect(beslisClub('gym.aiyourgym.com', '/clubinloggen/abcdefghijklmnopqrstuvwx', true)).toEqual({ soort: 'door', slug: 'gym' })
    expect(beslisClub('fitfactorypt.nl', '/leden', true)).toEqual({ soort: 'niet-van-mij' })
  })
})
