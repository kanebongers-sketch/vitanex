import { describe, expect, it } from 'vitest'
import type { Challenge } from './model'
import { eenPerDag, fractie, gehaaldOp, langsteReeks, perLid, privacyNaam, ranglijst, reeksBehaaldOp, scoreVoor, vatSamen } from './voortgang'

const basis: Challenge = {
  id: 'c1',
  titel: '12 keer in oktober',
  uitleg: null,
  soort: 'bezoeken',
  doel: 3,
  start: '2026-10-01',
  eind: '2026-10-31',
  vestigingen: [],
  deelname: 'automatisch',
  zichtbaarApp: true,
  ranglijst: true,
  gestoptOp: null,
  demo: false,
}

describe('scoreVoor', () => {
  it('telt alleen momenten binnen de periode, in Nederlandse tijd', () => {
    // Arrange: 30 sep 23:30 UTC is 1 okt 01:30 in Nederland, dus telt mee.
    const ops = ['2026-09-30T21:00:00Z', '2026-09-30T23:30:00Z', '2026-10-15T08:00:00Z', '2026-11-01T08:00:00Z']
    // Act
    const score = scoreVoor(basis, ops)
    // Assert
    expect(score).toBe(2)
  })

  it('telt bij bezoeken unieke dagen in Nederlandse tijd, niet elke check-in', () => {
    // Arrange: twee check-ins op 15 okt, en 15 okt 23:30 UTC is al 16 okt in Nederland.
    const ops = ['2026-10-15T06:00:00Z', '2026-10-15T17:00:00Z', '2026-10-15T23:30:00Z', '2026-10-16T08:00:00Z']
    // Act en Assert
    expect(scoreVoor(basis, ops)).toBe(2)
    expect(gehaaldOp({ ...basis, doel: 2 }, ops)).toBe('2026-10-16')
    expect(gehaaldOp({ ...basis, doel: 3 }, ops)).toBeNull()
  })

  it('telt bij trainingen wel elk moment', () => {
    const ops = ['2026-10-15T06:00:00Z', '2026-10-15T17:00:00Z']
    expect(scoreVoor({ ...basis, soort: 'trainingen' }, ops)).toBe(2)
  })

  it('stopt met tellen op de dag dat de challenge gestopt is', () => {
    const c = { ...basis, gestoptOp: '2026-10-10T12:00:00Z' }
    expect(scoreVoor(c, ['2026-10-05T08:00:00Z', '2026-10-10T08:00:00Z', '2026-10-11T08:00:00Z'])).toBe(2)
  })

  it('geeft bij weken op rij de langste reeks binnen de periode', () => {
    const c = { ...basis, soort: 'weken_op_rij' as const }
    // Weken van 5, 12 en 26 oktober: reeks van 2, dan een gat.
    const ops = ['2026-10-05T08:00:00Z', '2026-10-07T08:00:00Z', '2026-10-13T08:00:00Z', '2026-10-27T08:00:00Z']
    expect(scoreVoor(c, ops)).toBe(2)
  })
})

describe('langsteReeks en reeksBehaaldOp', () => {
  it('vindt de langste reeks weken op rij', () => {
    const ops = ['2026-09-01T08:00:00Z', '2026-09-08T08:00:00Z', '2026-09-15T08:00:00Z', '2026-09-29T08:00:00Z']
    expect(langsteReeks(ops)).toBe(3)
    expect(langsteReeks([])).toBe(0)
  })

  it('geeft het eerste moment in de week waarin de reeks rond was', () => {
    const ops = ['2026-09-01T08:00:00Z', '2026-09-08T08:00:00Z', '2026-09-17T08:00:00Z', '2026-09-15T08:00:00Z']
    expect(reeksBehaaldOp(ops, 3)).toBe('2026-09-15T08:00:00Z')
    expect(reeksBehaaldOp(ops, 4)).toBeNull()
  })
})

describe('gehaaldOp', () => {
  it('geeft de dag van het moment dat het doel bereikte', () => {
    const ops = ['2026-10-20T08:00:00Z', '2026-10-02T08:00:00Z', '2026-10-09T08:00:00Z', '2026-10-25T08:00:00Z']
    expect(gehaaldOp(basis, ops)).toBe('2026-10-20')
  })

  it('geeft null als het doel niet gehaald is', () => {
    expect(gehaaldOp(basis, ['2026-10-02T08:00:00Z'])).toBeNull()
  })
})

describe('privacyNaam', () => {
  it('toont voornaam en de eerste letter van de achternaam zelf', () => {
    expect(privacyNaam('Sanne', 'van der Vliet')).toBe('Sanne V.')
    expect(privacyNaam('Tom', 'Jansen')).toBe('Tom J.')
    expect(privacyNaam('Anna Maria', "in 't Veld")).toBe('Anna V.')
  })
})

describe('ranglijst', () => {
  it('sorteert op score en geeft gelijke scores dezelfde plek', () => {
    // Arrange
    const deelnemers = [
      { lidId: 'a', voornaam: 'Bas', achternaam: 'Smit' },
      { lidId: 'b', voornaam: 'Anna', achternaam: 'de Groot' },
      { lidId: 'c', voornaam: 'Cas', achternaam: 'Bos' },
      { lidId: 'd', voornaam: 'Dirk', achternaam: 'Kok' },
    ]
    const scores = new Map([['a', 5], ['b', 5], ['c', 7]])
    // Act
    const stand = ranglijst(deelnemers, scores, 6)
    // Assert
    expect(stand.map((s) => [s.naam, s.positie, s.gehaald])).toEqual([
      ['Cas B.', 1, true],
      ['Anna G.', 2, false],
      ['Bas S.', 2, false],
      ['Dirk K.', 4, false],
    ])
  })
})

describe('hulpfuncties', () => {
  it('fractie blijft tussen 0 en 1', () => {
    expect(fractie(15, 12)).toBe(1)
    expect(fractie(3, 12)).toBe(0.25)
    expect(fractie(3, 0)).toBe(0)
  })

  it('perLid groepeert momenten', () => {
    const uit = perLid([{ lidId: 'a', op: '1' }, { lidId: 'b', op: '2' }, { lidId: 'a', op: '3' }])
    expect(uit.get('a')).toEqual(['1', '3'])
  })

  it('vatSamen telt deelnemers, actieven en gehaald', () => {
    const stand = ranglijst([{ lidId: 'a', voornaam: 'A', achternaam: 'B' }, { lidId: 'b', voornaam: 'C', achternaam: 'D' }, { lidId: 'c', voornaam: 'E', achternaam: 'F' }], new Map([['a', 4], ['b', 1]]), 3)
    expect(vatSamen(stand)).toEqual({ deelnemers: 3, actief: 2, gehaald: 1, gemiddeld: 2.5 })
  })
})

describe('eenPerDag', () => {
  it('houdt per Nederlandse dag het eerste moment over, oplopend', () => {
    expect(eenPerDag(['2026-10-16T08:00:00Z', '2026-10-15T17:00:00Z', '2026-10-15T06:00:00Z', '2026-10-15T23:30:00Z'])).toEqual([
      '2026-10-15T06:00:00Z',
      '2026-10-15T23:30:00Z',
    ])
  })
})
