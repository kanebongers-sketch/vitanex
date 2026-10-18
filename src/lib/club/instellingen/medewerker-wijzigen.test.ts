// Een medewerker met de rol Instellingen past een collega aan: de vestigingen
// buiten zijn eigen blijven zoals ze waren (hij kan daar niets toevoegen of weghalen).

import { describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/club/toegang', () => ({ logActie: async () => undefined }))

import { nepSupabase } from '@/lib/club/beheerders/nep-supabase'
import type { ClubToegang } from '@/lib/club/toegang'
import { wijzigItem } from './opslag'

const ORG = '33333333-3333-4333-8333-333333333333'
const COLLEGA = '44444444-4444-4444-8444-444444444444'
const BUDEL = { sleutel: 'budel', naam: 'Budel', standaard: true }
const EERSEL = { sleutel: 'eersel', naam: 'Eersel', standaard: false }

function opzet(rol: string, vestigingen = [BUDEL]) {
  const db = nepSupabase((v) => {
    if (v.tabel === 'club_medewerkers' && v.actie === 'select') return { data: { vestigingen: ['budel', 'eersel'] }, error: null }
    if (v.tabel === 'club_medewerkers' && v.actie === 'update') return { data: [{ id: COLLEGA }], error: null }
    return { data: null, error: null }
  })
  const t = { admin: db.admin, userId: ORG, rol, vestigingen } as unknown as ClubToegang
  return { t, vragen: db.vragen }
}

const bijgewerkt = (vragen: ReturnType<typeof opzet>['vragen']) => vragen.find((v) => v.actie === 'update')?.waarde as Record<string, unknown>

describe('wijzigItem voor medewerkers', () => {
  it('een medewerker haalt een collega niet weg uit een vestiging die niet van hem is', async () => {
    const { t, vragen } = opzet('medewerker')
    const uit = await wijzigItem(t, 'medewerkers', COLLEGA, 'budel', { vestigingen: ['budel'] })
    expect(uit.ok).toBe(true)
    expect(bijgewerkt(vragen).vestigingen).toEqual(['budel', 'eersel'])
  })

  it('Kane vervangt de vestigingen zoals gevraagd', async () => {
    const { t, vragen } = opzet('beheerder', [BUDEL, EERSEL])
    await wijzigItem(t, 'medewerkers', COLLEGA, 'budel', { vestigingen: ['budel'] })
    expect(bijgewerkt(vragen).vestigingen).toEqual(['budel'])
    expect(vragen.some((v) => v.actie === 'select')).toBe(false)
  })

  it('zonder vestigingen in het verzoek wordt er niets extra gelezen', async () => {
    const { t, vragen } = opzet('medewerker')
    await wijzigItem(t, 'medewerkers', COLLEGA, 'budel', { rollen: ['trainer'] })
    expect(vragen.some((v) => v.actie === 'select')).toBe(false)
    expect(bijgewerkt(vragen)).not.toHaveProperty('vestigingen')
  })
})
