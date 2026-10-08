// ─── LifeOS — PT-dashboard: doelen per PT'er (SERVER-ONLY) ──────────────────
// `pt_doelen` (migratie 354), één rij per PT'er. Kane schrijft (founder-gate);
// lezen doen het team-overzicht én de eigen pagina van de PT'er. Altijd gescoped
// op de LifeOS-eigenaar (`user_id`).

import type { SupabaseClient } from '@supabase/supabase-js'
import { leesDoelen, type PtDoelen } from './doelen'

export type DoelenUitkomst<T> = { ok: true; waarde: T } | { ok: false; reden: 'db' }

const KOLOMMEN = 'persoon_id, leads_per_week, klanten_per_maand, abonnementen_doel, notitie'

interface Rij {
  persoon_id: string
  leads_per_week: number | null
  klanten_per_maand: number | null
  abonnementen_doel: number | null
  notitie: string | null
}

/** Via de lezer van de systeemgrens: een rij die de grenzen niet haalt, valt weg. */
function vanRij(r: Rij): PtDoelen | null {
  return leesDoelen({ leadsPerWeek: r.leads_per_week, klantenPerMaand: r.klanten_per_maand, abonnementen: r.abonnementen_doel, notitie: r.notitie })
}

/**
 * Doelen van meerdere PT'ers, per persoon_id. Geen rij = geen doelen. Een
 * leesfout geeft `ok: false`, zodat de aanroeper zelf kiest: het team-overzicht
 * toont dan geen doelen, de PT-pagina verbergt de sectie.
 */
export async function haalDoelenVoor(
  admin: SupabaseClient,
  userId: string,
  persoonIds: readonly string[],
): Promise<DoelenUitkomst<Map<string, PtDoelen>>> {
  const uit = new Map<string, PtDoelen>()
  if (persoonIds.length === 0) return { ok: true, waarde: uit }
  const { data, error } = await admin.from('pt_doelen').select(KOLOMMEN).eq('user_id', userId).in('persoon_id', [...persoonIds])
  if (error) return { ok: false, reden: 'db' }
  for (const r of (data ?? []) as Rij[]) {
    const d = vanRij(r)
    if (d) uit.set(r.persoon_id, d)
  }
  return { ok: true, waarde: uit }
}

/** Zet de doelen van één PT'er (upsert). De aanroeper controleert dat de persoon bij het team hoort. */
export async function slaDoelenOp(
  admin: SupabaseClient,
  userId: string,
  persoonId: string,
  d: PtDoelen,
): Promise<DoelenUitkomst<PtDoelen>> {
  const { data, error } = await admin
    .from('pt_doelen')
    .upsert(
      {
        persoon_id: persoonId,
        user_id: userId,
        leads_per_week: d.leadsPerWeek,
        klanten_per_maand: d.klantenPerMaand,
        abonnementen_doel: d.abonnementen,
        notitie: d.notitie,
        bijgewerkt_op: new Date().toISOString(),
      },
      { onConflict: 'persoon_id' },
    )
    .select(KOLOMMEN)
    .single()
  const uit = !error && data ? vanRij(data as Rij) : null
  return uit ? { ok: true, waarde: uit } : { ok: false, reden: 'db' }
}
