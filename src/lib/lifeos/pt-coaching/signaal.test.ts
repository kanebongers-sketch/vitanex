import { describe, expect, test } from 'vitest'
import { coachSignalen } from './signaal'
import type { EvaluatieJson } from './pt-coaching'

function ev(algemeen: number, energie: number, voortgang: number): EvaluatieJson {
  return { id: `${algemeen}${energie}${voortgang}`, aangemaaktOp: '2026-09-28T20:00:00Z', scores: { algemeen, energie, voortgang }, notitie: null, aandachtspunt: null }
}

describe('coachSignalen', () => {
  const team = [{ id: 'i', naam: 'Iris' }, { id: 'm', naam: 'Michael' }]

  test('twee keer op rij laag op hetzelfde vlak → signaal', () => {
    const uit = coachSignalen(team, new Map([['i', [ev(4, 2, 4), ev(3, 1, 4)]]]))
    expect(uit).toEqual([{ naam: 'Iris', tekst: 'Energie van Iris 2× op rij laag (1 en 2) — bespreek dit' }])
  })

  test('één lage score, of laag op verschillende vlakken → niets', () => {
    expect(coachSignalen(team, new Map([['i', [ev(4, 2, 4), ev(4, 4, 4)]]]))).toEqual([])
    expect(coachSignalen(team, new Map([['i', [ev(4, 2, 4), ev(4, 4, 2)]]]))).toEqual([])
  })

  test('maar één gesprek → nooit een signaal', () => {
    expect(coachSignalen(team, new Map([['m', [ev(1, 1, 1)]]]))).toEqual([])
  })
})
