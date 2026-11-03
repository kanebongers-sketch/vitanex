import { describe, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { leesAllesTonen, leesAllesTonenInvoer, metAllesTonen, zetAllesTonen } from './alles-tonen'

describe('Alles tonen (ontwerp 03-11-2026)', () => {
  it('standaard uit: alleen een echte true telt', () => {
    expect(leesAllesTonen(null)).toBe(false)
    expect(leesAllesTonen({})).toBe(false)
    expect(leesAllesTonen({ menu: { alles_tonen: 'ja' } })).toBe(false)
    expect(leesAllesTonen({ menu: { alles_tonen: true } })).toBe(true)
  })

  it('zetten laat de andere instellingen staan', () => {
    const ruw = { ledenapp: { qr: false }, start: { stap: 3 }, menu: { iets: 1 } }
    const nieuw = metAllesTonen(ruw, true)
    expect(nieuw).toEqual({ ledenapp: { qr: false }, start: { stap: 3 }, menu: { iets: 1, alles_tonen: true } })
    expect(ruw.menu).toEqual({ iets: 1 })
    expect(leesAllesTonen(metAllesTonen(nieuw, false))).toBe(false)
    expect(metAllesTonen('onzin', true)).toEqual({ menu: { alles_tonen: true } })
  })

  it('invoer: alleen { aan: boolean }', () => {
    expect(leesAllesTonenInvoer({ aan: true })).toBe(true)
    expect(leesAllesTonenInvoer({ aan: false })).toBe(false)
    expect(leesAllesTonenInvoer({ aan: 'ja' })).toBeNull()
    expect(leesAllesTonenInvoer(null)).toBeNull()
  })
})

describe('zetAllesTonen: alleen het sleuteltje menu.alles_tonen', () => {
  function nep(rpc: { data: unknown; error: { code?: string; message: string } | null }, instellingen: unknown = { thema: 'x', menu: { ander: 1 } }) {
    const updates: unknown[] = []
    const admin = {
      rpc: async () => rpc,
      from: () => {
        const q: Record<string, unknown> = {}
        Object.assign(q, {
          select: () => q,
          eq: () => q,
          maybeSingle: async () => ({ data: { instellingen }, error: null }),
          update: (w: unknown) => (updates.push(w), q),
          then: (ok: (x: unknown) => unknown) => Promise.resolve({ error: null }).then(ok),
        })
        return q
      },
    } as unknown as SupabaseClient
    return { admin, updates }
  }

  it('via de database-functie: ok, of weg als de sportschool niet klopt', async () => {
    expect(await zetAllesTonen(nep({ data: true, error: null }).admin, 'org', 'kane', true)).toBe('ok')
    expect(await zetAllesTonen(nep({ data: false, error: null }).admin, 'org', 'kane', true)).toBe('weg')
  })

  it('zonder migratie 492: terugval die andere sleutels laat staan; andere fouten: fout', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const zonder = nep({ data: null, error: { code: 'PGRST202', message: 'ontbreekt' } })
    expect(await zetAllesTonen(zonder.admin, 'org', 'kane', true)).toBe('ok')
    expect(zonder.updates[0]).toMatchObject({ instellingen: { thema: 'x', menu: { ander: 1, alles_tonen: true } } })
    expect(await zetAllesTonen(nep({ data: null, error: { code: '42501', message: 'nee' } }).admin, 'org', 'kane', true)).toBe('fout')
    vi.restoreAllMocks()
  })
})
