// ─── Server-side plan-resolutie ───────────────────────────────────────────────
// Alleen in API-routes gebruiken (service-role). Eén plek die bepaalt welk
// plan voor een gebruiker geldt: het plan van zijn bedrijf, of starter
// wanneer er geen bedrijf of plan is.
import type { SupabaseClient } from '@supabase/supabase-js'
import { normaliseerPlan, type Plan } from '@/lib/plan'

export async function getPlanVoorBedrijf(admin: SupabaseClient, bedrijfId: string): Promise<Plan> {
  const { data: bedrijf } = await admin
    .from('bedrijven')
    .select('plan')
    .eq('id', bedrijfId)
    .single()

  return normaliseerPlan(bedrijf?.plan)
}

export async function getPlanVoorUser(admin: SupabaseClient, userId: string): Promise<Plan> {
  const { data: profiel } = await admin
    .from('profiles')
    .select('bedrijf_id')
    .eq('id', userId)
    .single()

  if (!profiel?.bedrijf_id) return 'starter'

  const { data: bedrijf } = await admin
    .from('bedrijven')
    .select('plan')
    .eq('id', profiel.bedrijf_id)
    .single()

  return normaliseerPlan(bedrijf?.plan)
}
