// ─── PT-app — "Belangrijk": lezen en schrijven (SERVER-ONLY) ────────────────
// Tabellen uit migratie 451. Alles filtert op user_id (de LifeOS-eigenaar) en,
// voor wat een PT'er zelf doet, op zijn persoon_id: een PT'er vinkt alleen voor
// zichzelf af en geeft alleen zijn eigen maten door. Rechten: belangrijk-rechten.ts.

import type { SupabaseClient } from '@supabase/supabase-js'
import {
  belangrijkVoorPt, sorteerPunten, verplaats, volgendeVolgorde,
  type Aandachtspunt, type BeheerActie, type BelangrijkVoorPt, type Kledingmaten,
} from './belangrijk'

const KOLOMMEN = 'id, titel, uitleg, link, volgorde, actief'

interface PuntRij {
  id: string
  titel: string
  uitleg: string | null
  link: string | null
  volgorde: number
  actief: boolean
}

const naarPunt = (r: PuntRij): Aandachtspunt => ({ id: r.id, titel: r.titel, uitleg: r.uitleg, link: r.link, volgorde: r.volgorde, actief: r.actief })

/** Alle punten (of alleen de actieve), op volgorde. Null = lezen mislukt. */
export async function haalAandachtspunten(admin: SupabaseClient, userId: string, { alleenActief = false } = {}): Promise<Aandachtspunt[] | null> {
  let q = admin.from('pt_belangrijk_punten').select(KOLOMMEN).eq('user_id', userId)
  if (alleenActief) q = q.eq('actief', true)
  const { data, error } = await q.order('volgorde').limit(200)
  return error ? null : sorteerPunten(((data ?? []) as PuntRij[]).map(naarPunt))
}

/** Welke van deze punten heeft de PT'er afgevinkt? Null = lezen mislukt. */
export async function haalGedaan(admin: SupabaseClient, persoonId: string, puntIds: readonly string[]): Promise<Set<string> | null> {
  if (puntIds.length === 0) return new Set()
  const { data, error } = await admin.from('pt_belangrijk_gedaan').select('punt_id').eq('persoon_id', persoonId).in('punt_id', [...puntIds])
  return error ? null : new Set(((data ?? []) as { punt_id: string }[]).map((r) => r.punt_id))
}

/** Per punt: welke personen het hebben afgevinkt (voor Kane). Null = lezen mislukt. */
export async function haalGedaanPerPunt(admin: SupabaseClient, puntIds: readonly string[]): Promise<Map<string, string[]> | null> {
  if (puntIds.length === 0) return new Map()
  const { data, error } = await admin.from('pt_belangrijk_gedaan').select('punt_id, persoon_id').in('punt_id', [...puntIds])
  if (error) return null
  const uit = new Map<string, string[]>()
  for (const r of (data ?? []) as { punt_id: string; persoon_id: string }[]) uit.set(r.punt_id, [...(uit.get(r.punt_id) ?? []), r.persoon_id])
  return uit
}

interface MatenRij {
  persoon_id: string
  boven: string
  onder: string
}

/** De kledingmaten van iedereen in het team: persoon_id → maten. Null = lezen mislukt. */
export async function haalAlleKledingmaten(admin: SupabaseClient, userId: string): Promise<Map<string, Kledingmaten> | null> {
  const { data, error } = await admin.from('pt_kledingmaten').select('persoon_id, boven, onder').eq('user_id', userId).limit(500)
  if (error) return null
  return new Map(((data ?? []) as MatenRij[]).map((r) => [r.persoon_id, { boven: r.boven, onder: r.onder }]))
}

/** De maten van één PT'er: null = nog niet doorgegeven, 'fout' = lezen mislukt. */
export async function haalKledingmaten(admin: SupabaseClient, userId: string, persoonId: string): Promise<Kledingmaten | null | 'fout'> {
  const { data, error } = await admin.from('pt_kledingmaten').select('persoon_id, boven, onder').eq('user_id', userId).eq('persoon_id', persoonId).maybeSingle()
  if (error) return 'fout'
  return data ? { boven: (data as MatenRij).boven, onder: (data as MatenRij).onder } : null
}

export type BelangrijkUitkomst = { ok: true } | { ok: false; fout: string; status: number }

const MISLUKT: BelangrijkUitkomst = { ok: false, fout: 'Opslaan mislukt. Probeer het opnieuw.', status: 502 }
const ONBEKEND: BelangrijkUitkomst = { ok: false, fout: 'Dit punt bestaat niet (meer).', status: 404 }

