// ─── Testhulp: een in-memory nep-Supabase voor de opslagfuncties ─────────────
// Alleen voor tests (vitest pakt `*.test.ts`; dit bestand importeert niets van
// productiecode en wordt nergens anders geïmporteerd). Genoeg querybuilder om
// de échte opslagfuncties te laten draaien: select (ook count/head), insert,
// update, delete, upsert, eq/gte/in, order/limit, single/maybeSingle.
// Filters werken op de rijen zoals ze in `tabellen` staan; zo bewijst een test
// dat een functie écht op user_id + persoon_id filtert, niet dat ze "iets" doet.

import type { SupabaseClient } from '@supabase/supabase-js'

export type Rij = Record<string, unknown>
export type Tabellen = Record<string, Rij[]>

type Filter = (r: Rij) => boolean
type Op = 'select' | 'insert' | 'update' | 'delete' | 'upsert'
interface Antwoord {
  data: unknown
  error: { message: string } | null
  count: number | null
}

let volgnummer = 0
const nieuwId = (): string => `00000000-0000-4000-8000-${String(++volgnummer).padStart(12, '0')}`

function maakBouwer(tabellen: Tabellen, tabel: string) {
  const filters: Filter[] = []
  let op: Op = 'select'
  let payload: Rij | Rij[] | null = null
  let conflictKolom: string | null = null
  let tellen = false
  let alleenKop = false
  let vorm: 'lijst' | 'single' | 'maybeSingle' = 'lijst'
  let max: number | null = null

  const rijen = (): Rij[] => (tabellen[tabel] ??= [])
  const past = (r: Rij): boolean => filters.every((f) => f(r))

  function voerUit(): Antwoord {
    let uit: Rij[]
    if (op === 'select') {
      uit = rijen().filter(past)
    } else if (op === 'insert') {
      const nieuw = (Array.isArray(payload) ? payload : [payload ?? {}]).map((r) => ({ id: nieuwId(), ...r }))
      rijen().push(...nieuw)
      uit = nieuw
    } else if (op === 'upsert') {
      const r = (Array.isArray(payload) ? payload[0] : payload) ?? {}
      const bestaand = conflictKolom ? rijen().find((x) => x[conflictKolom as string] === r[conflictKolom as string]) : undefined
      if (bestaand) Object.assign(bestaand, r)
      else rijen().push({ id: nieuwId(), ...r })
      uit = [bestaand ?? rijen()[rijen().length - 1]]
    } else if (op === 'update') {
      uit = rijen().filter(past)
      for (const r of uit) Object.assign(r, payload ?? {})
    } else {
      uit = rijen().filter(past)
      tabellen[tabel] = rijen().filter((r) => !past(r))
    }
    if (max !== null) uit = uit.slice(0, max)
    const count = tellen ? uit.length : null
    if (alleenKop) return { data: null, error: null, count }
    if (vorm === 'single') return uit.length === 1 ? { data: uit[0], error: null, count } : { data: null, error: { message: 'niet precies één rij' }, count }
    if (vorm === 'maybeSingle') return uit.length <= 1 ? { data: uit[0] ?? null, error: null, count } : { data: null, error: { message: 'meer dan één rij' }, count }
    return { data: uit, error: null, count }
  }

  const bouwer: Record<string, unknown> = {
    select: (_kolommen?: string, opties?: { count?: string; head?: boolean }) => {
      if (opties?.count) tellen = true
      if (opties?.head) alleenKop = true
      return bouwer
    },
    insert: (p: Rij | Rij[]) => ((op = 'insert'), (payload = p), bouwer),
    update: (p: Rij) => ((op = 'update'), (payload = p), bouwer),
    upsert: (p: Rij | Rij[], opties?: { onConflict?: string }) => ((op = 'upsert'), (payload = p), (conflictKolom = opties?.onConflict ?? null), bouwer),
    delete: () => ((op = 'delete'), bouwer),
    eq: (k: string, w: unknown) => (filters.push((r) => r[k] === w), bouwer),
    gte: (k: string, w: unknown) => (filters.push((r) => typeof r[k] === 'string' && typeof w === 'string' && r[k] >= w), bouwer),
    in: (k: string, ws: unknown[]) => (filters.push((r) => ws.includes(r[k])), bouwer),
    order: () => bouwer,
    limit: (n: number) => ((max = n), bouwer),
    single: () => ((vorm = 'single'), bouwer),
    maybeSingle: () => ((vorm = 'maybeSingle'), bouwer),
    then: (resolve: (a: Antwoord) => unknown, reject?: (f: unknown) => unknown) => {
      try {
        return Promise.resolve(resolve(voerUit()))
      } catch (fout) {
        return reject ? Promise.resolve(reject(fout)) : Promise.reject(fout)
      }
    },
  }
  return bouwer
}

/** Een nep-client op een in-memory set tabellen; tests lezen `tabellen` terug om bijwerkingen te controleren. */
export function nepSupabase(tabellen: Tabellen): SupabaseClient {
  return { from: (tabel: string) => maakBouwer(tabellen, tabel) } as unknown as SupabaseClient
}
