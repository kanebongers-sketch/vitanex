import { describe, expect, it } from 'vitest'
import { agendaFilter, agendaFilters, isAgendaFilter } from './filter'

describe('agendaFilters', () => {
  it('beide mogen: Alles, Met leden en Team', () => {
    expect(agendaFilters({ team: true, leden: true })).toEqual(['alles', 'leden', 'team'])
  })

  it('zonder pakket Afspraken (of zonder recht): alleen Team, geen Alles', () => {
    expect(agendaFilters({ team: true, leden: false })).toEqual(['team'])
  })

  it('alleen afspraken (trainer zonder agenda): alleen Met leden', () => {
    expect(agendaFilters({ team: false, leden: true })).toEqual(['leden'])
  })

  it('niets: geen filters', () => {
    expect(agendaFilters({ team: false, leden: false })).toEqual([])
  })
})

describe('agendaFilter', () => {
  it('zonder keuze: het eerste filter (Alles als beide mogen)', () => {
    expect(agendaFilter(undefined, { team: true, leden: true })).toEqual({ filters: ['alles', 'leden', 'team'], actief: 'alles' })
    expect(agendaFilter(undefined, { team: true, leden: false }).actief).toBe('team')
  })

  it('een gevraagd filter dat mag, staat open', () => {
    expect(agendaFilter('leden', { team: true, leden: true }).actief).toBe('leden')
    expect(agendaFilter(['team', 'leden'], { team: true, leden: true }).actief).toBe('team')
  })

  it('een filter dat niet mag of onbekend is, valt terug', () => {
    expect(agendaFilter('leden', { team: true, leden: false }).actief).toBe('team')
    expect(agendaFilter('alles', { team: false, leden: true }).actief).toBe('leden')
    expect(agendaFilter('onzin', { team: true, leden: true }).actief).toBe('alles')
  })

  it('niets te zien: actief is null', () => {
    expect(agendaFilter('team', { team: false, leden: false })).toEqual({ filters: [], actief: null })
  })

  it('isAgendaFilter kent alleen de drie', () => {
    expect(isAgendaFilter('alles')).toBe(true)
    expect(isAgendaFilter('afspraken')).toBe(false)
    expect(isAgendaFilter(3)).toBe(false)
  })
})
