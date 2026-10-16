// ─── Fit Factory Club: agenda lezen (SERVER-ONLY) ───────────────────────────

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Vestiging } from '@/lib/club/kern/vestiging'
import { weekBereik } from '@/lib/club/rooster/tijd'
import { AGENDA_KOLOMMEN, agendaUitRij, type AgendaItem } from './model'

/** De afspraken van een vestiging in de week vanaf `maandag`. Null = lezen mislukt. */
export async function haalAgendaWeek(admin: SupabaseClient, userId: string, vestiging: Vestiging, maandag: string): Promise<AgendaItem[] | null> {
  const { van, tot } = weekBereik(maandag)
  const { data, error } = await admin
    .from('club_agenda')
    .select(AGENDA_KOLOMMEN)
    .eq('user_id', userId)
    .eq('vestiging', vestiging)
    .gte('begin_op', van.toISOString())
    .lt('begin_op', tot.toISOString())
    .order('begin_op')
    .limit(500)
  if (error) return null
  return (data ?? []).flatMap((r) => agendaUitRij(r) ?? [])
}
