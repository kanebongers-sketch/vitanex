import { describe, expect, it } from 'vitest'
import type { Challenge } from './model'
import { dagenTeGaan, doetMee, groepeer, laatsteDag, statusVan, tijdVerstreken } from './periode'

function maak(over: Partial<Challenge>): Challenge {
  return {
    id: 'x',
    titel: 'Test',
    uitleg: null,
    soort: 'bezoeken',
    doel: 10,
    start: '2026-10-01',
    eind: '2026-10-31',
    vestigingen: [],
    deelname: 'automatisch',
    zichtbaarApp: true,
    ranglijst: false,
    gestoptOp: null,
    demo: false,
    ...over,
  }
}

describe('statusVan', () => {
  it('kent gepland, lopend en afgelopen, met beide grensdagen als lopend', () => {
    const c = maak({})
    expect(statusVan(c, '2026-09-30')).toBe('gepland')
    expect(statusVan(c, '2026-10-01')).toBe('lopend')
    expect(statusVan(c, '2026-10-31')).toBe('lopend')
    expect(statusVan(c, '2026-11-01')).toBe('afgelopen')
  })

  it('een gestopte challenge is afgelopen vanaf de stopdag', () => {
    const c = maak({ gestoptOp: '2026-10-10T10:00:00Z' })
    expect(statusVan(c, '2026-10-09')).toBe('lopend')
    expect(statusVan(c, '2026-10-10')).toBe('afgelopen')
    expect(laatsteDag(c)).toBe('2026-10-10')
  })
})

describe('groepeer', () => {
  it('zet elke challenge in de juiste groep en volgorde', () => {
    // Arrange
    const lijst = [
      maak({ id: 'a', eind: '2026-10-31' }),
      maak({ id: 'b', start: '2026-10-10', eind: '2026-10-20' }),
      maak({ id: 'c', start: '2026-12-01', eind: '2026-12-31' }),
      maak({ id: 'd', start: '2026-11-01', eind: '2026-11-30' }),
      maak({ id: 'e', start: '2026-08-01', eind: '2026-08-31' }),
      maak({ id: 'f', start: '2026-09-01', eind: '2026-09-30' }),
    ]
    // Act
    const g = groepeer(lijst, '2026-10-17')
    // Assert
    expect(g.lopend.map((c) => c.id)).toEqual(['b', 'a'])
    expect(g.gepland.map((c) => c.id)).toEqual(['d', 'c'])
    expect(g.afgelopen.map((c) => c.id)).toEqual(['f', 'e'])
  })
})

describe('tijd', () => {
  it('rekent dagen te gaan inclusief vandaag', () => {
    expect(dagenTeGaan(maak({}), '2026-10-31')).toBe(1)
    expect(dagenTeGaan(maak({}), '2026-10-17')).toBe(15)
    expect(dagenTeGaan(maak({}), '2026-11-05')).toBe(0)
  })

  it('tijdVerstreken loopt van 0 tot 1', () => {
    expect(tijdVerstreken(maak({}), '2026-09-01')).toBe(0)
    expect(tijdVerstreken(maak({}), '2026-12-01')).toBe(1)
    expect(tijdVerstreken(maak({ start: '2026-10-01', eind: '2026-10-10' }), '2026-10-05')).toBe(0.5)
  })
})

describe('doetMee', () => {
  it('volgt de vestiging en bij inschrijven de inschrijving', () => {
    const budel = maak({ vestigingen: ['budel'] })
    expect(doetMee(budel, { vestiging: 'budel' }, false)).toBe(true)
    expect(doetMee(budel, { vestiging: 'eersel' }, true)).toBe(false)
    const inschrijven = maak({ deelname: 'inschrijven' })
    expect(doetMee(inschrijven, { vestiging: 'eersel' }, false)).toBe(false)
    expect(doetMee(inschrijven, { vestiging: 'eersel' }, true)).toBe(true)
  })
})
