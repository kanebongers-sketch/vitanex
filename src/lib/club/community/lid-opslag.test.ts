import { describe, expect, it } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { plaatsBericht } from './lid-opslag'

const GROEP = { id: 'g1', user_id: 'u1', naam: 'Groep', toegang: 'open', gearchiveerd_op: null }

/** Een kleine nepdatabase: elke query-keten eindigt in een antwoord per tabel. */
function nepAdmin(insertFout: { message: string } | null): SupabaseClient {
  const antwoord = (tabel: string, insert: boolean) => {
    if (insert) return insertFout ? { data: null, error: insertFout } : { data: { id: 'b1' }, error: null }
    if (tabel === 'club_community_groepen') return { data: GROEP, error: null }
    if (tabel === 'club_community_groepsleden') return { data: { status: 'lid' }, error: null }
    return { data: [], error: null }
  }
  const keten = (tabel: string, insert = false): unknown =>
    new Proxy(() => undefined, {
      get: (_d, naam) => {
        if (naam === 'then') return (ok: (v: unknown) => unknown) => Promise.resolve(antwoord(tabel, insert)).then(ok)
        if (naam === 'insert') return () => keten(tabel, true)
        return () => keten(tabel, insert)
      },
    })
  return { from: (tabel: string) => keten(tabel) } as unknown as SupabaseClient
}

const lid = { id: 'l1', vestiging: 'centrum' }

describe('plaatsBericht', () => {
  it('geeft een nette 429 als de database remt', async () => {
    const uit = await plaatsBericht({ admin: nepAdmin({ message: 'community_rem' }), userId: 'u1', lid }, 'g1', 'Hallo')
    expect(uit.ok).toBe(false)
    if (!uit.ok) expect(uit.status).toBe(429)
  })

  it('plaatst een gewoon bericht', async () => {
    const uit = await plaatsBericht({ admin: nepAdmin(null), userId: 'u1', lid }, 'g1', 'Hallo')
    expect(uit.ok).toBe(true)
  })
})
