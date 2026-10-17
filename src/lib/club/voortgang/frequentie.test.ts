import { describe, expect, it } from 'vitest'
import { gemiddeldPerWeek, mijlpalen, perWeek, volgendeMijlpaal, wekenOpRij } from './frequentie'

// Vrijdag 16 oktober 2026, 12:00 Nederlandse tijd. Deze week begint maandag 12 oktober.
const NU = new Date('2026-10-16T10:00:00Z')

describe('perWeek', () => {
  it('telt per week, oudste eerst, met lege weken', () => {
    // Arrange
    const ops = ['2026-10-12T08:00:00Z', '2026-10-14T17:00:00Z', '2026-09-30T18:00:00Z']
    // Act
    const weken = perWeek(ops, NU, 4)
    // Assert
    expect(weken).toEqual([
      { week: '2026-09-21', aantal: 0 },
      { week: '2026-09-28', aantal: 1 },
      { week: '2026-10-05', aantal: 0 },
      { week: '2026-10-12', aantal: 2 },
    ])
  })

  it('zet zondagavond laat in Nederland nog in dezelfde week', () => {
    // Zondag 11 oktober 23:30 Nederlandse tijd = 21:30 UTC.
    expect(perWeek(['2026-10-11T21:30:00Z'], NU, 2)).toEqual([
      { week: '2026-10-05', aantal: 1 },
      { week: '2026-10-12', aantal: 0 },
    ])
  })
})

describe('gemiddeldPerWeek', () => {
  it('laat de lopende week buiten het gemiddelde', () => {
    const weken = [{ week: 'a', aantal: 2 }, { week: 'b', aantal: 3 }, { week: 'c', aantal: 0 }]
    expect(gemiddeldPerWeek(weken)).toBe(2.5)
  })

  it('geeft 0 zonder weken', () => {
    expect(gemiddeldPerWeek([])).toBe(0)
  })
})

describe('wekenOpRij', () => {
  it('telt aaneengesloten weken tot nu', () => {
    const ops = ['2026-10-13T08:00:00Z', '2026-10-06T08:00:00Z', '2026-09-29T08:00:00Z', '2026-09-15T08:00:00Z']
    expect(wekenOpRij(ops, NU)).toBe(3)
  })

  it('breekt niet door een lopende week zonder training', () => {
    const ops = ['2026-10-06T08:00:00Z', '2026-09-29T08:00:00Z']
    expect(wekenOpRij(ops, NU)).toBe(2)
  })

  it('is 0 als vorige week en deze week leeg zijn', () => {
    expect(wekenOpRij(['2026-09-22T08:00:00Z'], NU)).toBe(0)
  })
})

describe('mijlpalen', () => {
  it('markeert behaalde mijlpalen', () => {
    // Act
    const lijst = mijlpalen(12, 4)
    // Assert
    const behaald = lijst.filter((m) => m.behaald).map((m) => m.titel)
    expect(behaald).toEqual(['Eerste training', '10 trainingen', '4 weken op rij'])
  })
})

describe('volgendeMijlpaal', () => {
  it('rekent de voortgang tussen twee mijlpalen', () => {
    expect(volgendeMijlpaal(16)).toEqual({ titel: '25 trainingen', voortgang: 0.4, nogTeGaan: 9 })
  })

  it('begint bij de eerste training', () => {
    expect(volgendeMijlpaal(0)).toEqual({ titel: 'Eerste training', voortgang: 0, nogTeGaan: 1 })
  })

  it('is null als alles behaald is', () => {
    expect(volgendeMijlpaal(800)).toBeNull()
  })
})
