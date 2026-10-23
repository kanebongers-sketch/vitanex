import { describe, expect, it } from 'vitest'
import { leesCookie, regelUitVerzoek, sportschoolUitHeaders } from './verzoek'

const ORG = '0d3c5e1a-1111-4abc-8def-123456789abc'

describe('leesCookie', () => {
  it('vindt een cookie tussen andere', () => {
    expect(leesCookie(`a=1; club-org=${ORG}; b=2`, 'club-org')).toBe(ORG)
    expect(leesCookie('a=1', 'club-org')).toBeNull()
    expect(leesCookie(null, 'club-org')).toBeNull()
  })
})

describe('sportschoolUitHeaders', () => {
  it('neemt de slug van het subdomein', () => {
    expect(sportschoolUitHeaders({ host: 'testgym.aiyourgym.com' })).toBe('testgym')
  })

  it('neemt anders het id uit club-org, alleen als het een uuid is', () => {
    expect(sportschoolUitHeaders({ host: 'fitfactorypt.nl', cookie: `club-org=${ORG}` })).toBe(ORG)
    expect(sportschoolUitHeaders({ host: 'fitfactorypt.nl', cookie: 'club-org=<script>' })).toBeNull()
    expect(sportschoolUitHeaders({ host: 'fitfactorypt.nl' })).toBeNull()
  })
})

describe('regelUitVerzoek', () => {
  it('gebruikt het routepatroon en de soort van Next', () => {
    const r = regelUitVerzoek(new Error('stuk'), { path: `/leden/${ORG}`, method: 'GET', headers: { host: 'testgym.aiyourgym.com', cookie: 'pt-sessie=geheim' } }, { routePath: '/club/leden/[id]', routeType: 'render' })
    expect(r).toMatchObject({ gebied: 'club', route: '/club/leden/[id]', methode: 'GET', soort: 'render', sportschool: 'testgym', melding: 'stuk' })
    expect(JSON.stringify(r)).not.toContain('geheim')
  })

  it('valt terug op het pad als er geen patroon is', () => {
    const r = regelUitVerzoek(new Error('x'), { path: '/api/aiyourgym/checkout?a=1', method: 'POST', headers: {} }, { routeType: 'route' })
    expect(r).toMatchObject({ gebied: 'aiyourgym', route: '/api/aiyourgym/checkout', soort: 'route' })
  })

  it('slaat fouten buiten Club en AI Your Gym over', () => {
    expect(regelUitVerzoek(new Error('x'), { path: '/lifeoskane', method: 'GET', headers: {} }, { routePath: '/lifeoskane', routeType: 'render' })).toBeNull()
  })

  it('maakt van een onbekende soort een render', () => {
    expect(regelUitVerzoek(new Error('x'), { path: '/mijn', method: 'GET', headers: {} }, { routeType: 'iets' })?.soort).toBe('render')
  })
})

describe('sportschoolUitHeaders met het adres als pad', () => {
  it('neemt de slug uit de kop van de proxy (aiyourgym.com/<slug>)', () => {
    expect(sportschoolUitHeaders({ host: 'aiyourgym.com', 'x-ayg-sportschool': 'budel' })).toBe('budel')
    expect(sportschoolUitHeaders({ host: 'aiyourgym.com', 'x-ayg-sportschool': '<script>' })).toBeNull()
  })
})