/** Een gecontroleerde beheeractie van Kane (de route heeft de rol al gecontroleerd). */
export async function voerBeheerUit(admin: SupabaseClient, userId: string, a: BeheerActie): Promise<BelangrijkUitkomst> {
  const tabel = () => admin.from('pt_belangrijk_punten')
  const nu = new Date().toISOString()
  switch (a.actie) {
    case 'toevoegen': {
      const alle = await haalAandachtspunten(admin, userId)
      if (!alle) return MISLUKT
      const { error } = await tabel().insert({ user_id: userId, titel: a.titel, uitleg: a.uitleg, link: a.link, volgorde: volgendeVolgorde(alle) })
      return error ? MISLUKT : { ok: true }
    }
    case 'wijzigen':
    case 'actief': {
      const velden = a.actie === 'wijzigen' ? { titel: a.titel, uitleg: a.uitleg, link: a.link } : { actief: a.actief }
      const { data, error } = await tabel().update({ ...velden, bijgewerkt_op: nu }).eq('id', a.id).eq('user_id', userId).select('id')
      if (error) return MISLUKT
      return (data ?? []).length === 1 ? { ok: true } : ONBEKEND
    }
    case 'verwijderen': {
      const { data, error } = await tabel().delete().eq('id', a.id).eq('user_id', userId).select('id')
      if (error) return MISLUKT
      return (data ?? []).length === 1 ? { ok: true } : ONBEKEND
    }
    case 'verplaats': {
      const alle = await haalAandachtspunten(admin, userId)
      if (!alle) return MISLUKT
      if (!alle.some((p) => p.id === a.id)) return ONBEKEND
      const wijzigingen = verplaats(alle, a.id, a.richting)
      const uit = await Promise.all(
        wijzigingen.map((w) => tabel().update({ volgorde: w.volgorde, bijgewerkt_op: nu }).eq('id', w.id).eq('user_id', userId)),
      )
      return uit.some((r) => r.error) ? MISLUKT : { ok: true }
    }
  }
}

/** Een PT'er vinkt een actief punt af (of zet het terug op open). Alleen voor zichzelf. */
export async function zetGedaan(admin: SupabaseClient, userId: string, persoonId: string, puntId: string, gedaan: boolean): Promise<BelangrijkUitkomst> {
  const { data: punt, error: leesFout } = await admin
    .from('pt_belangrijk_punten')
    .select('id')
    .eq('id', puntId)
    .eq('user_id', userId)
    .eq('actief', true)
    .maybeSingle()
  if (leesFout) return MISLUKT
  if (!punt) return ONBEKEND
  const rij = admin.from('pt_belangrijk_gedaan')
  const { error } = gedaan
    ? await rij.upsert({ punt_id: puntId, persoon_id: persoonId }, { onConflict: 'punt_id,persoon_id', ignoreDuplicates: true })
    : await rij.delete().eq('punt_id', puntId).eq('persoon_id', persoonId)
  return error ? MISLUKT : { ok: true }
}

/** De PT'er geeft zijn kledingmaten door (of past ze aan). */
export async function slaKledingmatenOp(admin: SupabaseClient, userId: string, persoonId: string, maten: Kledingmaten): Promise<BelangrijkUitkomst> {
  const { error } = await admin
    .from('pt_kledingmaten')
    .upsert({ user_id: userId, persoon_id: persoonId, boven: maten.boven, onder: maten.onder, bijgewerkt_op: new Date().toISOString() }, { onConflict: 'user_id,persoon_id' })
  return error ? MISLUKT : { ok: true }
}

/**
 * Alles voor "Belangrijk" op het startscherm van één PT'er, in één rondje.
 * Null = lezen mislukt: dan laat het startscherm het blok weg (de rest werkt door).
 */
export async function haalBelangrijkVoorPt(
  admin: SupabaseClient,
  userId: string,
  persoonId: string,
): Promise<{ b: BelangrijkVoorPt; maten: Kledingmaten | null } | null> {
  const [punten, maten] = await Promise.all([haalAandachtspunten(admin, userId, { alleenActief: true }), haalKledingmaten(admin, userId, persoonId)])
  if (!punten || maten === 'fout') return null
  const gedaan = await haalGedaan(admin, persoonId, punten.map((p) => p.id))
  if (!gedaan) return null
  return { b: belangrijkVoorPt(punten, gedaan, maten), maten }
}
