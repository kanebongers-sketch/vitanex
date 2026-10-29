// ─── Fit Factory Club: ledenlijst lezen (SERVER-ONLY) ───────────────────────
// Haalt alle leden van een vestiging plus hun bezoeken (12 weken) en no-shows
// (8 weken) op, zodat de pagina kan filteren, sorteren en de behoudsscore kan
// rekenen. Bezoeken en no-shows tellen in ALLE vestigingen, net als op de
// ledenkaart: een lid van Budel dat in Bergeijk traint, is geen risico.
// Supabase geeft maximaal 1000 rijen per verzoek, dus we lezen in blokken.

import type { SupabaseClient } from '@supabase/supabase-js'
import { LID_KOLOMMEN, lidUitRij, type Lid } from '@/lib/club/kern/lid'
import type { Vestiging } from '@/lib/club/kern/vestiging'
import type { Taal } from '@/lib/aiyourgym/taal/taal'
import { NO_SHOW_DAGEN, VENSTER_DAGEN } from './behoud'
import { bouwRijen, type LedenRij } from './lijst'
import { checkinUitRij, reserveringUitRij } from './rijen'
import { haalLedenMetApp } from '@/lib/club/app-uitnodigen/met-app'

const BLOK = 1000
const MAX_RIJEN = 50_000
const MS_DAG = 86_400_000

interface Antwoord {
  data: unknown[] | null
  error: { message: string } | null
}

/** Na het eerste volle blok lopen zoveel blokken van 1000 tegelijk; een korter blok betekent het einde. */
const GOLF = 4

/** Leest alle rijen in blokken van 1000 (de meeste lijsten zijn een blok; daarna een golf tegelijk). Null bij een fout (gelogd). */
export async function alleRijen(waar: string, maak: (van: number, tot: number) => PromiseLike<Antwoord>): Promise<unknown[] | null> {
  const rijen: unknown[] = []
  for (let van = 0; van < MAX_RIJEN; ) {
    const golf = van === 0 ? 1 : GOLF
    const vanafs = Array.from({ length: golf }, (_, i) => van + i * BLOK).filter((v) => v < MAX_RIJEN)
    const antwoorden = await Promise.all(vanafs.map((v) => maak(v, v + BLOK - 1)))
    for (const { data, error } of antwoorden) {
      if (error) {
        console.error(`[club] ${waar} lezen mislukt`, error.message)
        return null
      }
      const blok = data ?? []
      rijen.push(...blok)
      if (blok.length < BLOK) return rijen
    }
    van += golf * BLOK
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
    admin.from('club_checkins').select('id, lid_id, op, club_leden!inner(vestiging)').eq('user_id', userId)
      .eq('club_leden.vestiging', v).gte('op', sinds.toISOString()).order('op').order('id').range(van, tot),
  )
  if (!rijen) return null
  const perLid = new Map<string, Date[]>()
  for (const c of rijen.map(checkinUitRij)) {
    if (c) {
      const lijst = perLid.get(c.lidId)
      if (lijst) lijst.push(c.op)
      else perLid.set(c.lidId, [c.op])
    }
  }
  return perLid
}

async function haalNoShows(admin: SupabaseClient, userId: string, v: Vestiging, sinds: Date, nu: Date): Promise<Map<string, number> | null> {
  const rijen = await alleRijen('no-shows', (van, tot) =>
    admin.from('club_reserveringen')
      .select('id, lid_id, status, club_lessen!inner(id, start_op, eind_op, status, vestiging), club_leden!inner(vestiging)')
      .eq('user_id', userId).eq('status', 'no_show').eq('club_leden.vestiging', v)
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

async function laatsteVanEenLid(admin: SupabaseClient, userId: string, lidId: string, voor: Date): Promise<Date | null> {
  const { data, error } = await admin.from('club_checkins').select('id, lid_id, op').eq('user_id', userId).eq('lid_id', lidId)
    .lt('op', voor.toISOString()).order('op', { ascending: false }).limit(1).maybeSingle()
  if (error) console.error('[club] laatste bezoek lezen mislukt', error.message)
  return checkinUitRij(data)?.op ?? null
}

/** Per groep van 100 leden: het laatste bezoek van voor `voor`. Is het blok vol, dan per lid na. */
async function laatsteVoorBlok(admin: SupabaseClient, userId: string, ids: string[], voor: Date): Promise<Map<string, Date> | null> {
  const { data, error } = await admin.from('club_checkins').select('id, lid_id, op').eq('user_id', userId).in('lid_id', ids)
    .lt('op', voor.toISOString()).order('op', { ascending: false }).limit(BLOK)
  if (error) {
    console.error('[club] eerdere bezoeken lezen mislukt', error.message)
    return null
  }
  const rijen = data ?? []
  const uit = new Map<string, Date>()
  for (const c of rijen.map(checkinUitRij)) if (c && !uit.has(c.lidId)) uit.set(c.lidId, c.op)
  if (rijen.length < BLOK) return uit
  const open = ids.filter((id) => !uit.has(id))
  const los = await Promise.all(open.map((id) => laatsteVanEenLid(admin, userId, id, voor)))
  open.forEach((id, i) => { const op = los[i]; if (op) uit.set(id, op) })
  return uit
}

/** Het laatste bezoek ooit voor leden zonder bezoek in het venster. Null bij een fout. */
async function haalEerdereBezoeken(admin: SupabaseClient, userId: string, ids: string[], voor: Date): Promise<Map<string, Date> | null> {
  const blokken = Array.from({ length: Math.ceil(ids.length / 100) }, (_, i) => ids.slice(i * 100, i * 100 + 100))
  const delen = await Promise.all(blokken.map((b) => laatsteVoorBlok(admin, userId, b, voor)))
  if (delen.some((d) => d === null)) return null
  return new Map(delen.flatMap((d) => [...(d ?? new Map<string, Date>())]))
}

/** Alle ledenrijen van een vestiging, of null als iets niet te lezen was. */
export async function haalLedenRijen(admin: SupabaseClient, userId: string, v: Vestiging, nu: Date, taal: Taal = 'nl'): Promise<LedenRij[] | null> {
  const vensterStart = new Date(nu.getTime() - (VENSTER_DAGEN + 1) * MS_DAG)
  const [leden, bezoeken, noShows, metApp] = await Promise.all([
    haalLedenVanVestiging(admin, userId, v),
    haalBezoeken(admin, userId, v, vensterStart),
    haalNoShows(admin, userId, v, new Date(nu.getTime() - NO_SHOW_DAGEN * MS_DAG), nu),
    haalLedenMetApp(admin, userId),
  ])
  if (!leden || !bezoeken || !noShows) return null
  const zonderRecent = leden.filter((l) => !bezoeken.has(l.id)).map((l) => l.id)
  const eerder = await haalEerdereBezoeken(admin, userId, zonderRecent, vensterStart)
  if (!eerder) return null
  // Wie de app heeft is extra informatie: lukt dat lezen niet (gelogd), dan toont de lijst niemand met app.
  return bouwRijen(leden, bezoeken, noShows, nu, eerder, metApp ?? new Set(), taal)
}
