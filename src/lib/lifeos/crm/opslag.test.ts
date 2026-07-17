// Tests voor de pure narrowing van een DB-rij → `Persoon`. De systeemgrens: de
// database geeft snake_case en soms een halve/kapotte rij; hier houden we de
// goede rijen en gooien we de onbruikbare weg — zonder cast. Zelfde conventie als
// `taakVanRij`.

import { describe, expect, it } from 'vitest'
import { persoonVanRij, personenVanRijen } from '@/lib/lifeos/crm/opslag'

/** Een complete, gezonde DB-rij zoals PostgREST 'm teruggeeft (snake_case). */
function rij(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    naam: 'Jan Jansen',
    groep: 'pt_klant',
    status: 'benaderd',
    sortering: 2000,
    follow_up_datum: '2026-07-20',
    telefoon: '0612345678',
    email: 'jan@example.com',
    bijzonderheden: 'Wil graag zaterdag',
    laatste_contact_op: '2026-07-17T09:00:00.000Z',
    aangemaakt_op: '2026-07-01T08:00:00.000Z',
    ...overrides,
  }
}

describe('persoonVanRij', () => {
  it('narrowt een complete rij naar camelCase', () => {
    expect(persoonVanRij(rij())).toEqual({
      id: '11111111-1111-1111-1111-111111111111',
      naam: 'Jan Jansen',
      groep: 'pt_klant',
      status: 'benaderd',
      sortering: 2000,
      followUpDatum: '2026-07-20',
      telefoon: '0612345678',
      email: 'jan@example.com',
      bijzonderheden: 'Wil graag zaterdag',
      laatsteContactOp: '2026-07-17T09:00:00.000Z',
      aangemaaktOp: '2026-07-01T08:00:00.000Z',
    })
  })

  it('leest lege/ontbrekende optionele velden als null', () => {
    const uit = persoonVanRij(
      rij({
        follow_up_datum: null,
        telefoon: null,
        email: null,
        bijzonderheden: null,
        laatste_contact_op: null,
      }),
    )
    expect(uit?.followUpDatum).toBeNull()
    expect(uit?.telefoon).toBeNull()
    expect(uit?.email).toBeNull()
    expect(uit?.bijzonderheden).toBeNull()
    expect(uit?.laatsteContactOp).toBeNull()
  })

  it('slaat een rij zonder identiteits-velden over (→ null)', () => {
    expect(persoonVanRij(rij({ id: null }))).toBeNull()
    expect(persoonVanRij(rij({ naam: '   ' }))).toBeNull() // leeg na trim
    expect(persoonVanRij(rij({ status: null }))).toBeNull()
    expect(persoonVanRij(rij({ aangemaakt_op: null }))).toBeNull()
  })

  it('weigert een rij met een onbekende groep', () => {
    expect(persoonVanRij(rij({ groep: 'pt_klanten' }))).toBeNull()
    expect(persoonVanRij(rij({ groep: null }))).toBeNull()
  })

  it('valt terug op sortering 0 als de waarde onleesbaar is', () => {
    expect(persoonVanRij(rij({ sortering: 'eerste' }))?.sortering).toBe(0)
    expect(persoonVanRij(rij({ sortering: null }))?.sortering).toBe(0)
    expect(persoonVanRij(rij({ sortering: Number.NaN }))?.sortering).toBe(0)
  })

  it('accepteert een float-sortering (voor slepen tussen twee tegels)', () => {
    expect(persoonVanRij(rij({ sortering: 1500.5 }))?.sortering).toBe(1500.5)
  })

  it('weigert niet-objecten', () => {
    expect(persoonVanRij(null)).toBeNull()
    expect(persoonVanRij('rij')).toBeNull()
    expect(persoonVanRij([rij()])).toBeNull()
  })
})

describe('personenVanRijen', () => {
  it('houdt de goede rijen en gooit de kapotte weg', () => {
    const uit = personenVanRijen([rij({ naam: 'Kim' }), { kapot: true }, rij({ naam: 'Sam' })])
    expect(uit.map((p) => p.naam)).toEqual(['Kim', 'Sam'])
  })

  it('geeft een lege lijst bij een lege invoer', () => {
    expect(personenVanRijen([])).toEqual([])
  })
})
