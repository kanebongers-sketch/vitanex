/**
 * Server-side opslag van gezondheidsdata: leest bestaande rijen,
 * voegt nieuwe metingen samen (nieuwe waarden winnen, lege velden
 * blijven staan) en upsert idempotent op (user_id, datum).
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { mergeDagMetingen, type BestaandeRij, type DagMeting } from './health-data'

export async function slaDagMetingenOp(
  admin: SupabaseClient,
  userId: string,
  bron: string,
  metingen: DagMeting[]
): Promise<{ opgeslagen: number }> {
  if (metingen.length === 0) return { opgeslagen: 0 }

  const datums = metingen.map(m => m.datum)
  const { data: bestaand, error: leesFout } = await admin
    .from('health_native_logs')
    .select('datum, stappen, slaap_minuten, hartslag_gemiddeld, calorieen')
    .eq('user_id', userId)
    .in('datum', datums)

  if (leesFout) throw new Error(`health_native_logs lezen mislukt: ${leesFout.message}`)

  const rijen = mergeDagMetingen((bestaand ?? []) as BestaandeRij[], metingen, bron)
  if (rijen.length === 0) return { opgeslagen: 0 }

  const { error: schrijfFout } = await admin
    .from('health_native_logs')
    .upsert(rijen.map(r => ({ ...r, user_id: userId })), { onConflict: 'user_id,datum' })

  if (schrijfFout) throw new Error(`health_native_logs schrijven mislukt: ${schrijfFout.message}`)
  return { opgeslagen: rijen.length }
}
