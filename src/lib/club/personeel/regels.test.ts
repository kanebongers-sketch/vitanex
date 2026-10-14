import { describe, expect, it } from 'vitest'
import { beschikbaarheidVoor, dekking, gaten, geplandPerPersoon, urenOordeel, vindOverlap, vindRustTekort, type Blok } from './regels'
import type { Beschikbaarheid } from './typen'

function blok(id: string, datum: string, begin: string, eind: string, medewerkerId: string | null = 'a', uursoort: Blok['uursoort'] = 'werk'): Blok {
  return { id, datum, begin, eind, medewerkerId, uursoort }
}

function regel(over: Partial<Beschikbaarheid>): Beschikbaarheid {
  return { id: 'r', medewerkerId: 'a', weekdag: null, datum: null, datumTot: null, beschikbaar: true, van: null, tot: null, reden: null, notitie: null, ...over }
}

describe('vindOverlap', () => {
  it('vindt twee diensten van dezelfde persoon die elkaar raken', () => {
    const uit = vindOverlap([blok('1', '2026-10-12', '08:00', '14:00'), blok('2', '2026-10-12', '13:00', '21:30')])
    expect(uit).toEqual([{ medewerkerId: 'a', a: '1', b: '2' }])
  })

  it('aansluitende diensten en andere personen zijn geen overlap', () => {
    const uit = vindOverlap([blok('1', '2026-10-12', '08:00', '14:00'), blok('2', '2026-10-12', '14:00', '21:30'), blok('3', '2026-10-12', '09:00', '12:00', 'b')])
    expect(uit).toEqual([])
  })

  it('negeert open diensten en ziekte', () => {
    const uit = vindOverlap([blok('1', '2026-10-12', '08:00', '14:00', null), blok('2', '2026-10-12', '08:00', '14:00', null), blok('3', '2026-10-12', '09:00', '12:00', 'a', 'ziek'), blok('4', '2026-10-12', '09:00', '12:00')])
    expect(uit).toEqual([])
  })
})

describe('vindRustTekort', () => {
  it('meldt avond gevolgd door vroege ochtend (10,5 uur rust)', () => {
    const uit = vindRustTekort([blok('1', '2026-10-12', '14:00', '21:30'), blok('2', '2026-10-13', '08:00', '14:00')])
    expect(uit).toEqual([{ medewerkerId: 'a', eerste: '1', tweede: '2', rustMin: 630 }])
  })

  it('11 uur of meer is goed, ook over een weekgrens', () => {
    expect(vindRustTekort([blok('1', '2026-10-18', '08:00', '13:00'), blok('2', '2026-10-19', '08:00', '14:00')])).toEqual([])
    expect(vindRustTekort([blok('1', '2026-10-12', '14:00', '21:00'), blok('2', '2026-10-13', '08:00', '14:00')])).toEqual([])
  })

  it('kent een eigen minimum', () => {
    expect(vindRustTekort([blok('1', '2026-10-12', '14:00', '21:30'), blok('2', '2026-10-13', '08:00', '14:00')], 10)).toEqual([])
  })
})

describe('beschikbaarheidVoor', () => {
  it('zonder regels is het onbekend', () => {
    expect(beschikbaarheidVoor('a', '2026-10-12', '08:00', '14:00', [])).toEqual({ status: 'onbekend' })
  })

  it('vaste weekdag niet beschikbaar', () => {
    const uit = beschikbaarheidVoor('a', '2026-10-16', '08:00', '14:00', [regel({ weekdag: 5, beschikbaar: false, notitie: 'Studie' })])
    expect(uit.status).toBe('nee')
  })

  it('vaste tijden: binnen is ja, erbuiten is deels', () => {
    const r = [regel({ weekdag: 1, van: '16:00', tot: '22:00' })]
    expect(beschikbaarheidVoor('a', '2026-10-12', '17:00', '21:30', r).status).toBe('ja')
    expect(beschikbaarheidVoor('a', '2026-10-12', '08:00', '14:00', r).status).toBe('deels')
  })

  it('verlof over een reeks datums gaat voor de vaste weekdag', () => {
    const r = [regel({ weekdag: 3 }), regel({ id: 'v', datum: '2026-10-13', datumTot: '2026-10-15', beschikbaar: false, reden: 'verlof' })]
    const uit = beschikbaarheidVoor('a', '2026-10-14', '08:00', '14:00', r)
    expect(uit).toMatchObject({ status: 'nee', reden: 'verlof' })
    expect(beschikbaarheidVoor('a', '2026-10-21', '08:00', '14:00', r).status).toBe('ja')
  })

  it('kijkt alleen naar de eigen regels', () => {
    expect(beschikbaarheidVoor('b', '2026-10-16', '08:00', '14:00', [regel({ weekdag: 5, beschikbaar: false })])).toEqual({ status: 'onbekend' })
  })
})

describe('dekking en gaten', () => {
  const dag = [blok('1', '2026-10-14', '08:00', '13:30'), blok('2', '2026-10-14', '14:00', '21:30', 'b'), blok('3', '2026-10-14', '17:00', '21:30', 'c')]

  it('telt mensen per stuk binnen de bemande uren', () => {
    expect(dekking(dag, 480, 1290)).toEqual([
      { van: 480, tot: 810, aantal: 1 },
      { van: 810, tot: 840, aantal: 0 },
      { van: 840, tot: 1020, aantal: 1 },
      { van: 1020, tot: 1290, aantal: 2 },
    ])
  })

  it('geeft alleen de gaten', () => {
    expect(gaten(dag, 480, 1290)).toEqual([{ van: 810, tot: 840, aantal: 0 }])
  })

  it('een open dienst dekt niets en een lege dag is een groot gat', () => {
    expect(gaten([blok('1', '2026-10-14', '08:00', '13:00', null)], 480, 780)).toEqual([{ van: 480, tot: 780, aantal: 0 }])
    expect(dekking([], 480, 480)).toEqual([])
  })

  it('dezelfde persoon twee keer telt als een', () => {
    const dubbel = [blok('1', '2026-10-14', '08:00', '12:00'), blok('2', '2026-10-14', '10:00', '12:00')]
    expect(dekking(dubbel, 480, 720).every((s) => s.aantal === 1)).toBe(true)
  })
})

describe('uren per persoon', () => {
  it('telt alleen werk', () => {
    const m = geplandPerPersoon([blok('1', '2026-10-12', '08:00', '14:00'), blok('2', '2026-10-13', '17:00', '21:30'), blok('3', '2026-10-14', '08:00', '14:00', 'a', 'ziek')])
    expect(m.get('a')).toBe(630)
  })

  it('oordeel tegenover contract met een uur marge', () => {
    expect(urenOordeel(24 * 60, 24)).toBe('goed')
    expect(urenOordeel(26 * 60, 24)).toBe('te_veel')
    expect(urenOordeel(20 * 60, 24)).toBe('te_weinig')
    expect(urenOordeel(20 * 60, null)).toBe('geen_contract')
  })
})
