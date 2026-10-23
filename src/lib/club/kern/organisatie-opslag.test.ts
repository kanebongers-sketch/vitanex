import { describe, expect, it } from 'vitest'
import type { ClubToegang } from '@/lib/club/toegang'
import { nepSupabase, heeftFilter } from '@/lib/club/beheerders/nep-supabase'
import { REPDB_ALLE_KOPPELINGEN, isStandaardOefening } from '@/lib/club/training/beelden-repdb'
import { maakOrganisatie } from './organisatie-opslag'

// Tenant-scheiding bij het aanmaken van een sportschool: de nieuwe sportschool
// krijgt de standaardbibliotheek, nooit de eigen oefeningen van een andere
// sportschool (ook niet die van de eigen sportschool van het platform).

const PLATFORM = '11111111-1111-4111-8111-111111111111'
const STANDAARD = REPDB_ALLE_KOPPELINGEN[0].naam

function toegang(admin: ClubToegang['admin']): ClubToegang {
  return { admin, userId: PLATFORM, beheerderId: PLATFORM, organisaties: [], rol: 'beheerder', isPlatformEigenaar: true, persoonId: null, onderdelen: null, vestigingen: [], naam: 'Test' } as unknown as ClubToegang
}

describe('isStandaardOefening', () => {
  it('kent de standaardbibliotheek en niets anders', () => {
    expect(isStandaardOefening(STANDAARD)).toBe(true)
    expect(isStandaardOefening('Bootcamp-circuit van de eigen club')).toBe(false)
    expect(isStandaardOefening(null)).toBe(false)
  })
})

describe('maakOrganisatie', () => {
  it('kopieert alleen standaardoefeningen, onder het id van de nieuwe sportschool', async () => {
    const { admin, vragen } = nepSupabase((v) => {
      if (v.tabel === 'club_oefeningen' && v.actie === 'select') return { data: [{ naam: STANDAARD, uitleg: 'x' }, { naam: 'Bootcamp-circuit van de eigen club', uitleg: 'eigen werk' }], error: null }
      return { data: null, error: null }
    })
    const uit = await maakOrganisatie(toegang(admin), 'Gym Mark')
    expect(uit.ok).toBe(true)
    if (!uit.ok) return
    const lezen = vragen.find((v) => v.tabel === 'club_oefeningen' && v.actie === 'select')
    expect(lezen && heeftFilter(lezen, 'user_id', PLATFORM)).toBe(true)
    const kopie = vragen.find((v) => v.tabel === 'club_oefeningen' && v.actie === 'insert')
    expect(kopie?.waarde).toEqual([{ naam: STANDAARD, uitleg: 'x', user_id: uit.id, actief: true }])
  })
})
