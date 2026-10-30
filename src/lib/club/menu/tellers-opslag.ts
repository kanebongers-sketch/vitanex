// ─── Club: tellers in het menu lezen (SERVER) ───────────────────────────────
// Lichte tellingen per verzoek (head: true, alleen het aantal), altijd op de
// sportschool (user_id) en de vestiging. Alleen de soorten die deze persoon
// mag (zie tellers.ts). Kort onthouden in het geheugen van deze instantie
// (CACHE_MS), zodat een snelle reeks klikken de database niet raakt. Een fout
// geeft geen getal (liever niets dan een verkeerd getal) en wordt gelogd.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Vestiging } from '@/lib/club/kern/vestiging'
import { alleenActief, haalAfvinkingen, haalTaken } from '@/lib/club/taken/opslag'
import { nogOpen, takenVanVandaag } from '@/lib/club/taken/voortgang'
import { weekContext } from '@/lib/club/taken/week'
import { weekParam, nlDelen } from '@/lib/club/rooster/tijd'
import { tellersVoor, welkeTellers, type TellerRechten, type TellerSoort, type Tellers } from './tellers'

const CACHE_MS = 10_000
const CACHE_MAX = 500
const cache = new Map<string, { tot: number; tellers: Tellers }>()

/** Statussen van een lead die nog opgevolgd wordt (zelfde als de lijst op Vandaag). */
const LEAD_OPVOLGEN = ['nieuw', 'contact', 'proefles_geweest']

function log(wat: string, fout: { message: string }): void {
  console.error(`[club-menu] ${wat} tellen mislukt`, fout.message)
}

/** Het aantal rijen of null bij een fout. */
async function aantal(wat: string, query: PromiseLike<{ count: number | null; error: { message: string } | null }>): Promise<number | null> {
  const { count, error } = await query
  if (error) {
    log(wat, error)
    return null
  }
  return count ?? 0
}

/** Verplichte taken van vandaag die nog open staan (zoals de tegel op Vandaag ze telt). */
async function openTaken(admin: SupabaseClient, userId: string, vestiging: Vestiging, vandaag: string): Promise<number | null> {
  const week = weekContext(weekParam(vandaag), vandaag)
  const [data, afvinkingen] = await Promise.all([haalTaken(admin, userId, vestiging), haalAfvinkingen(admin, userId, vestiging, week.maandag, week.zondag)])
  if (!data || !afvinkingen) return null
  return nogOpen(takenVanVandaag(alleenActief(data).taken, afvinkingen, week.dagen, vandaag))
}

function leadsBasis(admin: SupabaseClient, userId: string, vestiging: Vestiging) {
  return admin.from('club_leads').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('vestiging', vestiging).is('geanonimiseerd_op', null)
}

/** Open opvolging van leden plus leads die vandaag of eerder gebeld moesten worden. */
async function teBellen(admin: SupabaseClient, userId: string, vestiging: Vestiging, vandaag: string, r: TellerRechten): Promise<number | null> {
  const [leden, leads] = await Promise.all([
    r.opvolgenLeden ? aantal('opvolging', admin.from('club_opvolgtaken').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('vestiging', vestiging).eq('status', 'open')) : 0,
    r.leads ? aantal('leads opvolgen', leadsBasis(admin, userId, vestiging).in('status', LEAD_OPVOLGEN).lte('opvolgen_op', vandaag)) : 0,
  ])
  return leden === null || leads === null ? null : leden + leads
}

export interface TellerVraag {
  admin: SupabaseClient
  userId: string
  vestiging: Vestiging
  rechten: TellerRechten
  nu: Date
}

/** De tellers voor deze persoon in deze vestiging; een soort die niet te lezen was, ontbreekt. */
export async function haalTellers({ admin, userId, vestiging, rechten, nu }: TellerVraag): Promise<Tellers> {
  const mag = welkeTellers(rechten)
  if (mag.length === 0) return {}
  const sleutel = `${userId}|${vestiging}|${Object.entries(rechten).map(([k, v]) => `${k}:${v ? 1 : 0}`).join(',')}`
  const bewaard = cache.get(sleutel)
  if (bewaard && bewaard.tot > nu.getTime()) return bewaard.tellers
  const vandaag = nlDelen(nu).datum
  const zo = (s: TellerSoort) => mag.includes(s)
  const [taken, opvolgen, leads] = await Promise.all([
    zo('taken') ? openTaken(admin, userId, vestiging, vandaag) : null,
    zo('opvolgen') ? teBellen(admin, userId, vestiging, vandaag, rechten) : null,
    zo('leads') ? aantal('nieuwe leads', leadsBasis(admin, userId, vestiging).eq('status', 'nieuw')) : null,
  ])
  const tellers = tellersVoor({ taken, opvolgen, leads }, mag)
  if (cache.size >= CACHE_MAX) cache.clear()
  cache.set(sleutel, { tot: nu.getTime() + CACHE_MS, tellers })
  return tellers
}
