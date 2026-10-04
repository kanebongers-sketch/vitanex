import { describe, expect, test } from 'vitest'
import { tijdPerCategorie } from './agenda-tijd'
import type { Afspraak } from '@/lib/lifeos/agenda/vrije-blokken'
import type { Persoon } from '@/lib/lifeos/crm/crm'

function persoon(naam: string, groep: Persoon['groep']): Persoon {
  return {
    id: naam, naam, groep, status: groep === 'pt_klant' ? 'actieve_klant' : 'actief', sortering: 0, followUpDatum: null,
    telefoon: null, email: null, bijzonderheden: null, laatsteContactOp: null, sessiesPerWeek: null, locatie: null,
    vakantieTot: null, abonnement: null, duo: false, aangemaaktOp: '2026-01-01T00:00:00Z',
  }
}

function afspraak(titel: string, start: string, eind: string | null, heleDag = false): Afspraak {
  return { id: titel + start, titel, startOp: new Date(start), eindOp: eind ? new Date(eind) : null, heleDag, locatie: null }
}

const PERSONEN = [persoon('Kevin', 'pt_klant'), persoon('Sanne', 'pt_klant')]

describe('tijdPerCategorie', () => {
  test('telt minuten per categorie, grootste eerst', () => {
    const uit = tijdPerCategorie(
      [
        afspraak('Kevin PT', '2026-09-28T07:00:00Z', '2026-09-28T08:00:00Z'),
        afspraak('Sanne PT', '2026-09-29T07:00:00Z', '2026-09-29T07:30:00Z'),
        afspraak('Tandarts', '2026-09-29T10:00:00Z', '2026-09-29T10:20:00Z'),
      ],
      PERSONEN,
      new Map(),
    )
    expect(uit.map((c) => [c.categorie, c.minuten])).toEqual([
      ['pt_klant', 90],
      ['persoonlijk', 20],
    ])
  })

  test('hele-dag-events en afspraken zonder eind tellen niet mee', () => {
    const uit = tijdPerCategorie(
      [afspraak('Vakantie', '2026-09-28T00:00:00Z', '2026-09-29T00:00:00Z', true), afspraak('Kevin PT', '2026-09-28T07:00:00Z', null)],
      PERSONEN,
      new Map(),
    )
    expect(uit).toEqual([])
  })

  test('je geleerde regels winnen', () => {
    const uit = tijdPerCategorie([afspraak('Tandarts', '2026-09-29T10:00:00Z', '2026-09-29T11:00:00Z')], PERSONEN, new Map([['tandarts', 'marketing']]))
    expect(uit[0]).toMatchObject({ categorie: 'marketing', minuten: 60 })
  })
})
