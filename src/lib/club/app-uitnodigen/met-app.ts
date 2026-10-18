// ─── Club, leden op de app: wie heeft de app al (SERVER-ONLY) ───────────────
// Een lid "heeft de app" met een actieve link en een gekozen pincode
// (club_lid_toegang). Los bestand zodat de ledenlijst het kan lezen zonder
// kringverwijzing.

import type { SupabaseClient } from '@supabase/supabase-js'

const BLOK = 1000
const MAX = 50_000

/** De ids van de leden met de app. null bij een leesfout (gelogd). */
export async function haalLedenMetApp(admin: SupabaseClient, userId: string): Promise<Set<string> | null> {
  const ids = new Set<string>()
  for (let van = 0; van < MAX; van += BLOK) {
    const { data, error } = await admin
      .from('club_lid_toegang')
      .select('lid_id')
      .eq('user_id', userId)
      .eq('actief', true)
      .not('pin_hash', 'is', null)
      .order('lid_id')
      .range(van, van + BLOK - 1)
    if (error) {
      console.error('[club/app-uitnodigen] leden met app lezen mislukt', error.message)
      return null
    }
    const blok = (data ?? []) as Array<{ lid_id?: unknown }>
    for (const r of blok) if (typeof r.lid_id === 'string') ids.add(r.lid_id)
    if (blok.length < BLOK) break
  }
  return ids
}
