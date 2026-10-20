import { describe, expect, it } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { zoekLeden } from './lid'

function nepAdmin(or: string[]): SupabaseClient {
  const q: Record<string, unknown> = {}
  const keten = () => q
  for (const m of ['select', 'eq', 'order', 'limit']) q[m] = keten
  q.or = (f: string) => { or.push(f); return q }
  q.then = (ok: (v: unknown) => unknown) => ok({ data: [], error: null })
  return { from: () => q } as unknown as SupabaseClient
}

describe('zoekLeden: zoekterm in het or-filter', () => {
  it('haalt filtertekens uit de zoekterm', async () => {
    const or: string[] = []
    await zoekLeden(nepAdmin(or), 'u', 'budel' as never, 'a,voornaam.eq.x),(b"\*%', 10)
    expect(or.length).toBeGreaterThan(0)
    for (const f of or) {
      const waarden = f.split(',').map((d) => d.split('.ilike.')[1])
      expect(waarden).toHaveLength(5)
      for (const w of waarden) expect(w).toMatch(/^%[^%,()*"\\]+%$/)
    }
  })
})
