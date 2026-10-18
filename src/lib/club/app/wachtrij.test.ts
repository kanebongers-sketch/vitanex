import { describe, expect, it } from 'vitest'
import { WACHTRIJ_MAX, WACHTRIJ_MAX_MS, leesWachtrij, naPoging, uitkomstVan, voegToe, wachttijd, zonder, type WachtendVerzoek } from './wachtrij'

const NU = 1_800_000_000_000
const v = (id: string, deel: Partial<WachtendVerzoek> = {}): WachtendVerzoek => ({ id, url: '/api/club/lid/training', body: { dag: 1 }, gemaakt: NU, pogingen: 0, omschrijving: 'Dag A', ...deel })

describe('wachtrij voor slecht bereik', () => {
  it('bewaart, telt pogingen en haalt weg', () => {
    let rij = voegToe([], v('a'))
    rij = voegToe(rij, v('b'))
    rij = naPoging(rij, 'a')
    expect(rij.map((x) => [x.id, x.pogingen])).toEqual([['a', 1], ['b', 0]])
    expect(zonder(rij, 'a').map((x) => x.id)).toEqual(['b'])
  })

  it('een volle rij laat de oudste vallen', () => {
    let rij: WachtendVerzoek[] = []
    for (let i = 0; i < WACHTRIJ_MAX + 3; i++) rij = voegToe(rij, v(String(i)))
    expect(rij).toHaveLength(WACHTRIJ_MAX)
    expect(rij[0].id).toBe('3')
  })

  it('leest alleen nette verzoeken naar onze eigen API terug', () => {
    const ruw = JSON.stringify([v('a'), { ...v('b'), url: 'https://elders.nl' }, { ...v('c'), gemaakt: NU - WACHTRIJ_MAX_MS - 1 }, null, { ...v('d'), body: [] }])
    expect(leesWachtrij(ruw, NU).map((x) => x.id)).toEqual(['a'])
    expect(leesWachtrij('kapot', NU)).toEqual([])
  })

  it('opnieuw proberen alleen zonder verbinding of bij een storing', () => {
    expect(uitkomstVan(true, 201)).toBe('verstuurd')
    expect(uitkomstVan(false, 0)).toBe('opnieuw')
    expect(uitkomstVan(false, 503)).toBe('opnieuw')
    expect(uitkomstVan(false, 400)).toBe('geweigerd')
    expect(wachttijd(0)).toBe(5000)
    expect(wachttijd(10)).toBe(120_000)
  })
})
