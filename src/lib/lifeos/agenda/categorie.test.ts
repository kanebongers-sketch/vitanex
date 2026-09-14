import { describe, expect, test } from 'vitest'
import { categoriseerAfspraak, categorieLabel, CATEGORIE_VOLGORDE } from './categorie'
import type { Persoon, Groep } from '@/lib/lifeos/crm/crm'

function persoon(naam: string, groep: Groep): Persoon {
  return {
    id: crypto.randomUUID(),
    naam,
    groep,
    status: 'actief',
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

const personen = [
  persoon('Kevin', 'pt_klant'),
  persoon('Luna', 'pt_team'),
  persoon('Ruben', 'management'),
  persoon('Nieck', 'budel_team'),
]

describe('categoriseerAfspraak', () => {
  test('matcht naar de groep van de gekoppelde persoon', () => {
    expect(categoriseerAfspraak('Training Kevin', personen)).toBe('pt_klant')
    expect(categoriseerAfspraak('Overleg Ruben', personen)).toBe('management')
    expect(categoriseerAfspraak('1-op-1 Luna', personen)).toBe('pt_team')
    expect(categoriseerAfspraak('Nieck bijpraten', personen)).toBe('budel_team')
  })

  test('geen match → Overig (het wegfilter-vak)', () => {
    expect(categoriseerAfspraak('Tandarts', personen)).toBe('overig')
    expect(categoriseerAfspraak('Boodschappen', personen)).toBe('overig')
  })

  test('ambigu (twee dezelfde voornaam) → Overig, geen gok', () => {
    const twee = [persoon('Kevin', 'pt_klant'), persoon('Kevin', 'management')]
    expect(categoriseerAfspraak('Bellen Kevin', twee)).toBe('overig')
  })

  test('Persoonlijk komt nooit uit de auto-afleiding (leer-categorie)', () => {
    for (const titel of ['Tandarts', 'Sporten', 'Verjaardag']) {
      expect(categoriseerAfspraak(titel, personen)).not.toBe('persoonlijk')
    }
  })
})

describe('categorieLabel / volgorde', () => {
  test('labels per categorie', () => {
    expect(categorieLabel('pt_klant')).toBe('PT-klanten')
    expect(categorieLabel('management')).toBe('Management')
    expect(categorieLabel('persoonlijk')).toBe('Persoonlijk')
    expect(categorieLabel('overig')).toBe('Overig')
  })

  test('Overig staat achteraan in de volgorde', () => {
    expect(CATEGORIE_VOLGORDE[CATEGORIE_VOLGORDE.length - 1]).toBe('overig')
    expect(CATEGORIE_VOLGORDE).toContain('management')
  })
})
