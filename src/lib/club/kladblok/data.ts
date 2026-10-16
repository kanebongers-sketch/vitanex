// ─── Fit Factory Club: notities lezen (SERVER-ONLY) ─────────────────────────

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Vestiging } from '@/lib/club/kern/vestiging'
import { KLAD_KOLOMMEN, kladUitRij, type KladNotitie } from './model'

/** Alle notities van deze vestiging plus die voor alle vestigingen (ook het archief). Null = lezen mislukt. */
export async function haalKladblok(admin: SupabaseClient, userId: string, vestiging: Vestiging): Promise<KladNotitie[] | null> {
  const { data, error } = await admin
    .from('club_kladblok')
    .select(KLAD_KOLOMMEN)
    .eq('user_id', userId)
    .or(`vestiging.eq.${vestiging},vestiging.is.null`)
    .order('bijgewerkt_op', { ascending: false })
    .limit(1000)
  if (error) return null
  return (data ?? []).flatMap((r) => kladUitRij(r) ?? [])
}
