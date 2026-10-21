// ─── AI Your Gym: de databaseverbinding van de server (SERVER-ONLY) ─────────
// Club, de ledenapp, de widget en de website gebruiken (voorlopig, keuze Kane:
// geen extra kosten) hetzelfde Supabase-project als LifeOS. Dit is de enige
// plek die die verbinding maakt; de code van AI Your Gym importeert niets uit
// LifeOS of Fit Factory. Later te verhuizen naar een eigen project door alleen
// de omgevingsvariabelen hieronder te wijzigen.
//
// De service-role omzeilt RLS: elke query filtert zelf op de sportschool
// (ClubToegang.userId, src/lib/club/toegang.ts). Nooit in de browser.

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export function clubDatabase(): SupabaseClient {
  if (typeof window !== 'undefined') {
    throw new Error('clubDatabase is server-only en mag niet in de browser draaien.')
  }
  const url = process.env.LIFEOS_SUPABASE_URL
  const key = process.env.LIFEOS_SERVICE_ROLE_KEY
  if (!url) throw new Error('De database-URL ontbreekt in de omgeving.')
  if (!key || key === 'undefined') throw new Error('De database-sleutel ontbreekt in de omgeving.')
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

/**
 * De beheerder_id van de platform-eigenaar (Kane): onder dit id vallen alle
 * sportscholen in club_organisaties. Uit de omgeving (LIFEOS_USER_ID, de naam is
 * historisch); hetzelfde id staat in club_platform_accounts.beheerder_id.
 */
export function platformEigenaarId(): string {
  const id = process.env.LIFEOS_USER_ID
  if (!id) throw new Error('Het id van de platform-eigenaar ontbreekt in de omgeving.')
  return id
}
