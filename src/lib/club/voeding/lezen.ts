// ─── Club, voeding: lezen (SERVER-ONLY) ─────────────────────────────────────
// Elke query filtert op user_id van de sportschool. Een leesfout wordt gelogd
// en geeft null, zodat het scherm een nette melding toont.

import type { SupabaseClient } from '@supabase/supabase-js'
import { haalLid, type Lid } from '@/lib/club/kern/lid'
import { hoortBij, type VestigingInfo } from '@/lib/club/kern/vestigingen'
import { PLAN_KOLOMMEN, SJABLOON_KOLOMMEN, planUitRij, sjabloonUitRij, type VoedingPlan, type VoedingSjabloon } from './model'

function meld(wat: string, fout: { message: string }): void {
  console.error(`[club/voeding] ${wat} mislukt`, fout.message)
}

/** Een lid van deze sportschool in een van haar eigen vestigingen, of null. */
export async function haalEigenLid(admin: SupabaseClient, userId: string, vestigingen: readonly VestigingInfo[], lidId: string): Promise<Lid | null> {
  const lid = await haalLid(admin, userId, lidId)
  return lid && hoortBij(vestigingen, lid.vestiging) ? lid : null
}

/** Het plan van een lid; undefined = er is geen plan, null = leesfout. */
export async function haalPlan(admin: SupabaseClient, userId: string, lidId: string): Promise<VoedingPlan | undefined | null> {
  const { data, error } = await admin.from('club_voedingsplannen').select(PLAN_KOLOMMEN).eq('user_id', userId).eq('lid_id', lidId).maybeSingle()
  if (error) {
    meld('plan lezen', error)
    return null
  }
  return planUitRij(data) ?? undefined
}

export async function haalSjablonen(admin: SupabaseClient, userId: string): Promise<VoedingSjabloon[] | null> {
  const { data, error } = await admin.from('club_voedingssjablonen').select(SJABLOON_KOLOMMEN).eq('user_id', userId).order('naam').limit(200)
  if (error) {
    meld('sjablonen lezen', error)
    return null
  }
  return (data ?? []).map(sjabloonUitRij).filter((s): s is VoedingSjabloon => s !== null)
}

export async function haalSjabloon(admin: SupabaseClient, userId: string, id: string): Promise<VoedingSjabloon | null> {
  const { data, error } = await admin.from('club_voedingssjablonen').select(SJABLOON_KOLOMMEN).eq('user_id', userId).eq('id', id).maybeSingle()
  if (error) meld('sjabloon lezen', error)
  return error ? null : sjabloonUitRij(data)
}

export interface PlanRegel {
  plan: VoedingPlan
  lid: { id: string; voornaam: string; achternaam: string }
}

/** Alle plannen van leden in een vestiging, laatst bijgewerkt eerst. */
export async function haalPlannenVanVestiging(admin: SupabaseClient, userId: string, vestiging: string): Promise<PlanRegel[] | null> {
  const { data, error } = await admin
    .from('club_voedingsplannen')
    .select(`${PLAN_KOLOMMEN}, club_leden!inner(id, voornaam, achternaam, vestiging)`)
    .eq('user_id', userId)
    .eq('club_leden.vestiging', vestiging)
    .order('bijgewerkt_op', { ascending: false })
    .limit(500)
  if (error) {
    meld('plannen lezen', error)
    return null
  }
  const uit: PlanRegel[] = []
  for (const rij of data ?? []) {
    const plan = planUitRij(rij)
    const l = (rij as { club_leden?: unknown }).club_leden as Record<string, unknown> | null | undefined
    if (plan && l && typeof l.id === 'string' && typeof l.voornaam === 'string' && typeof l.achternaam === 'string') {
      uit.push({ plan, lid: { id: l.id, voornaam: l.voornaam, achternaam: l.achternaam } })
    }
  }
  return uit
}
