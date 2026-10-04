import { describe, expect, test } from 'vitest'
import { leesOordelen, leesOpenPunten, naOordeel, puntSignalen, type OpenPunt } from './aandachtspunten'

const punt = (over: Partial<OpenPunt> = {}): OpenPunt => ({ id: 'p1', tekst: 'Planning strakker', sinds: '2026-09-20T10:00:00Z', keerOpen: 0, laatsteOordeel: null, ...over })

describe('aandachtspunten', () => {
  test('oordelen lezen: onbekend en dubbel overslaan', () => {
    expect(leesOordelen([{ id: 'a', oordeel: 'opgelost' }, { id: 'a', oordeel: 'erger' }, { id: 'b', oordeel: 'misschien' }, 'x'])).toEqual([{ id: 'a', oordeel: 'opgelost' }])
    expect(leesOordelen(null)).toEqual([])
  })

  test('opgelost sluit het punt; loopt/erger/geen oordeel telt een gesprek erbij', () => {
    expect(naOordeel(punt(), 'opgelost')).toEqual({ opgelost: true, keerOpen: 0, laatsteOordeel: 'opgelost' })
    expect(naOordeel(punt({ keerOpen: 1 }), 'loopt')).toEqual({ opgelost: false, keerOpen: 2, laatsteOordeel: 'loopt' })
    expect(naOordeel(punt({ laatsteOordeel: 'erger' }), null)).toEqual({ opgelost: false, keerOpen: 1, laatsteOordeel: 'erger' })
  })

  test('signalen: 2 gesprekken open, of erger geworden', () => {
    const team = [{ id: 'x', naam: 'Iris' }]
    expect(puntSignalen(team, new Map([['x', [punt({ keerOpen: 1 })]]]))).toEqual([])
    expect(puntSignalen(team, new Map([['x', [punt({ keerOpen: 2 })]]]))[0].tekst).toBe('Aandachtspunt van Iris staat al 2 gesprekken open: “Planning strakker”')
    expect(puntSignalen(team, new Map([['x', [punt({ laatsteOordeel: 'erger' })]]]))[0].tekst).toContain('erger geworden')
  })

  test('open punten uit JSON', () => {
    expect(leesOpenPunten([{ id: 'p', tekst: 't', sinds: 's', keerOpen: 1, laatsteOordeel: 'loopt' }, { id: 1 }])).toEqual([
      { id: 'p', tekst: 't', sinds: 's', keerOpen: 1, laatsteOordeel: 'loopt' },
    ])
  })
})
