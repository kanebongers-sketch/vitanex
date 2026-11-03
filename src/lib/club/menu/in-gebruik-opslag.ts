// ─── Club: verbergen tot gebruikt, de stand lezen (SERVER) ──────────────────
// Lichte tellingen (head: true, alleen het aantal), altijd op de sportschool
// (user_id, en club_organisaties op het eigen id). Een fout maakt dat aantal
// onbekend, en onbekend telt als in gebruik: het menu laat dan liever een
// scherm te veel zien dan dat iemand iets kwijt is. Fouten worden gelogd.

import type { SupabaseClient } from '@supabase/supabase-js'
import { PRIKBORD_KLAAR } from '@/components/club/shell/onderdelen'
import { leesAllesTonen, somOfOnbekend, type GebruikStand } from './in-gebruik'

interface Telling {
  count: number | null
  error: { message: string } | null
}

async function aantal(wat: string, query: PromiseLike<Telling>): Promise<number | null> {
  try {
    const { count, error } = await query
    if (error) {
      console.error(`[club-menu] ${wat} tellen mislukt`, error.message)
      return null
    }
    return count ?? 0
  } catch (fout) {
    console.error(`[club-menu] ${wat} tellen mislukt`, fout instanceof Error ? fout.message : fout)
    return null
  }
}

async function allesTonen(admin: SupabaseClient, userId: string): Promise<boolean> {
  try {
    const { data, error } = await admin.from('club_organisaties').select('instellingen').eq('id', userId).maybeSingle()
    if (error) {
      console.error('[club-menu] instelling alles tonen lezen mislukt', error.message)
      return true
    }
    return leesAllesTonen((data as { instellingen?: unknown } | null)?.instellingen)
  } catch (fout) {
    console.error('[club-menu] instelling alles tonen lezen mislukt', fout instanceof Error ? fout.message : fout)
    return true
  }
}

/** Het Prikbord telt pas mee als het bestaat (PRIKBORD_KLAAR); tot dan is er niets te verbergen. */
async function prikbordItems(admin: SupabaseClient, userId: string): Promise<number | null> {
  if (!PRIKBORD_KLAAR) return null
  const [mededelingen, werkwijzen, notities] = await Promise.all([
    aantal('mededelingen', admin.from('club_mededelingen').select('id', { count: 'exact', head: true }).eq('user_id', userId)),
    aantal('werkwijzen', admin.from('club_werkwijzen').select('id', { count: 'exact', head: true }).eq('user_id', userId)),
    aantal('notities', admin.from('club_kladblok').select('id', { count: 'exact', head: true }).eq('user_id', userId)),
  ])
  return somOfOnbekend([mededelingen, werkwijzen, notities])
}

/** De stand voor het menu van deze sportschool. */
export async function leesGebruikStand(t: { admin: SupabaseClient; userId: string }): Promise<GebruikStand> {
  const [takenlijsten, prikbord, alles] = await Promise.all([
    aantal('takenlijsten', t.admin.from('club_takenlijsten').select('id', { count: 'exact', head: true }).eq('user_id', t.userId).eq('actief', true)),
    prikbordItems(t.admin, t.userId),
    allesTonen(t.admin, t.userId),
  ])
  return { takenlijsten, prikbord, allesTonen: alles }
}
