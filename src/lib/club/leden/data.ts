// ─── Fit Factory Club: ledenlijst lezen (SERVER-ONLY) ───────────────────────
// Haalt alle leden van een vestiging plus hun bezoeken (12 weken) en no-shows
// (8 weken) op, zodat de pagina kan filteren, sorteren en de behoudsscore kan
// rekenen. Supabase geeft maximaal 1000 rijen per verzoek, dus we lezen in
// blokken. Voor de pilot (honderden leden) ruim snel genoeg.

import type { SupabaseClient } from '@supabase/supabase-js'
import { LID_KOLOMMEN, lidUitRij, type Lid } from '@/lib/club/kern/lid'
import type { Vestiging } from '@/lib/club/kern/vestiging'
import { NO_SHOW_DAGEN, VENSTER_DAGEN } from './behoud'
import { bouwRijen, type LedenRij } from './lijst'
import { checkinUitRij, reserveringUitRij } from './rijen'

const BLOK = 1000
const MAX_RIJEN = 50_000
const MS_DAG = 86_400_000

interface Antwoord {
  data: unknown[] | null
  error: { message: string } | null
}

/** Leest alle rijen in blokken van 1000. Null bij een fout (gelogd). */
export async function alleRijen(waar: string, maak: (van: number, tot: number) => PromiseLike<Antwoord>): Promise<unknown[] | null> {
  const rijen: unknown[] = []
  for (let van = 0; van < MAX_RIJEN; van += BLOK) {
    const { data, error } = await maak(van, van + BLOK - 1)
    if (error) {
      console.error(`[club] ${waar} lezen mislukt`, error.message)
      return null
    }
    const blok = data ?? []
    rijen.push(...blok)
    if (blok.length < BLOK) break
  }
  return rijen
}

async function haalLedenVanVestiging(admin: SupabaseClient, userId: string, v: Vestiging): Promise<Lid[] | null> {
  const rijen = await alleRijen('leden', (van, tot) =>
    admin.from('club_leden').select(LID_KOLOMMEN).eq('user_id', userId).eq('vestiging', v).order('id').range(van, tot),
  )
  return rijen ? rijen.map(lidUitRij).filter((l): l is Lid => l !== null) : null
}

async function haalBezoeken(admin: SupabaseClient, userId: string, v: Vestiging, sinds: Date): Promise<Map<string, Date[]> | null> {
  const rijen = await alleRijen('bezoeken', (van, tot) =>
    admin.from('club_checkins').select('id, lid_id, op').eq('user_id', userId).eq('vestiging', v)
      .gte('op', sinds.toISOString()).order('op').order('id').range(van, tot),
  )
  if (!rijen) return null
  const perLid = new Map<string, Date[]>()
  for (const c of rijen.map(checkinUitRij)) {
    if (c) perLid.set(c.lidId, [...(perLid.get(c.lidId) ?? []), c.op])
  }
  return perLid
}

async function haalNoShows(admin: SupabaseClient, userId: string, v: Vestiging, sinds: Date, nu: Date): Promise<Map<string, number> | null> {
  const rijen = await alleRijen('no-shows', (van, tot) =>
    admin.from('club_reserveringen').select('id, lid_id, status, club_lessen!inner(id, start_op, eind_op, status, vestiging)')
      .eq('user_id', userId).eq('status', 'no_show').eq('club_lessen.vestiging', v)
      .gte('club_lessen.start_op', sinds.toISOString()).lte('club_lessen.start_op', nu.toISOString())
      .order('id').range(van, tot),
  )
  if (!rijen) return null
  const perLid = new Map<string, number>()
  for (const r of rijen.map(reserveringUitRij)) {
    if (r) perLid.set(r.lidId, (perLid.get(r.lidId) ?? 0) + 1)
  }
  return perLid
}

/** Alle ledenrijen van een vestiging, of null als iets niet te lezen was. */
export async function haalLedenRijen(admin: SupabaseClient, userId: string, v: Vestiging, nu: Date): Promise<LedenRij[] | null> {
  const [leden, bezoeken, noShows] = await Promise.all([
    haalLedenVanVestiging(admin, userId, v),
    haalBezoeken(admin, userId, v, new Date(nu.getTime() - (VENSTER_DAGEN + 1) * MS_DAG)),
    haalNoShows(admin, userId, v, new Date(nu.getTime() - NO_SHOW_DAGEN * MS_DAG), nu),
  ])
  if (!leden || !bezoeken || !noShows) return null
  return bouwRijen(leden, bezoeken, noShows, nu)
}
