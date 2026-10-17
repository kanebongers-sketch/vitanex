// ─── Club, intakevragen: lezen (SERVER-ONLY) ────────────────────────────────
// Altijd op user_id (de sportschool). Zonder rijen is het de standaardset.

import type { SupabaseClient } from '@supabase/supabase-js'
import { vulAan } from './lijst'
import { VRAAG_KOLOMMEN, vraagUitRij } from './rij'
import type { IntakeVraag } from './soorten'

export interface VragenSet {
  vragen: IntakeVraag[]
  /** Nog niets aangepast: dit is de standaardset van Club. */
  standaard: boolean
}

/** De intakevragen van een sportschool (ook uitgezette), of null bij een leesfout. */
export async function haalIntakeVragen(admin: SupabaseClient, userId: string): Promise<VragenSet | null> {
  const { data, error } = await admin.from('club_intakevragen').select(VRAAG_KOLOMMEN).eq('user_id', userId).order('volgorde').limit(500)
  if (error) {
    console.error('[club] intakevragen lezen mislukt', error.message)
    return null
  }
  const rijen = (data ?? []).map(vraagUitRij).filter((v): v is IntakeVraag => v !== null)
  return { vragen: vulAan(rijen), standaard: rijen.length === 0 }
}
