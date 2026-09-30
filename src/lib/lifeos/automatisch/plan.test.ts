import { describe, expect, test } from 'vitest'
import { isPersoonsnaam, logSleutel, planAutomatischeActies, type PlanInvoer } from './plan'

const LEEG: PlanInvoer = { statusHints: [], typfouten: [], onbekend: [] }

describe('isPersoonsnaam', () => {
  test('namen wel, afspraken niet', () => {
    expect(isPersoonsnaam('Darren')).toBe(true)
    expect(isPersoonsnaam('Rens en Natasha')).toBe(true)
    expect(isPersoonsnaam('John van der Sanden')).toBe(true)
    expect(isPersoonsnaam('Vergadering Fit Factory')).toBe(false)
    expect(isPersoonsnaam('Marit Social Media')).toBe(false)
    expect(isPersoonsnaam('')).toBe(false)
    expect(isPersoonsnaam('Klant 12')).toBe(false)
  })
})

describe('planAutomatischeActies', () => {
  test('status, typfout per afspraak en een nieuwe naam', () => {
    const acties = planAutomatischeActies(
      {
        statusHints: [{ id: 'p1', naam: 'Nicolle', status: 'moet_benaderen', sessies: 8, statusLabel: 'Moet benaderen' }],
        typfouten: [{ titel: 'Kevnin', bedoeld: 'Kevin', op: '2026-09-22T17:30:00Z', eventIds: ['e1', 'e2'], nieuweTitel: 'Kevin' }],
        onbekend: [
          { titel: 'Darren PT', aantal: 2, laatsteOp: '2026-09-25T09:30:00Z', naam: 'Darren' },
          { titel: 'Vergadering Fit Factory PT', aantal: 1, laatsteOp: '2026-08-20T08:00:00Z', naam: 'Vergadering Fit Factory' },
        ],
      },
      new Set(),
    )
    expect(acties.map((a) => `${a.soort}:${a.sleutel}`)).toEqual([
      'status_actief:p1',
      'typfout:e1',
      'typfout:e2',
      'persoon_toegevoegd:darren',
    ])
    expect(acties[0].omschrijving).toBe('Nicolle op Actieve klant gezet (8× getraind in 8 weken)')
  })

  test('wat al ooit gebeurde (of door jou teruggedraaid is) gebeurt nooit opnieuw', () => {
    const gedaan = new Set([logSleutel('status_actief', 'p1'), logSleutel('persoon_toegevoegd', 'darren'), logSleutel('typfout', 'e1')])
    const acties = planAutomatischeActies(
      {
        statusHints: [{ id: 'p1', naam: 'Nicolle', status: 'moet_benaderen', sessies: 8, statusLabel: 'Moet benaderen' }],
        typfouten: [{ titel: 'Kevnin', bedoeld: 'Kevin', op: '2026-09-22T17:30:00Z', eventIds: ['e1', 'e3'], nieuweTitel: 'Kevin' }],
        onbekend: [{ titel: 'Darren PT', aantal: 2, laatsteOp: '2026-09-25T09:30:00Z', naam: 'Darren' }],
      },
      gedaan,
    )
    expect(acties.map((a) => a.sleutel)).toEqual(['e3'])
  })

  test('niets te doen → leeg', () => {
    expect(planAutomatischeActies(LEEG, new Set())).toEqual([])
  })
})
