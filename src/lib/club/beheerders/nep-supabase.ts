// ─── Alleen voor tests: een nep-Supabase die elke vraag vastlegt ────────────
// Elke from(...)-keten wordt een Vraag (tabel, actie, filters). `antwoord`
// bepaalt per vraag wat er terugkomt. Zo testen we welke filters de opslag
// zet (tenant-scheiding) zonder echte database.

import type { SupabaseClient } from '@supabase/supabase-js'

export interface Vraag {
  tabel: string
  actie: 'select' | 'update' | 'insert' | 'delete'
  waarde: unknown
  filters: [string, string, unknown][]
}

export type Antwoord = { data: unknown; error: { message: string; code?: string } | null }

export function nepSupabase(antwoord: (v: Vraag) => Antwoord): { admin: SupabaseClient; vragen: Vraag[] } {
  const vragen: Vraag[] = []
  const admin = {
    from(tabel: string) {
      const v: Vraag = { tabel, actie: 'select', waarde: null, filters: [] }
      vragen.push(v)
      const keten: Record<string, unknown> = {}
      const filter = (op: string) => (kolom: string, waarde: unknown) => {
        v.filters.push([op, kolom, waarde])
        return keten
      }
      for (const op of ['eq', 'neq', 'lt', 'gt', 'in', 'is', 'not']) keten[op] = filter(op)
      for (const naam of ['order', 'range', 'limit']) keten[naam] = () => keten
      keten.select = () => keten
      keten.update = (w: unknown) => Object.assign(v, { actie: 'update', waarde: w }) && keten
      keten.insert = (w: unknown) => Object.assign(v, { actie: 'insert', waarde: w }) && keten
      keten.delete = () => Object.assign(v, { actie: 'delete' }) && keten
      keten.maybeSingle = () => Promise.resolve(antwoord(v))
      keten.single = () => Promise.resolve(antwoord(v))
      keten.then = (ok: (a: Antwoord) => unknown, fout?: (e: unknown) => unknown) => Promise.resolve(antwoord(v)).then(ok, fout)
      return keten
    },
  }
  return { admin: admin as unknown as SupabaseClient, vragen }
}

/** Heeft deze vraag het filter kolom = waarde? */
export function heeftFilter(v: Vraag, kolom: string, waarde: unknown): boolean {
  return v.filters.some(([op, k, w]) => op === 'eq' && k === kolom && w === waarde)
}
