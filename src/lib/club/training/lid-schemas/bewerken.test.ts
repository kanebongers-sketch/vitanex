import { describe, expect, it } from 'vitest'
import { koppelAanVorige, naarPayloadRegels, verplaats } from '../editor'
import { GEEN_EXTRA } from '../invoer'
import { leesLidSchema } from './regels'
import { filterBibliotheek, filterKeuzes, kanOpslaan, LEEG_FILTER, staatUit, stap } from './bewerken'
import type { LidOefening } from './typen'

const A = '00000000-0000-4000-8000-00000000000a'
const B = '00000000-0000-4000-8000-00000000000b'
const C = '00000000-0000-4000-8000-00000000000c'

function oef(id: string, naam: string, spiergroep: LidOefening['spiergroep'], materiaal: LidOefening['materiaal']): LidOefening {
  return { id, naam, spiergroep, materiaal, niveau: 1, patroon: null, spierenPrimair: [], spierenSecundair: [], uitleg: null, aandachtspunten: null }
}

const BIB = [oef(A, 'Push-up', 'borst', 'geen'), oef(B, 'Back squat', 'benen', 'barbell'), oef(C, 'Goblet squat', 'benen', 'dumbbell')]

describe('staatUit', () => {
  let n = 0
  const sleutel = () => `s${++n}`

  it('maakt van een voorstel een editor met volgorde per dag', () => {
    const regel = (dag: number, oefeningId: string) => ({ dag, oefeningId, sets: 3, herhalingen: '8-10', gewichtKg: null, rustSec: 90, notitie: null, ...GEEN_EXTRA })
    const s = staatUit([regel(1, A), regel(1, B), regel(2, C)], ['Full body A', 'Full body B'], sleutel)
    expect(s.dagTitels).toEqual(['Full body A', 'Full body B'])
    expect(s.regels.map((r) => [r.dag, r.oefeningId])).toEqual([[1, A], [1, B], [2, C]])
    expect(s.regels[0].sets).toBe('3')
    expect(new Set(s.regels.map((r) => r.sleutel)).size).toBe(3)
  })

  it('superset en volgorde gaan in de payload naar een geldig lid-schema', () => {
    const regel = (oefeningId: string) => ({ dag: 1, oefeningId, sets: 3, herhalingen: '10', gewichtKg: null, rustSec: 60, notitie: null, ...GEEN_EXTRA })
    let s = staatUit([regel(A), regel(B), regel(C)], ['Dag A'], sleutel)
    s = koppelAanVorige(s, s.regels[1].sleutel)
    s = verplaats(s, s.regels[2].sleutel, -1)
    const payload = naarPayloadRegels(s)
    expect(payload.map((r) => r.oefeningId)).toEqual([C, A, B])
    expect(payload[1].groep).toBe(payload[2].groep)
    expect(payload[1].groep).not.toBeNull()
    const gelezen = leesLidSchema({ naam: 'Mijn schema', niveau: 1, dagTitels: s.dagTitels, regels: payload })
    expect(gelezen.ok).toBe(true)
  })
})

describe('bibliotheek', () => {
  it('filtert op spiergroep, materiaal en naam', () => {
    expect(filterBibliotheek(BIB, LEEG_FILTER)).toHaveLength(3)
    expect(filterBibliotheek(BIB, { ...LEEG_FILTER, spiergroep: 'benen' }).map((o) => o.id)).toEqual([B, C])
    expect(filterBibliotheek(BIB, { ...LEEG_FILTER, spiergroep: 'benen', materiaal: 'dumbbell' }).map((o) => o.id)).toEqual([C])
    expect(filterBibliotheek(BIB, { ...LEEG_FILTER, zoek: 'SQUAT ' }).map((o) => o.id)).toEqual([B, C])
  })

  it('biedt alleen filters die voorkomen, in vaste volgorde', () => {
    expect(filterKeuzes(BIB)).toEqual({ spiergroepen: ['borst', 'benen'], materialen: ['geen', 'dumbbell', 'barbell'] })
  })
})

describe('kleine hulp', () => {
  it('stap blijft binnen de grenzen', () => {
    expect(stap('3', 1, 1, 20)).toBe('4')
    expect(stap('1', -1, 1, 20)).toBe('1')
    expect(stap('', 1, 1, 20)).toBe('2')
    expect(stap('20', 1, 1, 20)).toBe('20')
  })

  it('zonder oefeningen niet opslaan', () => {
    expect(kanOpslaan({ regels: [], dagTitels: ['Dag A'] })).toBe(false)
  })
})
