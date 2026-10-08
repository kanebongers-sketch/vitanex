// ─── LifeOS — PT-app: kennisbank lezen (SERVER-ONLY) ────────────────────────
// `pt_kennis` (migratie 355). Alleen lezen, via de service-role client van de
// PT-sessie en altijd gescoped op de LifeOS-eigenaar (`user_id`). Kane beheert
// de inhoud; de inhoud zelf staat nooit in deze (openbare) repo.
//
// Elke rij gaat door `leesKennisRij` (systeemgrens): een kapotte rij valt weg in
// plaats van de pagina te breken.

import { cache } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  KENNIS_CATEGORIEEN,
  SLUG_PATROON,
  kort,
  leesKennisRij,
  zoekDocument,
  type KennisItem,
  type KennisItemKort,
  type ZoekDocument,
} from './kennis'

export type KennisUitkomst<T> = { ok: true; waarde: T } | { ok: false; reden: 'db' }

const KOLOMMEN = 'slug, titel, ondertitel, categorie, bron, document_id, volgorde, secties'

/** Vaste categorievolgorde, daarbinnen `volgorde` en dan titel. */
function sorteer(items: KennisItem[], volgorde: Map<string, number>): KennisItem[] {
  const cat = (i: KennisItem) => KENNIS_CATEGORIEEN.indexOf(i.categorie)
  return [...items].sort(
    (a, b) => cat(a) - cat(b) || (volgorde.get(a.slug) ?? 0) - (volgorde.get(b.slug) ?? 0) || a.titel.localeCompare(b.titel, 'nl'),
  )
}

/**
 * Alle zichtbare kennisitems van één eigenaar, mét secties. Eén query per
 * request (`cache`): de hub haalt er zowel de kaarten als de zoekbron uit.
 */
const haalAlles = cache(async (admin: SupabaseClient, userId: string): Promise<KennisUitkomst<KennisItem[]>> => {
  const { data, error } = await admin.from('pt_kennis').select(KOLOMMEN).eq('user_id', userId).eq('zichtbaar', true)
  if (error) return { ok: false, reden: 'db' }
  const rijen = (data ?? []) as unknown[]
  const volgorde = new Map<string, number>()
  const items: KennisItem[] = []
  for (const r of rijen) {
    const item = leesKennisRij(r)
    if (!item) continue
    const v = (r as { volgorde?: unknown }).volgorde
    volgorde.set(item.slug, typeof v === 'number' ? v : 0)
    items.push(item)
  }
  return { ok: true, waarde: sorteer(items, volgorde) }
})

/** De lijst voor de hub: zonder secties, wel met het aantal secties. */
export async function haalKennisLijst(admin: SupabaseClient, userId: string): Promise<KennisUitkomst<KennisItemKort[]>> {
  const alles = await haalAlles(admin, userId)
  return alles.ok ? { ok: true, waarde: alles.waarde.map(kort) } : alles
}

/** De zoekbron voor de client: per item de secties als platte tekst. */
export async function haalZoekbron(admin: SupabaseClient, userId: string): Promise<KennisUitkomst<ZoekDocument[]>> {
  const alles = await haalAlles(admin, userId)
  return alles.ok ? { ok: true, waarde: alles.waarde.map(zoekDocument) } : alles
}

/**
 * Eén item op slug. `null` = bestaat niet, is verborgen of hoort niet bij deze
 * eigenaar (bewust niet te onderscheiden). Een ongeldige slug raakt de database niet.
 */
export const haalKennisItem = cache(async (admin: SupabaseClient, userId: string, slug: string): Promise<KennisUitkomst<KennisItem | null>> => {
  if (!SLUG_PATROON.test(slug)) return { ok: true, waarde: null }
  const { data, error } = await admin
    .from('pt_kennis')
    .select(KOLOMMEN)
    .eq('user_id', userId)
    .eq('slug', slug)
    .eq('zichtbaar', true)
    .maybeSingle()
  if (error) return { ok: false, reden: 'db' }
  return { ok: true, waarde: data ? leesKennisRij(data) : null }
})
