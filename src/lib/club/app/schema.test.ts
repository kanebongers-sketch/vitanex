import { describe, expect, it } from 'vitest'
import { dagLetter, gedaanVandaag, oefeningUitRij, perDag, volgendeDag, voorschrift, type AppLog, type AppOefening } from './schema'

const oef = (id: string, dag: number, volgorde: number, deel: Partial<AppOefening> = {}): AppOefening => ({
  id,
  dag,
  volgorde,
  naam: id,
  spiergroep: null,
  spierenPrimair: [],
  spierenSecundair: [],
  sets: null,
  herhalingen: null,
  gewichtKg: null,
  rustSec: null,
  notitie: null,
  aandachtspunten: null,
  uitleg: null,
  beeld: null,
  ...deel,
})

describe('schema in de app', () => {
  it('groepeert per dag met letters', () => {
    const dagen = perDag([oef('c', 2, 0), oef('b', 1, 2), oef('a', 1, 1)])
    expect(dagen.map((d) => [d.letter, d.oefeningen.map((o) => o.id)])).toEqual([
      ['A', ['a', 'b']],
      ['B', ['c']],
    ])
    expect(dagLetter(3)).toBe('C')
  })

  it('leest een rij met ingesloten oefening', () => {
    const o = oefeningUitRij({ id: 'x', dag: 1, volgorde: 2, sets: 3, herhalingen: '8-10', gewicht_kg: '42.5', club_oefeningen: { naam: 'Squat', spiergroep: 'benen' } })
    expect(o).toMatchObject({ naam: 'Squat', spiergroep: 'benen', gewichtKg: 42.5, spierenPrimair: [], spierenSecundair: [] })
    const metSpieren = oefeningUitRij({
      id: 'y', dag: 1,
      club_oefeningen: { naam: 'Squat', spieren_primair: ['quadriceps', 'bilspieren', 'nek'], spieren_secundair: ['quadriceps', 'hamstrings'] },
    })
    expect(metSpieren).toMatchObject({ spierenPrimair: ['quadriceps', 'bilspieren'], spierenSecundair: ['hamstrings'] })
    expect(oefeningUitRij({ id: 'x' })).toBeNull()
  })

  it('neemt de tekeningen alleen mee als beide paden van ons zijn', () => {
    const pad = (h: string) => `/club/oefeningen/0122-${h}.svg`
    const met = oefeningUitRij({ id: 'x', dag: 1, club_oefeningen: { naam: 'Squat', uitleg: 'Zak en kom omhoog.', beeld_start: pad('start'), beeld_eind: pad('eind') } })
    expect(met).toMatchObject({ uitleg: 'Zak en kom omhoog.', beeld: { start: pad('start'), eind: pad('eind') } })
    const vreemd = oefeningUitRij({ id: 'x', dag: 1, club_oefeningen: { naam: 'Squat', beeld_start: 'https://elders.nl/a.svg', beeld_eind: pad('eind') } })
    expect(vreemd?.beeld).toBeNull()
    const r = (h: string) => `/club/oefeningen-repdb/squat-${h}.webp`
    const repdb = oefeningUitRij({ id: 'x', dag: 1, club_oefeningen: { naam: 'Squat', beeld_start: r('start'), beeld_eind: r('eind'), beeld_bron: 'RepDB' } })
    expect(repdb?.beeld).toEqual({ start: r('start'), eind: r('eind'), bron: 'repdb', enkel: false })
  })

  it('schrijft het voorschrift kort op', () => {
    expect(voorschrift(oef('a', 1, 0, { sets: 3, herhalingen: '10', gewichtKg: 42.5, rustSec: 90 }))).toBe('3 x 10 · 42,5 kg · 90 s rust')
    expect(voorschrift(oef('a', 1, 0, { herhalingen: '20 min' }))).toBe('20 min')
  })

  const logs: AppLog[] = [
    { id: 'l1', schemaId: 's', dag: 1, op: '2026-10-12T08:00:00Z' },
    { id: 'l2', schemaId: 's', dag: 2, op: '2026-10-14T08:00:00Z' },
  ]

  it('weet wat vandaag al gedaan is', () => {
    const nu = new Date('2026-10-14T19:00:00Z')
    expect(gedaanVandaag(logs, 's', 2, nu)?.id).toBe('l2')
    expect(gedaanVandaag(logs, 's', 1, nu)).toBeNull()
  })

  it('stelt de volgende trainingsdag voor', () => {
    const dagen = perDag([oef('a', 1, 0), oef('b', 2, 0)])
    expect(volgendeDag(dagen, logs, 's')).toBe(1)
    expect(volgendeDag(dagen, [], 's')).toBe(1)
    expect(volgendeDag(dagen, logs.slice(0, 1), 's')).toBe(2)
    expect(volgendeDag([], logs, 's')).toBeNull()
  })
})
