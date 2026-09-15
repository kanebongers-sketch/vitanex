// ─── LifeOS — opslag van geleerde categorie-regels ──────────────────────────
// SERVER-ONLY. Lezen en schrijven van `agenda_categorie_regels` (migratie 240).
// De service-role client komt als PARAMETER binnen (van `vereisLifeosToegang`),
// net als de andere LifeOS-opslagmodules. Elke query filtert zelf op user_id.

import type { SupabaseClient } from '@supabase/supabase-js'
import { normaliseerTitel, type AgendaCategorie } from './categorie'

export type Uitkomst<T> = { ok: true; waarde: T } | { ok: false; reden: string }

const GELDIGE_CATEGORIEEN: readonly AgendaCategorie[] = [
  'pt_klant',
  'budel_team',
  'pt_team',
  'management',
  'persoonlijk',
  'overig',
]

/** Alle regels als map `genormaliseerde titel → categorie`. Fout ≠ leeg. */
export async function haalCategorieRegels(
  admin: SupabaseClient,
  userId: string,
): Promise<Uitkomst<Map<string, AgendaCategorie>>> {
  const { data, error } = await admin
    .from('agenda_categorie_regels')
    .select('titel_norm, categorie')
    .eq('user_id', userId)
  if (error) return { ok: false, reden: 'db' }

  const regels = new Map<string, AgendaCategorie>()
  for (const rij of Array.isArray(data) ? data : []) {
    const titel = typeof rij?.titel_norm === 'string' ? rij.titel_norm : null
    const categorie = rij?.categorie
    if (titel && GELDIGE_CATEGORIEEN.includes(categorie)) {
      regels.set(titel, categorie as AgendaCategorie)
    }
  }
  return { ok: true, waarde: regels }
}

/**
 * Legt een regel vast: deze (genormaliseerde) titel hoort in deze categorie. Upsert
 * op (user_id, titel_norm), zodat een tweede keuze de eerste vervangt. Een lege
 * titel is geen bruikbare sleutel — dan schrijven we niets.
 */
export async function zetCategorieRegel(
  admin: SupabaseClient,
  userId: string,
  titel: string | null,
  categorie: AgendaCategorie,
): Promise<Uitkomst<true>> {
  const norm = normaliseerTitel(titel)
  if (norm.length === 0) return { ok: false, reden: 'lege_titel' }

  const { error } = await admin.from('agenda_categorie_regels').upsert(
    { user_id: userId, titel_norm: norm, categorie, bijgewerkt_op: new Date().toISOString() },
    { onConflict: 'user_id,titel_norm' },
  )
  if (error) return { ok: false, reden: 'db' }
  return { ok: true, waarde: true }
}
