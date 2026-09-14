import { describe, expect, test } from 'vitest'
import { matchPersoonInTitel, groepKort, koppelTekst } from './agenda-match'
import type { Persoon, Groep } from './crm'

function persoon(naam: string, groep: Groep = 'pt_klant'): Persoon {
  return {
    id: crypto.randomUUID(),
    naam,
    groep,
    status: 'actieve_klant',
    sortering: 0,
    followUpDatum: null,
    telefoon: null,
    email: null,
    bijzonderheden: null,
    laatsteContactOp: null,
    sessiesPerWeek: null,
    locatie: null,
    vakantieTot: null,
    abonnement: null,
    duo: false,
    aangemaaktOp: '2026-01-01T00:00:00Z',
  }
}

describe('matchPersoonInTitel', () => {
  test('lege of naamloze titel = geen match', () => {
    expect(matchPersoonInTitel(null, [persoon('Sanne')]).soort).toBe('geen')
    expect(matchPersoonInTitel('Boodschappen doen', [persoon('Sanne')]).soort).toBe('geen')
  })

  test('voornaam als los woord matcht (hoofdletter-ongevoelig)', () => {
    const p = persoon('Sanne')
    const m = matchPersoonInTitel('Training sanne 10:00', [p])
    expect(m).toEqual({ soort: 'match', persoon: p })
  })

  test('volledige naam matcht aaneengesloten', () => {
    const p = persoon('Sanne Bakker')
    const m = matchPersoonInTitel('Intake Sanne Bakker', [p])
    expect(m).toEqual({ soort: 'match', persoon: p })
  })

  test('deel van een langer woord telt niet', () => {
    expect(matchPersoonInTitel('Tomaten kopen', [persoon('Tom')]).soort).toBe('geen')
  })

  test('twee mensen met dezelfde voornaam = ambigu, geen gok', () => {
    const a = persoon('Sanne Bakker')
    const b = persoon('Sanne de Vries', 'pt_team')
    const m = matchPersoonInTitel('Bellen met Sanne', [a, b])
    expect(m.soort).toBe('ambigu')
    if (m.soort !== 'ambigu') throw new Error('verwacht ambigu')
    expect(m.kandidaten).toHaveLength(2)
  })

  test('volledige naam wint van een losse voornaam van iemand anders', () => {
    const bakker = persoon('Sanne Bakker')
    const vries = persoon('Sanne de Vries')
    // Titel bevat de volledige naam van Bakker én de voornaam die beiden delen.
    const m = matchPersoonInTitel('Sanne Bakker intake', [bakker, vries])
    expect(m).toEqual({ soort: 'match', persoon: bakker })
  })

  test('accenten matchen', () => {
    const p = persoon('Renée')
    expect(matchPersoonInTitel('Sessie Renée', [p]).soort).toBe('match')
  })
})

describe('groepKort / koppelTekst', () => {
  test('korte groepnaam per groep', () => {
    expect(groepKort('pt_klant')).toBe('PT-klant')
    expect(groepKort('budel_team')).toBe('Team Budel')
    expect(groepKort('pt_team')).toBe('PT-team')
  })

  test('koppelTekst: match → "Naam · groep", ambigu → melding, geen → null', () => {
    expect(koppelTekst({ soort: 'match', persoon: persoon('Sanne', 'pt_klant') })).toBe('Sanne · PT-klant')
    expect(koppelTekst({ soort: 'ambigu', kandidaten: [] })).toBe('meerdere mogelijke personen')
    expect(koppelTekst({ soort: 'geen' })).toBeNull()
  })
})
