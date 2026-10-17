import { describe, expect, it } from 'vitest'
import type { Bericht } from './model'
import { berichtStatus, berichtenVoorLid, hoortBijDoelgroep, pastInFilters, sorteerVoorBeheer, telPerStatus, type LidVoorBericht } from './regels'

const NU = new Date('2026-10-17T10:00:00.000Z')

function bericht(over: Partial<Bericht> = {}): Bericht {
  return {
    id: over.id ?? 'b1',
    titel: 'Titel',
    tekst: '',
    soort: 'nieuws',
    vestigingen: [],
    statussen: [],
    tag: null,
    zichtbaarVan: '2026-10-10T08:00:00.000Z',
    zichtbaarTot: null,
    vastgepind: false,
    aangemaaktDoor: 'Kane',
    aangemaaktOp: '2026-10-10T08:00:00.000Z',
    demo: false,
    ...over,
  }
}

const LID: LidVoorBericht = { vestiging: 'budel', status: 'actief', tags: ['Ochtendploeg'] }

describe('berichtStatus', () => {
  it('is gepland als het begin nog moet komen', () => {
    // Arrange
    const b = bericht({ zichtbaarVan: '2026-12-01T07:00:00.000Z' })
    // Act + Assert
    expect(berichtStatus(b, NU)).toBe('gepland')
  })

  it('is verlopen precies op het eindmoment', () => {
    const b = bericht({ zichtbaarTot: NU.toISOString() })
    expect(berichtStatus(b, NU)).toBe('verlopen')
  })

  it('is actief zonder einde', () => {
    expect(berichtStatus(bericht(), NU)).toBe('actief')
  })
})

describe('hoortBijDoelgroep', () => {
  it('lege doelgroep geldt voor iedereen', () => {
    expect(hoortBijDoelgroep(bericht(), LID)).toBe(true)
  })

  it('filtert op vestiging', () => {
    expect(hoortBijDoelgroep(bericht({ vestigingen: ['eersel'] }), LID)).toBe(false)
    expect(hoortBijDoelgroep(bericht({ vestigingen: ['eersel', 'budel'] }), LID)).toBe(true)
  })

  it('filtert op lidstatus, bijvoorbeeld alleen proefleden', () => {
    const b = bericht({ statussen: ['proef'] })
    expect(hoortBijDoelgroep(b, LID)).toBe(false)
    expect(hoortBijDoelgroep(b, { ...LID, status: 'proef' })).toBe(true)
  })

  it('vergelijkt tags zonder op hoofdletters te letten', () => {
    expect(hoortBijDoelgroep(bericht({ tag: 'ochtendploeg ' }), LID)).toBe(true)
    expect(hoortBijDoelgroep(bericht({ tag: 'avond' }), LID)).toBe(false)
  })
})

describe('berichtenVoorLid', () => {
  it('toont alleen actieve berichten voor de doelgroep, vastgepind eerst en dan het nieuwste', () => {
    // Arrange
    const berichten = [
      bericht({ id: 'oud', zichtbaarVan: '2026-10-01T08:00:00.000Z' }),
      bericht({ id: 'nieuw', zichtbaarVan: '2026-10-16T08:00:00.000Z' }),
      bericht({ id: 'vast', zichtbaarVan: '2026-09-01T08:00:00.000Z', vastgepind: true }),
      bericht({ id: 'gepland', zichtbaarVan: '2026-12-01T08:00:00.000Z', vastgepind: true }),
      bericht({ id: 'verlopen', zichtbaarTot: '2026-10-15T00:00:00.000Z' }),
      bericht({ id: 'andere-vestiging', vestigingen: ['eersel'] }),
    ]
    // Act
    const uit = berichtenVoorLid(berichten, LID, NU)
    // Assert
    expect(uit.map((b) => b.id)).toEqual(['vast', 'nieuw', 'oud'])
  })

  it('verandert de invoer niet', () => {
    const berichten = [bericht({ id: 'a', zichtbaarVan: '2026-10-01T08:00:00.000Z' }), bericht({ id: 'b' })]
    berichtenVoorLid(berichten, LID, NU)
    expect(berichten.map((b) => b.id)).toEqual(['a', 'b'])
  })

  it('kiest bij gelijk begin het laatst aangemaakte', () => {
    const berichten = [bericht({ id: 'eerst' }), bericht({ id: 'later', aangemaaktOp: '2026-10-11T08:00:00.000Z' })]
    expect(berichtenVoorLid(berichten, LID, NU).map((b) => b.id)).toEqual(['later', 'eerst'])
  })
})

describe('beheer', () => {
  const lijst = [
    bericht({ id: 'verlopen', zichtbaarTot: '2026-10-11T00:00:00.000Z' }),
    bericht({ id: 'gepland', zichtbaarVan: '2026-12-01T08:00:00.000Z', soort: 'belangrijk' }),
    bericht({ id: 'actief', vestigingen: ['budel'] }),
  ]

  it('sorteert actief, gepland, verlopen', () => {
    expect(sorteerVoorBeheer(lijst, NU).map((b) => b.id)).toEqual(['actief', 'gepland', 'verlopen'])
  })

  it('telt per status', () => {
    expect(telPerStatus(lijst, NU)).toEqual({ actief: 1, gepland: 1, verlopen: 1 })
  })

  it('filtert op status, soort en vestiging (alle vestigingen telt overal mee)', () => {
    expect(lijst.filter((b) => pastInFilters(b, { status: 'gepland', soort: 'alle', vestiging: null }, NU)).map((b) => b.id)).toEqual(['gepland'])
    expect(lijst.filter((b) => pastInFilters(b, { status: 'alle', soort: 'belangrijk', vestiging: null }, NU)).map((b) => b.id)).toEqual(['gepland'])
    expect(lijst.filter((b) => pastInFilters(b, { status: 'alle', soort: 'alle', vestiging: 'eersel' }, NU)).map((b) => b.id)).toEqual(['verlopen', 'gepland'])
  })
})
