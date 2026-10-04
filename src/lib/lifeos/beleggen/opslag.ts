// ─── LifeOS — beleggingen in de database (SERVER-ONLY) ──────────────────────
// Service-role-client als parameter; elke query filtert zelf op `user_id`.
// Fout ≠ leeg: een DB-storing geeft `ok: false`, nooit een lege portefeuille.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { KoersStand, Positie } from './portefeuille'

export type Uitkomst<T> = { ok: true; waarde: T } | { ok: false; reden: 'db' | 'niet_gevonden' | 'bestaat_al' }

const KOLOMMEN = 'id, symbool, isin, naam, valuta, aantal, aankoopprijs, inleg_eur'

interface Rij {
  id: string
  symbool: string
  isin: string | null
  naam: string
  valuta: string
  aantal: number | string
  aankoopprijs: number | string | null
  inleg_eur: number | string | null
}

const num = (v: number | string | null): number | null => (v === null ? null : Number(v))

function vanRij(r: Rij): Positie {
  return {
    id: r.id, symbool: r.symbool, isin: r.isin, naam: r.naam, valuta: r.valuta,
    aantal: Number(r.aantal), aankoopprijs: num(r.aankoopprijs), inlegEur: num(r.inleg_eur),
  }
}

export async function haalPosities(admin: SupabaseClient, userId: string): Promise<Uitkomst<Positie[]>> {
  const { data, error } = await admin.from('belegging_posities').select(KOLOMMEN).eq('user_id', userId).order('naam')
  if (error || !Array.isArray(data)) return { ok: false, reden: 'db' }
  return { ok: true, waarde: (data as Rij[]).map(vanRij) }
}

export interface NieuwePositie {
  symbool: string
  isin: string | null
  naam: string
  valuta: string
  aantal: number
  aankoopprijs: number | null
  inlegEur?: number | null
}

/** Toevoegen, of (bij een import) bijwerken op symbool — een eerder ingevulde GAK/inleg blijft dan staan. */
export async function bewaarPositie(admin: SupabaseClient, userId: string, p: NieuwePositie, bijwerken = false): Promise<Uitkomst<Positie>> {
  if (bijwerken) {
    const { data: bestaand } = await admin.from('belegging_posities').select('id, aankoopprijs, inleg_eur').eq('user_id', userId).eq('symbool', p.symbool).maybeSingle()
    if (bestaand) {
      const b = bestaand as { id: string; aankoopprijs: number | null; inleg_eur: number | null }
      return wijzigPositie(admin, userId, b.id, {
        aantal: p.aantal, naam: p.naam, isin: p.isin,
        aankoopprijs: p.aankoopprijs ?? num(b.aankoopprijs), inlegEur: p.inlegEur ?? num(b.inleg_eur),
      })
    }
  }
  const { data, error } = await admin
    .from('belegging_posities')
    .insert({ user_id: userId, symbool: p.symbool, isin: p.isin, naam: p.naam, valuta: p.valuta, aantal: p.aantal, aankoopprijs: p.aankoopprijs, inleg_eur: p.inlegEur ?? null })
    .select(KOLOMMEN)
    .single()
  if (error) return { ok: false, reden: (error as { code?: string }).code === '23505' ? 'bestaat_al' : 'db' }
  return { ok: true, waarde: vanRij(data as Rij) }
}

export interface PositieWijziging {
  aantal?: number
  aankoopprijs?: number | null
  inlegEur?: number | null
  naam?: string
  isin?: string | null
}

export async function wijzigPositie(admin: SupabaseClient, userId: string, id: string, w: PositieWijziging): Promise<Uitkomst<Positie>> {
  const velden: Record<string, unknown> = { bijgewerkt_op: new Date().toISOString() }
  if (w.aantal !== undefined) velden.aantal = w.aantal
  if (w.aankoopprijs !== undefined) velden.aankoopprijs = w.aankoopprijs
  if (w.inlegEur !== undefined) velden.inleg_eur = w.inlegEur
  if (w.naam !== undefined) velden.naam = w.naam
  if (w.isin !== undefined) velden.isin = w.isin
  const { data, error } = await admin.from('belegging_posities').update(velden).eq('user_id', userId).eq('id', id).select(KOLOMMEN).maybeSingle()
  if (error) return { ok: false, reden: 'db' }
  if (!data) return { ok: false, reden: 'niet_gevonden' }
  return { ok: true, waarde: vanRij(data as Rij) }
}

export async function verwijderPositie(admin: SupabaseClient, userId: string, id: string): Promise<Uitkomst<null>> {
  const { error, count } = await admin.from('belegging_posities').delete({ count: 'exact' }).eq('user_id', userId).eq('id', id)
  if (error) return { ok: false, reden: 'db' }
  return count ? { ok: true, waarde: null } : { ok: false, reden: 'niet_gevonden' }
}

export async function haalCash(admin: SupabaseClient, userId: string): Promise<number> {
  const { data } = await admin.from('belegging_rekening').select('cash_eur').eq('user_id', userId).maybeSingle()
  return data ? Number((data as { cash_eur: number | string }).cash_eur) : 0
}

export async function zetCash(admin: SupabaseClient, userId: string, cashEur: number): Promise<boolean> {
  const { error } = await admin.from('belegging_rekening').upsert({ user_id: userId, cash_eur: cashEur, bijgewerkt_op: new Date().toISOString() })
  return !error
}

export async function haalKoersen(admin: SupabaseClient, userId: string): Promise<Map<string, KoersStand>> {
  const { data } = await admin.from('belegging_koersen').select('symbool, koers, vorige_slot, valuta, opgehaald_op').eq('user_id', userId)
  const uit = new Map<string, KoersStand>()
  for (const r of (Array.isArray(data) ? data : []) as { symbool: string; koers: number | string; vorige_slot: number | string | null; valuta: string; opgehaald_op: string }[]) {
    uit.set(r.symbool, { koers: Number(r.koers), vorigeSlot: num(r.vorige_slot), valuta: r.valuta, opgehaaldOp: r.opgehaald_op })
  }
  return uit
}

export async function bewaarKoersen(admin: SupabaseClient, userId: string, rijen: readonly { symbool: string; koers: number; vorigeSlot: number | null; valuta: string; marktTijd: Date | null }[]): Promise<void> {
  if (rijen.length === 0) return
  const nu = new Date().toISOString()
  await admin.from('belegging_koersen').upsert(
    rijen.map((r) => ({ user_id: userId, symbool: r.symbool, koers: r.koers, vorige_slot: r.vorigeSlot, valuta: r.valuta, markt_tijd: r.marktTijd?.toISOString() ?? null, opgehaald_op: nu })),
  )
}

export interface HistoriePunt {
  dag: string
  waardeEur: number
  inlegEur: number | null
}

export async function haalHistorie(admin: SupabaseClient, userId: string): Promise<HistoriePunt[]> {
  const { data } = await admin.from('belegging_historie').select('dag, waarde_eur, inleg_eur').eq('user_id', userId).order('dag').limit(800)
  return ((Array.isArray(data) ? data : []) as { dag: string; waarde_eur: number | string; inleg_eur: number | string | null }[]).map((r) => ({
    dag: r.dag, waardeEur: Number(r.waarde_eur), inlegEur: num(r.inleg_eur),
  }))
}

export async function bewaarDagwaarde(admin: SupabaseClient, userId: string, punt: HistoriePunt): Promise<void> {
  await admin.from('belegging_historie').upsert({ user_id: userId, dag: punt.dag, waarde_eur: punt.waardeEur, inleg_eur: punt.inlegEur, bijgewerkt_op: new Date().toISOString() })
}
