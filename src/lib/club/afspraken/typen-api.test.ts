import { describe, expect, it } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { medewerkersHoren } from './typen-api'

const ORG = '33333333-3333-4333-8333-333333333333'
const BUDEL = { sleutel: 'budel', naam: 'Budel', standaard: true }

/** Nepdatabase: club_medewerkers met deze rijen; .in() filtert op id. */
function nepAdmin(rijen: { id: string; vestigingen: string[] }[], fout = false): SupabaseClient {
  return {
    from: () => {
      let ids: string[] = []
      const q = {
        select: () => q,
        eq: () => q,
        in: (_k: string, w: string[]) => {
          ids = w
          return q
        },
        then: (klaar: (r: unknown) => void) =>
          klaar(fout ? { data: null, error: { message: 'kapot' } } : { data: rijen.filter((r) => ids.includes(r.id)), error: null }),
      }
      return q
    },
  } as unknown as SupabaseClient
}

const RIJEN = [
  { id: 'a', vestigingen: ['budel'] },
  { id: 'b', vestigingen: ['eersel'] },
]
const medewerker = (admin: SupabaseClient) => ({ admin, userId: ORG, vestigingen: [BUDEL], rol: 'medewerker' as const })
const kane = (admin: SupabaseClient) => ({ admin, userId: ORG, vestigingen: [BUDEL], rol: 'beheerder' as const })

describe('medewerkersHoren', () => {
  it('een lege lijst is goed', async () => {
    expect(await medewerkersHoren(medewerker(nepAdmin([])), [])).toBe(true)
  })
  it('weigert een medewerker van een andere sportschool', async () => {
    expect(await medewerkersHoren(kane(nepAdmin(RIJEN)), ['a', 'x'])).toBe(false)
  })
  it('Kane koppelt iedereen van de sportschool', async () => {
    expect(await medewerkersHoren(kane(nepAdmin(RIJEN)), ['a', 'b'])).toBe(true)
  })
  it('een medewerker koppelt alleen collega\'s uit zijn eigen vestigingen', async () => {
    expect(await medewerkersHoren(medewerker(nepAdmin(RIJEN)), ['a'])).toBe(true)
    expect(await medewerkersHoren(medewerker(nepAdmin(RIJEN)), ['a', 'b'])).toBe(false)
  })
  it('een collega van elders die er al op stond mag blijven staan', async () => {
    expect(await medewerkersHoren(medewerker(nepAdmin(RIJEN)), ['a', 'b'], ['b'])).toBe(true)
  })
  it('een medewerker haalt geen collega van elders van de lijst', async () => {
    expect(await medewerkersHoren(medewerker(nepAdmin(RIJEN)), ['a'], ['a', 'b'])).toBe(false)
  })
  it('sluit bij een leesfout', async () => {
    expect(await medewerkersHoren(kane(nepAdmin(RIJEN, true)), ['a'])).toBe(false)
  })
})
