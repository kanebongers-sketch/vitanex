import { describe, expect, test } from 'vitest'
import { leesKlantNotitie, leesNotitieInvoer, sorteerNotities, telNotities, type KlantNotitie } from './klantnotities'

const n = (id: string, datum: string, soort: KlantNotitie['soort'], aangemaaktOp = '2026-10-01T10:00:00Z'): KlantNotitie => ({ id, datum, soort, tekst: 'x', aangemaaktOp })

describe('leesNotitieInvoer', () => {
  test('geldige invoer, tekst opgeschoond', () => {
    const r = leesNotitieInvoer({ datum: '2026-10-08', soort: 'training', tekst: '  Squat  3x8   \n\n\n\nGoed  ' }, '2026-10-09')
    expect(r).toEqual({ ok: true, waarde: { datum: '2026-10-08', soort: 'training', tekst: 'Squat 3x8\n\nGoed' } })
  })
  test('fouten: datum, toekomst, soort, lege tekst', () => {
    expect(leesNotitieInvoer({ soort: 'training', tekst: 'x' }).ok).toBe(false)
    expect(leesNotitieInvoer({ datum: '2026-10-10', soort: 'training', tekst: 'x' }, '2026-10-09').ok).toBe(false)
    expect(leesNotitieInvoer({ datum: '2026-10-08', soort: 'massage', tekst: 'x' }).ok).toBe(false)
    expect(leesNotitieInvoer({ datum: '2026-10-08', soort: 'gesprek', tekst: '   ' }).ok).toBe(false)
  })
  test('tekst wordt op 2000 tekens afgekapt', () => {
    const r = leesNotitieInvoer({ datum: '2026-10-08', soort: 'overig', tekst: 'a'.repeat(2500) })
    expect(r.ok && r.waarde.tekst.length).toBe(2000)
  })
  test('leesKlantNotitie eist id en aangemaaktOp', () => {
    expect(leesKlantNotitie({ id: 'a', aangemaaktOp: 'b', datum: '2026-10-08', soort: 'voeding', tekst: 'x' })?.soort).toBe('voeding')
    expect(leesKlantNotitie({ datum: '2026-10-08', soort: 'voeding', tekst: 'x' })).toBeNull()
  })
})

describe('sorteren en tellen', () => {
  const lijst = [n('a', '2026-10-01', 'training'), n('b', '2026-10-05', 'no_show'), n('c', '2026-10-05', 'gesprek', '2026-10-05T12:00:00Z'), n('d', '2026-10-03', 'voeding')]
  test('nieuwste eerst, zelfde dag → laatst aangemaakt bovenaan', () => {
    expect(sorteerNotities(lijst).map((x) => x.id)).toEqual(['c', 'b', 'd', 'a'])
  })
  test('telling: sessies = trainingen + no-shows', () => {
    expect(telNotities(lijst)).toEqual({ totaal: 4, trainingen: 1, noShows: 1, laatsteSessie: '2026-10-05' })
    expect(telNotities([])).toEqual({ totaal: 0, trainingen: 0, noShows: 0, laatsteSessie: null })
  })
})
