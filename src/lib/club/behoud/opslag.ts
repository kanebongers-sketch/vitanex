// ─── Club, behoud: opzegredenen lezen en schrijven (SERVER-ONLY) ────────────
// Elke query filtert op user_id (de sportschool). Zolang migratie 482 niet is
// uitgevoerd, bestaat de tabel niet: dan gaat de rest gewoon door en meldt de
// kaart dat de reden nog niet is bewaard.

import type { SupabaseClient } from '@supabase/supabase-js'
import { isOpzegReden, type OpzegInvoer, type OpzegReden } from './opzegreden'

/** Postgres: tabel of kolom bestaat niet (migratie 482 nog niet uitgevoerd). */
const ONTBREEKT = new Set(['42P01', '42703', 'PGRST204', 'PGRST205'])

export type OpzegOpslag = { soort: 'ok'; id: string } | { soort: 'ontbreekt' } | { soort: 'fout' }

export interface NieuweOpzegging extends OpzegInvoer {
  lidId: string
  vestiging: string
  actie: 'opzeggen' | 'stoppen'
  einddatum: string | null
  door: string
  demo: boolean
}

export async function bewaarOpzegging(admin: SupabaseClient, userId: string, o: NieuweOpzegging): Promise<OpzegOpslag> {
  const { data, error } = await admin
    .from('club_lid_opzeggingen')
    .insert({
      user_id: userId,
      vestiging: o.vestiging,
      lid_id: o.lidId,
      actie: o.actie,
      reden: o.reden,
      toelichting: o.toelichting,
      einddatum: o.einddatum,
      vastgelegd_door: o.door.slice(0, 80),
      demo: o.demo,
    })
    .select('id')
    .single()
  if (!error && data && typeof data.id === 'string') return { soort: 'ok', id: data.id }
  if (error && ONTBREEKT.has(error.code)) return { soort: 'ontbreekt' }
  console.error('[club] opzegreden bewaren mislukt', error?.message ?? 'geen id')
  return { soort: 'fout' }
}

/** Terugdraaien als de statuswissel daarna toch mislukte. */
export async function verwijderOpzegging(admin: SupabaseClient, userId: string, id: string): Promise<void> {
  const { error } = await admin.from('club_lid_opzeggingen').delete().eq('user_id', userId).eq('id', id)
  if (error) console.error('[club] opzegreden terugdraaien mislukt', error.message)
}

export interface LaatsteOpzegging {
  reden: OpzegReden
  toelichting: string | null
  op: string
}

/** De laatst vastgelegde reden van dit lid; null als er geen is of de tabel er nog niet is. */
export async function haalLaatsteOpzegging(admin: SupabaseClient, userId: string, lidId: string): Promise<LaatsteOpzegging | null> {
  const { data, error } = await admin
    .from('club_lid_opzeggingen')
    .select('reden, toelichting, aangemaakt_op')
    .eq('user_id', userId)
    .eq('lid_id', lidId)
    .order('aangemaakt_op', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) {
    if (!ONTBREEKT.has(error.code)) console.error('[club] opzegreden lezen mislukt', error.message)
    return null
  }
  if (!data || !isOpzegReden(data.reden) || typeof data.aangemaakt_op !== 'string') return null
  return { reden: data.reden, toelichting: typeof data.toelichting === 'string' ? data.toelichting : null, op: data.aangemaakt_op }
}
