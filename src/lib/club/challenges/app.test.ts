import { describe, expect, it } from 'vitest'
import { appChallenge, gehaaldeChallenges, ranglijstVoorApp, sorteerApp, toonInApp } from './app'
import type { Challenge } from './model'
import { ranglijst } from './voortgang'

function maak(over: Partial<Challenge>): Challenge {
  return {
    id: 'c',
    titel: 'Test',
    uitleg: null,
    soort: 'bezoeken',
    doel: 2,
    start: '2026-10-01',
    eind: '2026-10-31',
    vestigingen: ['budel'],
    deelname: 'automatisch',
    zichtbaarApp: true,
    ranglijst: true,
    gestoptOp: null,
    demo: false,
    ...over,
  }
}

const lid = { id: 'ik', vestiging: 'budel' }

describe('toonInApp', () => {
  it('toont alleen zichtbare challenges van de eigen vestiging, en afgelopen nog 14 dagen', () => {
    expect(toonInApp(maak({}), 'budel', '2026-10-17')).toBe(true)
    expect(toonInApp(maak({}), 'eersel', '2026-10-17')).toBe(false)
    expect(toonInApp(maak({ zichtbaarApp: false }), 'budel', '2026-10-17')).toBe(false)
    expect(toonInApp(maak({}), 'budel', '2026-11-14')).toBe(true)
    expect(toonInApp(maak({}), 'budel', '2026-11-20')).toBe(false)
  })
})

describe('ranglijstVoorApp', () => {
  it('geeft de top met privacynamen en zet het lid erbij als het buiten de top valt', () => {
    // Arrange
    const deelnemers = ['a', 'b', 'c', 'ik'].map((id) => ({ lidId: id, voornaam: id.toUpperCase(), achternaam: 'van Dam' }))
    const stand = ranglijst(deelnemers, new Map([['a', 9], ['b', 8], ['c', 7], ['ik', 1]]), 10)
    // Act
    const uit = ranglijstVoorApp(stand, 'ik', 2)
    // Assert
    expect(uit.map((s) => [s.naam, s.positie, s.isIk])).toEqual([
      ['A D.', 1, false],
      ['B D.', 2, false],
      ['IK D.', 4, true],
    ])
    expect(Object.keys(uit[0])).not.toContain('volledigeNaam')
  })

  it('toont andere leden alleen als ze zelf voor de ranglijst kozen', () => {
    // Arrange
    const deelnemers = ['a', 'b', 'ik'].map((id) => ({ lidId: id, voornaam: id.toUpperCase(), achternaam: 'Bos' }))
    const stand = ranglijst(deelnemers, new Map([['a', 9], ['b', 8], ['ik', 1]]), 10)
    // Act
    const uit = ranglijstVoorApp(stand, 'ik', 10, (id) => id === 'b')
    // Assert
    expect(uit.map((s) => [s.naam, s.positie])).toEqual([
      ['B B.', 2],
      ['IK B.', 3],
    ])
  })
})

describe('appChallenge', () => {
  it('rekent de voortgang alleen als het lid meedoet', () => {
    const ops = ['2026-10-02T08:00:00Z', '2026-10-05T08:00:00Z', '2026-10-09T08:00:00Z']
    const mee = appChallenge(maak({}), lid, false, ops, '2026-10-17', null)
    expect(mee).toMatchObject({ doetMee: true, score: 3, fractie: 1, gehaaldOp: '2026-10-05', status: 'lopend', dagenTeGaan: 15, ranglijst: null })
    const niet = appChallenge(maak({ deelname: 'inschrijven' }), lid, false, ops, '2026-10-17', null)
    expect(niet).toMatchObject({ doetMee: false, score: 0, gehaaldOp: null })
  })
})

describe('gehaaldeChallenges en sorteerApp', () => {
  it('telt alleen gehaalde challenges waaraan het lid meedeed', () => {
    const lijst = [maak({ id: 'x' }), maak({ id: 'y', deelname: 'inschrijven' }), maak({ id: 'z', soort: 'lessen' })]
    const m = { bezoeken: ['2026-10-02T08:00:00Z', '2026-10-03T08:00:00Z'], trainingen: [], lessen: ['2026-10-02T17:00:00Z'] }
    expect(gehaaldeChallenges(lijst, lid, new Set(), m)).toEqual(['2026-10-03'])
    expect(gehaaldeChallenges(lijst, lid, new Set(['y']), m)).toEqual(['2026-10-03', '2026-10-03'])
  })

  it('zet lopend voor gepland voor afgelopen', () => {
    const a = appChallenge(maak({ id: 'a', start: '2026-09-01', eind: '2026-09-30' }), lid, false, [], '2026-10-17', null)
    const b = appChallenge(maak({ id: 'b', start: '2026-11-01', eind: '2026-11-30' }), lid, false, [], '2026-10-17', null)
    const c = appChallenge(maak({ id: 'c' }), lid, false, [], '2026-10-17', null)
    expect(sorteerApp([a, b, c]).map((x) => x.id)).toEqual(['c', 'b', 'a'])
  })
})
