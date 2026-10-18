import { describe, expect, it } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { geefStrippenTerug, geraakteReserveringen, stripTerugNaAnnuleren } from './terug-bij-annuleren'

interface RpcAanroep {
  naam: string
  args: Record<string, unknown>
}

/** Een nep-Supabase: een reservering om te lezen en een rpc die per reservering antwoordt. */
function nepAdmin(rij: Record<string, unknown> | null, terug: (reservering: unknown) => boolean | 'fout') {
  const aanroepen: RpcAanroep[] = []
  const keten = {
    select: () => keten,
    eq: () => keten,
    maybeSingle: async () => ({ data: rij, error: null }),
  }
  const admin = {
    from: () => keten,
    rpc: async (naam: string, args: Record<string, unknown>) => {
      aanroepen.push({ naam, args })
      const uit = terug(args.p_reservering)
      return uit === 'fout' ? { data: null, error: { code: 'X', message: 'storing' } } : { data: uit, error: null }
    },
  }
  return { admin: admin as unknown as SupabaseClient, aanroepen }
}

describe('geraakteReserveringen', () => {
  it('neemt alleen rijen met een id en een lid', () => {
    const uit = geraakteReserveringen([{ id: 'r1', lid_id: 'l1' }, { id: 'r2', lid_id: null }, { id: 3, lid_id: 'l3' }, { id: 'r4', lid_id: 'l4', geboekt_op: 'x' }])
    expect(uit).toEqual([{ reserveringId: 'r1', lidId: 'l1' }, { reserveringId: 'r4', lidId: 'l4' }])
  })
})

describe('geefStrippenTerug', () => {
  it('vraagt per geraakte reservering de strip terug en telt wat terugging', async () => {
    const { admin, aanroepen } = nepAdmin(null, (r) => (r === 'r2' ? 'fout' : r === 'r1'))
    const aantal = await geefStrippenTerug(admin, 'org', [{ reserveringId: 'r1', lidId: 'l1' }, { reserveringId: 'r2', lidId: 'l2' }, { reserveringId: 'r3', lidId: 'l3' }], 'Kane')
    expect(aantal).toBe(1)
    expect(aanroepen.map((a) => a.naam)).toEqual(['club_betalen_teruggeven', 'club_betalen_teruggeven', 'club_betalen_teruggeven'])
    expect(aanroepen[0].args).toEqual({ p_user: 'org', p_lid: 'l1', p_reservering: 'r1', p_afspraak: null, p_door: 'Kane' })
  })

  it('doet niets zonder geraakte reserveringen', async () => {
    const { admin, aanroepen } = nepAdmin(null, () => true)
    expect(await geefStrippenTerug(admin, 'org', [], 'Kane')).toBe(0)
    expect(aanroepen).toHaveLength(0)
  })
})

describe('stripTerugNaAnnuleren', () => {
  it('geeft de strip terug na een tijdige annulering', async () => {
    const { admin, aanroepen } = nepAdmin({ status: 'geannuleerd', te_laat: false, lid_id: 'l1' }, () => true)
    expect(await stripTerugNaAnnuleren(admin, 'org', 'r1', 'Balie')).toBe(true)
    expect(aanroepen[0].args).toMatchObject({ p_lid: 'l1', p_reservering: 'r1', p_door: 'Balie' })
  })

  it('geen strip terug bij te laat, niet geannuleerd of zonder lid', async () => {
    for (const rij of [{ status: 'geannuleerd', te_laat: true, lid_id: 'l1' }, { status: 'geboekt', te_laat: false, lid_id: 'l1' }, { status: 'geannuleerd', te_laat: false, lid_id: null }, null]) {
      const { admin, aanroepen } = nepAdmin(rij, () => true)
      expect(await stripTerugNaAnnuleren(admin, 'org', 'r1', 'Balie')).toBe(false)
      expect(aanroepen).toHaveLength(0)
    }
  })

  it('met een lid erbij: alleen voor een reservering van dat lid', async () => {
    const { admin, aanroepen } = nepAdmin({ status: 'geannuleerd', te_laat: false, lid_id: 'l1' }, () => true)
    expect(await stripTerugNaAnnuleren(admin, 'org', 'r1', 'Lid', 'l2')).toBe(false)
    expect(aanroepen).toHaveLength(0)
  })
})
