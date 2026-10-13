// ─── PT-app — groeiplan lezen en opslaan (SERVER-ONLY) ──────────────────────
// Tabel uit migratie 372. Nog niets opgeslagen → het startplan.

import type { SupabaseClient } from '@supabase/supabase-js'
import { START_PLAN, leesGroeiplan, type Groeiplan } from './groeiplan'

export interface OpgeslagenPlan {
  plan: Groeiplan
  /** Null = nog nooit aangepast (het startplan). */
  bijgewerktOp: string | null
  bijgewerktDoor: string | null
}

/** Null = lezen mislukt. */
export async function haalGroeiplan(admin: SupabaseClient, userId: string): Promise<OpgeslagenPlan | null> {
  const { data, error } = await admin.from('pt_groeiplan').select('plan, bijgewerkt_op, bijgewerkt_door').eq('user_id', userId).maybeSingle()
  if (error) return null
  if (!data) return { plan: START_PLAN, bijgewerktOp: null, bijgewerktDoor: null }
  const plan = leesGroeiplan(data.plan)
  return {
    plan: plan.ok ? plan.waarde : START_PLAN,
    bijgewerktOp: data.bijgewerkt_op as string,
    bijgewerktDoor: (data.bijgewerkt_door as string | null) ?? null,
  }
}

export async function slaGroeiplanOp(admin: SupabaseClient, userId: string, plan: Groeiplan, door: string): Promise<boolean> {
  const { error } = await admin
    .from('pt_groeiplan')
    .upsert({ user_id: userId, plan, bijgewerkt_op: new Date().toISOString(), bijgewerkt_door: door }, { onConflict: 'user_id' })
  return !error
}
