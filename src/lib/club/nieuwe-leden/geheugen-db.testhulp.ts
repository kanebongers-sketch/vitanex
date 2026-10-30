// ─── Alleen voor tests: een kleine Supabase in het geheugen ─────────────────
// Genoeg van de query-bouwer voor de keten "nieuwe leden" (aanmelden,
// inloggen, intake, ledenkaart): select (ook count/head), insert, update,
// delete, filters eq/neq/is/not is null/gte/lt/ilike/in, order, limit,
// maybeSingle/single, en de join club_leden!inner(...) vanuit club_intakes.
// Unieke sleutels: per tabel op te geven, geeft dan fout 23505 zoals Postgres.

import { randomUUID } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'

type Rij = Record<string, unknown>
type Filter = (r: Rij, db: GeheugenDb) => boolean

export interface GeheugenDb {
  tabellen: Record<string, Rij[]>
  admin: SupabaseClient
}

const STANDAARD: Record<string, () => Rij> = {
  club_leden: () => ({ demo: false, tags: [], qr_token: randomUUID(), aangemaakt_op: new Date().toISOString(), aanmelding_gezien_op: null, aanmelding_op: null }),
  club_intakes: () => ({ demo: false, bron: 'trainer', gezien_op: null, aangemaakt_op: new Date().toISOString() }),
  club_lid_toegang: () => ({ mislukt: 0, blokkades: 0, geblokkeerd_tot: null, pin_hash: null }),
  club_lid_sessies: () => ({ aangemaakt_op: new Date().toISOString() }),
  club_aanmeldlinks: () => ({ gebruikt: 0, ingetrokken_op: null, aangemaakt_op: new Date().toISOString() }),
  club_aanmeldingen: () => ({ afgerond_op: null }),
}

function joinVan(tabel: string, rij: Rij, db: GeheugenDb): Rij | null {
  if (tabel === 'club_intakes') return db.tabellen.club_leden?.find((l) => l.id === rij.lid_id) ?? null
  return null
}

function waardeVan(kolom: string, rij: Rij, tabel: string, db: GeheugenDb): unknown {
  if (kolom.startsWith('club_leden.')) return joinVan(tabel, rij, db)?.[kolom.slice('club_leden.'.length)]
  return rij[kolom]
}

export function geheugenDb(begin: Record<string, Rij[]> = {}, uniek: Record<string, string[][]> = {}): GeheugenDb {
  const tabellen: Record<string, Rij[]> = Object.fromEntries(Object.entries(begin).map(([t, r]) => [t, r.map((x) => ({ ...x }))]))
  const db = { tabellen } as GeheugenDb

  function bouw(tabel: string) {
    const filters: Filter[] = []
    let actie: 'select' | 'insert' | 'update' | 'delete' = 'select'
    let waarde: unknown = null
    let telling = false
    let head = false
    let enkel: 'single' | 'maybe' | null = null
    let limiet: number | null = null
    let vanaf = 0
    let sorteer: { kolom: string; op: boolean }[] = []
    let metJoin = false

    const rijen = () => (tabellen[tabel] ??= [])
    const voer = (): { data: unknown; error: { message: string; code?: string } | null; count?: number } => {
      if (actie === 'insert') {
        const nieuw = (Array.isArray(waarde) ? waarde : [waarde]).map((w): Rij => ({ id: randomUUID(), ...(STANDAARD[tabel]?.() ?? {}), ...(w as Rij) }))
        for (const n of nieuw) {
          for (const sleutel of uniek[tabel] ?? []) {
            if (sleutel.every((k) => n[k] !== null && n[k] !== undefined) && rijen().some((r) => sleutel.every((k) => r[k] === n[k]))) {
              return { data: null, error: { message: 'unieke sleutel', code: '23505' } }
            }
          }
        }
        rijen().push(...nieuw)
        return { data: enkel ? nieuw[0] : nieuw, error: null }
      }
      const gevonden = rijen().filter((r) => filters.every((f) => f(r, db)))
      if (actie === 'update') {
        for (const r of gevonden) Object.assign(r, waarde as Rij)
        return { data: gevonden.map((r) => ({ ...r })), error: null }
      }
      if (actie === 'delete') {
        tabellen[tabel] = rijen().filter((r) => !gevonden.includes(r))
        return { data: null, error: null }
      }
      let uit = [...gevonden]
      for (const s of [...sorteer].reverse()) uit.sort((a, b) => String(a[s.kolom] ?? '').localeCompare(String(b[s.kolom] ?? '')) * (s.op ? 1 : -1))
      uit = uit.slice(vanaf)
      if (limiet !== null) uit = uit.slice(0, limiet)
      const kopie = uit.map((r) => (metJoin ? { ...r, club_leden: joinVan(tabel, r, db) } : { ...r }))
      if (telling && head) return { data: null, error: null, count: gevonden.length }
      if (enkel === 'single') return kopie.length === 1 ? { data: kopie[0], error: null } : { data: null, error: { message: 'geen enkele rij' } }
      if (enkel === 'maybe') return { data: kopie[0] ?? null, error: null }
      return { data: kopie, error: null, count: telling ? gevonden.length : undefined }
    }

    const keten: Record<string, unknown> = {
      select(kolommen?: string, opties?: { count?: string; head?: boolean }) {
        if (actie === 'select') {
          telling = opties?.count === 'exact'
          head = opties?.head === true
          metJoin = typeof kolommen === 'string' && kolommen.includes('club_leden')
        }
        return keten
      },
      insert(w: unknown) { actie = 'insert'; waarde = w; return keten },
      upsert(w: unknown) { actie = 'insert'; waarde = w; return keten },
      update(w: unknown) { actie = 'update'; waarde = w; return keten },
      delete() { actie = 'delete'; return keten },
      eq(k: string, v: unknown) { filters.push((r) => waardeVan(k, r, tabel, db) === v); return keten },
      neq(k: string, v: unknown) { filters.push((r) => waardeVan(k, r, tabel, db) !== v); return keten },
      is(k: string, v: unknown) { filters.push((r) => (r[k] ?? null) === v); return keten },
      not(k: string, op: string, v: unknown) { filters.push((r) => (op === 'is' ? (r[k] ?? null) !== v : true)); return keten },
      gte(k: string, v: unknown) { filters.push((r) => String(r[k]) >= String(v)); return keten },
      gt(k: string, v: unknown) { filters.push((r) => String(r[k]) > String(v)); return keten },
      lt(k: string, v: unknown) { filters.push((r) => String(r[k]) < String(v)); return keten },
      ilike(k: string, v: unknown) { filters.push((r) => typeof r[k] === 'string' && (r[k] as string).toLowerCase() === String(v).replace(/\\(.)/g, '$1').toLowerCase()); return keten },
      in(k: string, v: unknown[]) { filters.push((r) => v.includes(r[k])); return keten },
      order(k: string, o?: { ascending?: boolean }) { sorteer = [...sorteer, { kolom: k, op: o?.ascending !== false }]; return keten },
      limit(n: number) { limiet = n; return keten },
      range(van: number, tot: number) { vanaf = van; limiet = tot - van + 1; return keten },
      single() { enkel = 'single'; return Promise.resolve(voer()) },
      maybeSingle() { enkel = 'maybe'; return Promise.resolve(voer()) },
      then(ok: (a: unknown) => unknown, fout?: (e: unknown) => unknown) { return Promise.resolve(voer()).then(ok, fout) },
    }
    return keten
  }

  db.admin = { from: (tabel: string) => bouw(tabel) } as unknown as SupabaseClient
  return db
}
