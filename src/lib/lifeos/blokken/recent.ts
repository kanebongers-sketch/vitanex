// ─── LifeOS · wat de blokautomatisering recent deed (SERVER-ONLY) ───────────
// Voor de ochtendmail ("AUTOMATISCH GEDAAN"): zo zie je elke dag wat LifeOS zelf
// in je agenda zette. Best-effort: een fout geeft een lege lijst.

import type { SupabaseClient } from '@supabase/supabase-js'

const MOMENT = new Intl.DateTimeFormat('nl-NL', {
  weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'Europe/Amsterdam',
})

export async function haalRecenteBlokken(admin: SupabaseClient, userId: string, sinds: Date): Promise<string[]> {
  const { data } = await admin
    .from('agenda_blokken')
    .select('titel, start_op')
    .eq('user_id', userId)
    .gte('aangemaakt_op', sinds.toISOString())
    .order('start_op')
  const rijen = (Array.isArray(data) ? data : []) as { titel: string; start_op: string | null }[]
  return rijen.map((r) => (r.start_op ? `In je agenda gezet: ${r.titel}, ${MOMENT.format(new Date(r.start_op))}` : `In je agenda gezet: ${r.titel}`))
}
