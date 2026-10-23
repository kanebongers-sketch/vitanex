// ─── Club, health: sync en webhooks over alle sportscholen (SERVER-ONLY) ────
// Alleen voor de cron en de webhooks: deze query's lopen bewust over alle
// sportscholen heen (staat in tenant-filter-uitzonderingen.ts). Elke rij draagt
// zijn eigen user_id; alles daarna (tokens, toestemming, metingen) filtert weer
// op die sportschool en dat lid.

import type { SupabaseClient } from '@supabase/supabase-js'
import { ADAPTERS } from './adapters'
import { KOPPELING_VELDEN, koppelingUitRij, wisMetingen } from './opslag'
import { PROVIDERS } from './providers'
import type { Koppeling } from './sync'
import type { BronId } from './typen'

/** Koppelingen die aan de beurt zijn (alleen bronnen met een server-adapter). */
export async function koppelingenTeSyncen(admin: SupabaseClient, nu: Date, max: number): Promise<Koppeling[] | null> {
  const bronnen = Object.keys(ADAPTERS)
  const { data, error } = await admin
    .from('club_health_koppelingen')
    .select(KOPPELING_VELDEN)
    .in('status', ['actief', 'fout'])
    .in('bron', bronnen)
    .or(`volgende_sync_op.is.null,volgende_sync_op.lte.${nu.toISOString()}`)
    .order('volgende_sync_op', { ascending: true, nullsFirst: true })
    .limit(max)
  if (error) {
    console.error('[club/health] te syncen lezen mislukt', error.code)
    return null
  }
  return ((data ?? []) as Record<string, unknown>[]).map(koppelingUitRij).filter((k): k is Koppeling => k !== null)
}

/**
 * Een webhook: de koppeling(en) van deze gebruiker bij de leverancier nu laten
 * bijwerken, of intrekken (het lid trok de toegang bij de leverancier in). Bij
 * intrekken gaan de tokens weg; eist de leverancier dat (regels.wissenBijOntkoppelen),
 * dan ook de gegevens van die bron.
 */
export async function verwerkWebhook(admin: SupabaseClient, bron: BronId, externGebruikerId: string, actie: 'bijwerken' | 'ingetrokken'): Promise<boolean> {
  if (actie === 'bijwerken') {
    const { error } = await admin
      .from('club_health_koppelingen')
      .update({ volgende_sync_op: new Date().toISOString() })
      .eq('bron', bron)
      .eq('extern_gebruiker_id', externGebruikerId)
      .in('status', ['actief', 'fout'])
    if (error) console.error('[club/health] webhook verwerken mislukt', error.code)
    return !error
  }
  const { data, error } = await admin
    .from('club_health_koppelingen')
    .update({ status: 'ingetrokken', tokens_versleuteld: null, gewijzigd_op: new Date().toISOString() })
    .eq('bron', bron)
    .eq('extern_gebruiker_id', externGebruikerId)
    .select('user_id, lid_id')
  if (error) {
    console.error('[club/health] webhook intrekken mislukt', error.code)
    return false
  }
  if (!PROVIDERS[bron].regels.wissenBijOntkoppelen) return true
  const rijen = (data ?? []) as { user_id: string; lid_id: string }[]
  const uitslagen = await Promise.all(rijen.map((r) => wisMetingen(admin, r.user_id, r.lid_id, bron)))
  return uitslagen.every(Boolean)
}
