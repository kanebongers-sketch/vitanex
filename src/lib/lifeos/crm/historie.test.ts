// Tests voor de pure kern van het historie-logboek:
//  - `historieRijVoor` spiegelt de DB-constraint `crm_historie_status_consistent`:
//    een status-wijziging vereist een naar-status; geen andere soort mag status-
//    velden dragen. Deze laag maakt dat al bij het bouwen onmogelijk.
//  - `historieVanRij` narrowt een DB-rij → HistorieItem (snake_case → camelCase).
//  - `leesLosseNotitie` valideert de POST-body van de "notitie toevoegen"-actie.

import { describe, expect, it } from 'vitest'
import {
  historieRijVoor,
  historieVanRij,
  historieVanRijen,
  leesLosseNotitie,
} from '@/lib/lifeos/crm/historie'

describe('historieRijVoor — de constraint', () => {
  it('bouwt een status-wijziging met van/naar', () => {
    expect(
      historieRijVoor({ soort: 'status_wijziging', vanStatus: 'benaderd', naarStatus: 'actieve_klant' }),
    ).toEqual({
      soort: 'status_wijziging',
      van_status: 'benaderd',
      naar_status: 'actieve_klant',
      notitie: null,
    })
  })

  it('laat van_status null bij een begin-regel (nieuwe persoon)', () => {
    const rij = historieRijVoor({ soort: 'status_wijziging', vanStatus: null, naarStatus: 'moet_benaderen' })
    expect(rij).toEqual({
      soort: 'status_wijziging',
      van_status: null,
      naar_status: 'moet_benaderen',
      notitie: null,
    })
  })

  it('weigert een status-wijziging zonder naar-status (schendt de constraint)', () => {
    expect(historieRijVoor({ soort: 'status_wijziging', vanStatus: 'x', naarStatus: '   ' })).toBeNull()
  })

  it('geeft contact_gelegd en follow_up_gezet ZONDER status-velden', () => {
    expect(historieRijVoor({ soort: 'contact_gelegd' })).toEqual({
      soort: 'contact_gelegd',
      van_status: null,
      naar_status: null,
      notitie: null,
    })
    expect(historieRijVoor({ soort: 'follow_up_gezet' })).toEqual({
      soort: 'follow_up_gezet',
      van_status: null,
      naar_status: null,
      notitie: null,
    })
  })

  it('draagt een optionele notitie mee bij contact_gelegd', () => {
    expect(historieRijVoor({ soort: 'contact_gelegd', notitie: '  gebeld, geen gehoor ' })?.notitie).toBe(
      'gebeld, geen gehoor',
    )
  })

  it('bouwt een losse notitie', () => {
    expect(historieRijVoor({ soort: 'notitie', notitie: 'intake vrijdag' })).toEqual({
      soort: 'notitie',
      van_status: null,
      naar_status: null,
      notitie: 'intake vrijdag',
    })
  })
})

describe('historieVanRij', () => {
  function rij(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
      id: '22222222-2222-2222-2222-222222222222',
      soort: 'status_wijziging',
      van_status: 'benaderd',
      naar_status: 'actieve_klant',
      notitie: null,
      aangemaakt_op: '2026-07-17T09:00:00.000Z',
      ...overrides,
    }
  }

  it('narrowt een complete rij naar camelCase', () => {
    expect(historieVanRij(rij())).toEqual({
      id: '22222222-2222-2222-2222-222222222222',
      soort: 'status_wijziging',
      vanStatus: 'benaderd',
      naarStatus: 'actieve_klant',
      notitie: null,
      aangemaaktOp: '2026-07-17T09:00:00.000Z',
    })
  })

  it('slaat een rij met een onbekende soort over (→ null)', () => {
    expect(historieVanRij(rij({ soort: 'iets_anders' }))).toBeNull()
  })

  it('slaat een rij zonder id of aangemaakt_op over (→ null)', () => {
    expect(historieVanRij(rij({ id: null }))).toBeNull()
    expect(historieVanRij(rij({ aangemaakt_op: null }))).toBeNull()
  })

  it('houdt de goede rijen en gooit de kapotte weg', () => {
    const uit = historieVanRijen([rij(), { kapot: true }, rij({ soort: 'notitie', notitie: 'x' })])
    expect(uit).toHaveLength(2)
    expect(uit.map((h) => h.soort)).toEqual(['status_wijziging', 'notitie'])
  })
})

describe('leesLosseNotitie', () => {
  it('accepteert een getrimde niet-lege notitie', () => {
    const uit = leesLosseNotitie({ soort: 'notitie', notitie: '  gebeld  ' })
    expect(uit.ok && uit.waarde).toBe('gebeld')
  })

  it('weigert een verkeerde soort', () => {
    expect(leesLosseNotitie({ soort: 'status_wijziging', notitie: 'x' }).ok).toBe(false)
  })

  it('weigert een lege of ontbrekende notitie', () => {
    expect(leesLosseNotitie({ soort: 'notitie', notitie: '   ' }).ok).toBe(false)
    expect(leesLosseNotitie({ soort: 'notitie' }).ok).toBe(false)
  })

  it('weigert niet-objecten', () => {
    expect(leesLosseNotitie(null).ok).toBe(false)
    expect(leesLosseNotitie('notitie').ok).toBe(false)
  })
})
