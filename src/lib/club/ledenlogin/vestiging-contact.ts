// ─── Club, ledenapp: telefoon en e-mail van de eigen vestiging (SERVER-ONLY) ─

import type { SupabaseClient } from '@supabase/supabase-js'
import { contactUitRij, type VestigingContact } from './lid-voor-app'

/** Contact van een vestiging van deze sportschool; bij een leesfout alleen de naam. */
export async function haalVestigingContact(admin: SupabaseClient, userId: string, vestiging: string, naam: string): Promise<VestigingContact> {
  const { data, error } = await admin.from('club_vestigingen').select('telefoon, email').eq('user_id', userId).eq('vestiging', vestiging).maybeSingle()
  if (error) console.error('[club/ledenapp] contact vestiging lezen mislukt', error.message)
  return contactUitRij(error ? null : data, naam)
}
