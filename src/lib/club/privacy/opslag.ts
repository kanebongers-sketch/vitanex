// ─── Club: bewaartermijnen lezen en schrijven (SERVER-ONLY) ─────────────────
// Altijd op de sportschool (user_id). Geen rij = de standaard. Fouten worden
// gelogd; lezen geeft dan null (de pagina toont een nette melding), schrijven
// geeft false.

import type { SupabaseClient } from '@supabase/supabase-js'
import { TERMIJN_KOLOMMEN, naarRij, uitRij, type Termijnen } from './termijnen'

function log(wat: string, bericht: string): void {
  console.error(`[club/privacy] ${wat} mislukt`, bericht)
}

/** De termijnen van een sportschool (de standaard als er nog niets is), of null bij een leesfout. */
export async function haalTermijnen(admin: SupabaseClient, userId: string): Promise<Termijnen | null> {
  const { data, error } = await admin.from('club_privacy_instellingen').select(TERMIJN_KOLOMMEN).eq('user_id', userId).maybeSingle()
  if (error) {
    log('termijnen lezen', error.message)
    return null
  }
  return uitRij(data)
}

/** Termijnen bewaren (een rij per sportschool). */
export async function bewaarTermijnen(admin: SupabaseClient, userId: string, t: Termijnen): Promise<boolean> {
  const { error } = await admin
    .from('club_privacy_instellingen')
    .upsert({ user_id: userId, ...naarRij(t), bijgewerkt_op: new Date().toISOString() }, { onConflict: 'user_id' })
  if (error) log('termijnen bewaren', error.message)
  return !error
}
