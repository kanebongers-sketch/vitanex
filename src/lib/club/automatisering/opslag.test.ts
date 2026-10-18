import { describe, expect, it } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { haalBezoekTotalen } from './opslag'

/** Een nep-RPC met `aantal` leden, die net als PostgREST per verzoek hoogstens 1000 rijen geeft. */
function nepAdmin(aantal: number, fout = false): { admin: SupabaseClient; verzoeken: [number, number][] } {
  const alle = Array.from({ length: aantal }, (_, i) => ({ lid_id: `lid-${String(i).padStart(5, '0')}`, totaal: 3, voor: 1 }))
  const verzoeken: [number, number][] = []
  const admin = {
    rpc: () => {
      const q = {
        order: () => q,
        range: async (van: number, tot: number) => {
          verzoeken.push([van, tot])
          if (fout) return { data: null, error: { message: 'kapot' } }
          return { data: alle.slice(van, Math.min(tot + 1, van + 1000)), error: null }
        },
      }
      return q
    },
  } as unknown as SupabaseClient
  return { admin, verzoeken }
}

describe('haalBezoekTotalen', () => {
  it('leest alle leden, ook boven de 1000 rijen', async () => {
    const { admin, verzoeken } = nepAdmin(2_345)
    const uit = await haalBezoekTotalen(admin, 'org', 'budel', new Date('2026-10-01T00:00:00Z'))
    expect(uit?.size).toBe(2_345)
    expect(uit?.get('lid-02344')).toEqual({ totaal: 3, voor: 1 })
    expect(verzoeken).toEqual([[0, 999], [1000, 1999], [2000, 2999]])
  })

  it('geeft null bij een leesfout', async () => {
    const { admin } = nepAdmin(10, true)
    expect(await haalBezoekTotalen(admin, 'org', 'budel', new Date())).toBeNull()
  })
})
