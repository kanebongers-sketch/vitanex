import { describe, expect, test } from 'vitest'
import { bestaandeNaamgenoot } from './dubbel'
import type { Persoon } from '@/lib/lifeos/crm/crm'

function persoon(naam: string): Persoon {
  return {
    id: naam,
    naam,
    groep: 'budel_team',
    status: 'nieuw',
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

describe('bestaandeNaamgenoot', () => {
  const groep = [persoon('Linsey'), persoon('Chloé'), persoon('Maartje Velzen')]

  test('zelfde naam, ongeacht hoofdletters/witruimte/accenten', () => {
    expect(bestaandeNaamgenoot('linsey ', groep)?.naam).toBe('Linsey')
    expect(bestaandeNaamgenoot('Chloe', groep)?.naam).toBe('Chloé')
    expect(bestaandeNaamgenoot('maartje  velzen', groep)?.naam).toBe('Maartje Velzen')
  })

  test('andere of deel-naam → null', () => {
    expect(bestaandeNaamgenoot('Lin', groep)).toBeNull()
    expect(bestaandeNaamgenoot('Maartje', groep)).toBeNull()
    expect(bestaandeNaamgenoot('   ', groep)).toBeNull()
  })
})
