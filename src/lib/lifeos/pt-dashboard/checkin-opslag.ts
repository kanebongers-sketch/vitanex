// ─── LifeOS — PT-dashboard: weekcheck-in opslaan en lezen (SERVER-ONLY) ─────
// `pt_weekcheckins` (migratie 353). De PT'er leest en schrijft alleen zijn eigen
// rij (gescoped op de link); Kane leest via `haalCheckinsVoor` in het coachgesprek.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { LeadLink } from '@/lib/lifeos/leads/links'
import { isEnergie, type Checkin, type CheckinInvoer } from './checkin'

export type CheckinUitkomst<T> = { ok: true; waarde: T } | { ok: false; reden: 'db' }

const KOLOMMEN = 'week, energie, gewonnen, lastig, bespreken, focus, bijgewerkt_op'

interface Rij {
  week: string
  energie: number | null
  gewonnen: string | null
  lastig: string | null
  bespreken: string | null
  focus: string | null
  bijgewerkt_op: string
}

function vanRij(r: Rij): Checkin {
  return {
    week: r.week,
    bijgewerktOp: r.bijgewerkt_op,
    energie: isEnergie(r.energie) ? r.energie : null,
    gewonnen: r.gewonnen,
    lastig: r.lastig,
    bespreken: r.bespreken,
    focus: r.focus,
  }
}

/** De check-in van deze PT'er voor `week`, of null als die er nog niet is. */
export async function haalCheckin(admin: SupabaseClient, link: LeadLink, week: string): Promise<CheckinUitkomst<Checkin | null>> {
  const { data, error } = await admin
    .from('pt_weekcheckins')
    .select(KOLOMMEN)
    .eq('user_id', link.userId)
    .eq('persoon_id', link.persoonId)
    .eq('week', week)
    .maybeSingle()
  if (error) return { ok: false, reden: 'db' }
  return { ok: true, waarde: data ? vanRij(data as Rij) : null }
}

/** Opslaan of bijwerken: één rij per PT'er per week. */
export async function slaCheckinOp(
  admin: SupabaseClient,
  link: LeadLink,
  week: string,
  c: CheckinInvoer,
  nu: Date,
): Promise<CheckinUitkomst<Checkin>> {
  const { data, error } = await admin
    .from('pt_weekcheckins')
    .upsert(
      {
        user_id: link.userId,
        persoon_id: link.persoonId,
        week,
        energie: c.energie,
        gewonnen: c.gewonnen,
        lastig: c.lastig,
        bespreken: c.bespreken,
        focus: c.focus,
        bijgewerkt_op: nu.toISOString(),
      },
      { onConflict: 'persoon_id,week' },
    )
    .select(KOLOMMEN)
    .single()
  if (error || !data) return { ok: false, reden: 'db' }
  return { ok: true, waarde: vanRij(data as Rij) }
}

/** De check-ins van meerdere PT'ers voor één week (coachgesprek), per persoon_id. Fout → leeg. */
export async function haalCheckinsVoor(
  admin: SupabaseClient,
  userId: string,
  persoonIds: readonly string[],
  week: string,
): Promise<Map<string, Checkin>> {
  const uit = new Map<string, Checkin>()
  if (persoonIds.length === 0) return uit
  const { data, error } = await admin
    .from('pt_weekcheckins')
    .select(`persoon_id, ${KOLOMMEN}`)
    .eq('user_id', userId)
    .eq('week', week)
    .in('persoon_id', [...persoonIds])
  if (error || !Array.isArray(data)) return uit
  for (const r of data as (Rij & { persoon_id: string })[]) uit.set(r.persoon_id, vanRij(r))
  return uit
}

/** Check-ins van meerdere PT'ers vanaf week `vanafWeek` (incl.), per persoon_id, nieuwste eerst. */
export async function haalCheckinsVanafVoor(
  admin: SupabaseClient,
  userId: string,
  persoonIds: readonly string[],
  vanafWeek: string,
): Promise<Map<string, Checkin[]>> {
  const uit = new Map<string, Checkin[]>()
  if (persoonIds.length === 0) return uit
  const { data, error } = await admin
    .from('pt_weekcheckins')
    .select(`persoon_id, ${KOLOMMEN}`)
    .eq('user_id', userId)
    .gte('week', vanafWeek)
    .in('persoon_id', [...persoonIds])
    .order('week', { ascending: false })
  if (error || !Array.isArray(data)) return uit
  for (const r of data as (Rij & { persoon_id: string })[]) {
    const lijst = uit.get(r.persoon_id) ?? []
    lijst.push(vanRij(r))
    uit.set(r.persoon_id, lijst)
  }
  return uit
}
