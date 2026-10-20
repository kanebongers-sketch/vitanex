import { describe, expect, it } from 'vitest'
import { foutMetNaam, nietKlaarVoorLid } from './controle'
import type { EditorRegel, EditorStaat } from './editor'

function regel(sleutel: string, dag: number, oefeningId: string): EditorRegel {
  return {
    sleutel, dag, oefeningId, groep: null, maat: 'herhalingen', sets: '3', herhalingen: '10', tijdSec: '', gewichtKg: '',
    inspanning: 'geen', inspanningWaarde: '', rustSec: '60', tempo: '', notitie: '',
  }
}

// Dag 2 staat in de editor tussen dag 1 in; naar de API gaat alles per dag.
const staat: EditorStaat = {
  dagTitels: ['Boven', 'Onder'],
  regels: [regel('a', 1, 'o-bank'), regel('c', 2, 'o-squat'), regel('b', 1, 'o-roeien')],
}
const namen: Record<string, string> = { 'o-bank': 'Bankdrukken', 'o-squat': 'Back squat', 'o-roeien': 'Roeien' }
const naamVan = (id: string) => namen[id]

describe('foutMetNaam', () => {
  it('zet dag en naam bij een fout over een oefening, in de volgorde van de API', () => {
    expect(foutMetNaam('Oefening 2: sets moet tussen 1 en 20 liggen.', staat, naamVan)).toBe('Dag A, Roeien: sets moet tussen 1 en 20 liggen.')
    expect(foutMetNaam('Oefening 3: tempo is vier cijfers, bijvoorbeeld 3110.', staat, naamVan)).toBe('Dag B, Back squat: tempo is vier cijfers, bijvoorbeeld 3110.')
  })
  it('laat andere meldingen en onbekende nummers staan', () => {
    expect(foutMetNaam('Geef het schema een naam.', staat, naamVan)).toBe('Geef het schema een naam.')
    expect(foutMetNaam('Oefening 9: ongeldig.', staat, naamVan)).toBe('Oefening 9: ongeldig.')
  })
  it('noemt een oefening zonder naam onbekend', () => {
    expect(foutMetNaam('Oefening 1: ongeldig.', staat, () => undefined)).toBe('Dag A, onbekende oefening: ongeldig.')
  })
})

describe('nietKlaarVoorLid', () => {
  it('is klaar als elke dag oefeningen heeft', () => {
    expect(nietKlaarVoorLid(staat)).toBeNull()
  })
  it('weigert een leeg schema', () => {
    expect(nietKlaarVoorLid({ dagTitels: ['Dag A'], regels: [] })).toContain('Voeg eerst oefeningen toe')
  })
  it('noemt de lege dagen', () => {
    expect(nietKlaarVoorLid({ ...staat, dagTitels: ['Boven', 'Onder', 'Dag C'] })).toBe('Dag C heeft nog geen oefeningen. Voeg er een toe of verwijder de dag.')
    expect(nietKlaarVoorLid({ dagTitels: ['A', 'B', 'C', 'D'], regels: [regel('a', 2, 'o-bank')] })).toBe('Dag A, C en D hebben nog geen oefeningen. Voeg er een toe of verwijder de dag.')
  })
})
