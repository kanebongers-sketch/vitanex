import { describe, expect, it } from 'vitest'
import { leesGelogdeSets, nieuweRecords, samenvatting, toonDuur, toonKlok, type SetInvoer } from './sets'

const A = '11111111-1111-4111-8111-111111111111'
const B = '22222222-2222-4222-8222-222222222222'
const VREEMD = '33333333-3333-4333-8333-333333333333'
const MAG = new Set([A, B])

describe('leesGelogdeSets', () => {
  it('leest sets met komma als decimaal en de duur', () => {
    const u = leesGelogdeSets([{ oefeningId: A, setNr: 1, herhalingen: '10', gewichtKg: '22,5' }], 2900, MAG)
    expect(u).toEqual({ sets: [{ oefeningId: A, setNr: 1, herhalingen: 10, gewichtKg: 22.5, tijdSec: null }], duurSec: 2900 })
  })

  it('geen sets is afvinken', () => {
    expect(leesGelogdeSets(undefined, null, MAG)).toEqual({ sets: [], duurSec: null })
  })

  it('weigert een oefening buiten het schema en onzin', () => {
    expect(leesGelogdeSets([{ oefeningId: VREEMD, setNr: 1, herhalingen: 8 }], null, MAG)).toBe('Een oefening hoort niet bij dit schema.')
    expect(typeof leesGelogdeSets([{ oefeningId: A, setNr: 0, herhalingen: 8 }], null, MAG)).toBe('string')
    expect(typeof leesGelogdeSets([{ oefeningId: A, setNr: 1 }], null, MAG)).toBe('string')
    expect(typeof leesGelogdeSets([{ oefeningId: A, setNr: 1, herhalingen: 8, gewichtKg: -1 }], null, MAG)).toBe('string')
    expect(typeof leesGelogdeSets('x', null, MAG)).toBe('string')
    expect(typeof leesGelogdeSets([], 99999, MAG)).toBe('string')
  })

  it('dezelfde set dubbel: de laatste telt', () => {
    const u = leesGelogdeSets([{ oefeningId: A, setNr: 1, herhalingen: 8 }, { oefeningId: A, setNr: 1, herhalingen: 9 }], null, MAG)
    expect(typeof u !== 'string' && u.sets.map((s) => s.herhalingen)).toEqual([9])
  })
})

describe('samenvatting', () => {
  const set = (oefeningId: string, setNr: number, herhalingen: number | null, gewichtKg: number | null): SetInvoer => ({ oefeningId, setNr, herhalingen, gewichtKg, tijdSec: null })
  const namen = new Map([[A, 'Back squat'], [B, 'Lat pulldown']])

  it('telt sets, herhalingen, volume en records', () => {
    const sets = [set(A, 1, 8, 60), set(A, 2, 8, 62.5), set(B, 1, 10, 40), set(B, 2, 12, 40)]
    const besten = new Map([[A, { gewichtKg: 60, herhalingen: 10 }], [B, { gewichtKg: 40, herhalingen: 11 }]])
    expect(samenvatting(sets, besten, namen)).toEqual({ sets: 4, oefeningen: 2, herhalingen: 38, volumeKg: 480 + 500 + 400 + 480, records: ['Back squat', 'Lat pulldown'] })
  })

  it('geen record zonder eerdere training of zonder gewicht', () => {
    expect(samenvatting([set(A, 1, 8, 60)], new Map(), namen).records).toEqual([])
    expect(samenvatting([set(A, 1, 20, null)], new Map([[A, { gewichtKg: null, herhalingen: 10 }]]), namen).records).toEqual([])
    expect(samenvatting([set(A, 1, 8, 55)], new Map([[A, { gewichtKg: 60, herhalingen: 5 }]]), namen).records).toEqual([])
  })
})

describe('nieuweRecords', () => {
  it('geeft het nieuwe en het oude record', () => {
    const s = (setNr: number, herhalingen: number, gewichtKg: number): SetInvoer => ({ oefeningId: A, setNr, herhalingen, gewichtKg, tijdSec: null })
    const r = nieuweRecords([s(1, 8, 60), s(2, 6, 62.5)], new Map([[A, { gewichtKg: 60, herhalingen: 10 }]]), new Map([[A, 'Back squat']]))
    expect(r).toEqual([{ oefeningId: A, naam: 'Back squat', gewichtKg: 62.5, herhalingen: 6, vorigKg: 60, vorigHerhalingen: 10 }])
  })
})

describe('weergave', () => {
  it('duur en klok', () => {
    expect(toonDuur(2900)).toBe('48 min')
    expect(toonDuur(3900)).toBe('1 u 05 min')
    expect(toonKlok(90)).toBe('1:30')
    expect(toonKlok(4.2)).toBe('0:05')
    expect(toonKlok(-3)).toBe('0:00')
  })
})
