// ─── Club, lidmaatschappen: lezen (SERVER-ONLY) ─────────────────────────────
// Alle queries filteren op user_id (de sportschool). Bij een leesfout: loggen
// en null teruggeven; de pagina toont dan een nette melding.

import type { SupabaseClient } from '@supabase/supabase-js'
import { LABEL_KOLOMMEN, VORM_KOLOMMEN, labelUitRij, rijenNaar, sorteerLabels, sorteerVormen, vormUitRij, type Label, type Lidmaatschapsvorm } from './model'
import type { LidKenmerken } from './tellen'

const PAGINA = 1000
const MAX_LEDEN = 50_000

export async function haalVormen(admin: SupabaseClient, userId: string): Promise<Lidmaatschapsvorm[] | null> {
  const { data, error } = await admin.from('club_lidmaatschapsvormen').select(VORM_KOLOMMEN).eq('user_id', userId).order('naam').limit(500)
  if (error) {
    console.error('[club] lidmaatschapsvormen lezen mislukt', error.message)
    return null
  }
  return sorteerVormen(rijenNaar(data, vormUitRij))
}

export async function haalLabels(admin: SupabaseClient, userId: string): Promise<Label[] | null> {
  const { data, error } = await admin.from('club_labels').select(LABEL_KOLOMMEN).eq('user_id', userId).order('naam').limit(500)
  if (error) {
    console.error('[club] labels lezen mislukt', error.message)
    return null
  }
  return sorteerLabels(rijenNaar(data, labelUitRij))
}

/** Abonnement en tags van alle leden van de sportschool (alle vestigingen), in pagina's. */
export async function haalLidKenmerken(admin: SupabaseClient, userId: string): Promise<LidKenmerken[] | null> {
  const uit: LidKenmerken[] = []
  for (let van = 0; van < MAX_LEDEN; van += PAGINA) {
    const { data, error } = await admin
      .from('club_leden')
      .select('id, abonnement, tags')
      .eq('user_id', userId)
      .order('id')
      .range(van, van + PAGINA - 1)
    if (error) {
      console.error('[club] leden voor lidmaatschappen lezen mislukt', error.message)
      return null
    }
    for (const r of data ?? []) {
      uit.push({
        abonnement: typeof r.abonnement === 'string' ? r.abonnement : null,
        tags: Array.isArray(r.tags) ? r.tags.filter((t: unknown): t is string => typeof t === 'string') : [],
      })
    }
    if (!data || data.length < PAGINA) break
  }
  return uit
}
