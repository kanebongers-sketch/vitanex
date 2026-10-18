import { describe, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'

vi.mock('@/lib/club/toegang', () => ({
  clubFout: (fout: string, status: number) => ({ fout, status }),
}))

import { eisVestigingVanRecord, recordInEigenVestiging } from './vestiging-toegang'

const ID = '11111111-1111-4111-8111-111111111111'
const LID = '22222222-2222-4222-8222-222222222222'
const ORG = '33333333-3333-4333-8333-333333333333'

type Rij = Record<string, unknown> | null

/** Een nepdatabase: per tabel de rij die terugkomt (of een fout). */
function nepAdmin(rijen: Record<string, Rij | 'fout'>): SupabaseClient {
  return {
    from: (tabel: string) => {
      const q = {
        select: () => q,
        eq: () => q,
        maybeSingle: async () => {
          const r = rijen[tabel]
          if (r === 'fout') return { data: null, error: { message: 'kapot' } }
          return { data: r ?? null, error: null }
        },
      }
      return q
    },
  } as unknown as SupabaseClient
}

const eigen = (admin: SupabaseClient) => ({ admin, userId: ORG, vestigingen: [{ sleutel: 'budel', naam: 'Budel', standaard: true }] })

describe('recordInEigenVestiging', () => {
  it('laat een record van een eigen vestiging toe', async () => {
    expect(await recordInEigenVestiging(eigen(nepAdmin({ club_lessen: { vestiging: 'budel' } })), 'club_lessen', ID)).toBe(true)
  })
  it('weigert een record van een andere vestiging', async () => {
    expect(await recordInEigenVestiging(eigen(nepAdmin({ club_lessen: { vestiging: 'eersel' } })), 'club_lessen', ID)).toBe(false)
  })
  it('laat een onbekend of ongeldig id door (de route geeft zijn eigen 404)', async () => {
    expect(await recordInEigenVestiging(eigen(nepAdmin({})), 'club_lessen', ID)).toBe(true)
    expect(await recordInEigenVestiging(eigen(nepAdmin({})), 'club_lessen', 'geen-uuid')).toBe(true)
  })
  it('sluit bij een leesfout (liever dicht dan open)', async () => {
    expect(await recordInEigenVestiging(eigen(nepAdmin({ club_leden: 'fout' })), 'club_leden', ID)).toBe(false)
  })
  it('volgt een meting naar de vestiging van het lid', async () => {
    const ok = nepAdmin({ club_metingen: { lid_id: LID }, club_leden: { vestiging: 'budel' } })
    const nee = nepAdmin({ club_metingen: { lid_id: LID }, club_leden: { vestiging: 'eersel' } })
    expect(await recordInEigenVestiging(eigen(ok), 'club_metingen', ID)).toBe(true)
    expect(await recordInEigenVestiging(eigen(nee), 'club_metingen', ID)).toBe(false)
  })
  it('een schema zonder lid is voor de hele sportschool', async () => {
    expect(await recordInEigenVestiging(eigen(nepAdmin({ club_schemas: { lid_id: null } })), 'club_schemas', ID)).toBe(true)
  })
  it('volgt een reservering naar de les', async () => {
    const nee = nepAdmin({ club_reserveringen: { les_id: LID }, club_lessen: { vestiging: 'eersel' } })
    expect(await recordInEigenVestiging(eigen(nee), 'club_reserveringen', ID)).toBe(false)
  })
})

describe('recordInEigenVestiging voor medewerkers', () => {
  const alsMedewerker = (admin: SupabaseClient) => ({ ...eigen(admin), rol: 'medewerker' })
  it('laat een collega toe die een vestiging deelt', async () => {
    const admin = nepAdmin({ club_medewerkers: { vestigingen: ['eersel', 'budel'] } })
    expect(await recordInEigenVestiging(alsMedewerker(admin), 'club_medewerkers', ID)).toBe(true)
  })
  it('weigert een collega uit een andere vestiging of zonder vestiging', async () => {
    expect(await recordInEigenVestiging(alsMedewerker(nepAdmin({ club_medewerkers: { vestigingen: ['eersel'] } })), 'club_medewerkers', ID)).toBe(false)
    expect(await recordInEigenVestiging(alsMedewerker(nepAdmin({ club_medewerkers: { vestigingen: [] } })), 'club_medewerkers', ID)).toBe(false)
  })
  it('Kane en de eigenaar zien elke collega', async () => {
    const admin = nepAdmin({ club_medewerkers: { vestigingen: [] } })
    expect(await recordInEigenVestiging({ ...eigen(admin), rol: 'beheerder' }, 'club_medewerkers', ID)).toBe(true)
  })
  it('volgt beschikbaarheid naar de medewerker', async () => {
    const nee = nepAdmin({ club_beschikbaarheid: { medewerker_id: LID }, club_medewerkers: { vestigingen: ['eersel'] } })
    const ja = nepAdmin({ club_beschikbaarheid: { medewerker_id: LID }, club_medewerkers: { vestigingen: ['budel'] } })
    expect(await recordInEigenVestiging(alsMedewerker(nee), 'club_beschikbaarheid', ID)).toBe(false)
    expect(await recordInEigenVestiging(alsMedewerker(ja), 'club_beschikbaarheid', ID)).toBe(true)
  })
  it('sluit bij een leesfout', async () => {
    expect(await recordInEigenVestiging(alsMedewerker(nepAdmin({ club_medewerkers: 'fout' })), 'club_medewerkers', ID)).toBe(false)
  })
})

describe('eisVestigingVanRecord', () => {
  it('geeft null als het mag en een 404 als het niet mag', async () => {
    expect(await eisVestigingVanRecord(eigen(nepAdmin({ club_leden: { vestiging: 'budel' } })), 'club_leden', ID)).toBeNull()
    expect(await eisVestigingVanRecord(eigen(nepAdmin({ club_leden: { vestiging: 'eersel' } })), 'club_leden', ID)).toMatchObject({ status: 404 })
  })
})
