// ─── Club, push: abonnementen in de database (SERVER-ONLY) ──────────────────
// Elke query filtert op de sportschool (user_id) en het lid. Een endpoint is
// uniek: zet een ander lid op hetzelfde toestel meldingen aan, dan gaat het
// abonnement naar dat lid. Per lid hooguit MAX_PER_LID toestellen.

import type { SupabaseClient } from '@supabase/supabase-js'
import { zorgVoorToken } from '@/lib/club/meldingen/context'
import type { PushAbonnement } from './abonnement'

const TABEL = 'club_push_abonnementen'
export const MAX_PER_LID = 10

export interface OpgeslagenAbonnement extends PushAbonnement {
  id: string
  userId: string
  lidId: string
}

function log(wat: string, fout: { message: string } | null): void {
  if (fout) console.error(`[club-push] ${wat} mislukt`, fout.message)
}

async function zetVoorkeur(admin: SupabaseClient, userId: string, lidId: string, push: boolean): Promise<boolean> {
  // De voorkeur-rij heeft een afmeldtoken nodig; maak hem aan als hij er nog niet is.
  if (!(await zorgVoorToken(admin, userId, lidId))) return false
  const { error } = await admin.from('club_meldingen_voorkeuren').update({ push, gewijzigd_op: new Date().toISOString() }).eq('user_id', userId).eq('lid_id', lidId)
  log('voorkeur opslaan', error)
  return !error
}

/** Oudste toestellen boven de grens weg. */
async function houdBinnenGrens(admin: SupabaseClient, userId: string, lidId: string): Promise<void> {
  const { data, error } = await admin.from(TABEL).select('id').eq('user_id', userId).eq('lid_id', lidId).order('aangemaakt_op', { ascending: false })
  log('toestellen tellen', error)
  const teVeel = ((data ?? []) as Array<{ id: string }>).slice(MAX_PER_LID).map((r) => r.id)
  if (teVeel.length === 0) return
  const { error: f2 } = await admin.from(TABEL).delete().eq('user_id', userId).eq('lid_id', lidId).in('id', teVeel)
  log('oude toestellen wissen', f2)
}

export interface Aanmelding {
  userId: string
  lidId: string
  abonnement: PushAbonnement
  toestel: string | null
  sessieHash: string | null
}

/** Meldingen aan op dit toestel. */
export async function bewaarAbonnement(admin: SupabaseClient, a: Aanmelding): Promise<boolean> {
  const { error } = await admin.from(TABEL).upsert(
    {
      user_id: a.userId,
      lid_id: a.lidId,
      endpoint: a.abonnement.endpoint,
      p256dh: a.abonnement.p256dh,
      auth: a.abonnement.auth,
      user_agent: a.toestel?.slice(0, 120) ?? null,
      sessie_hash: a.sessieHash,
      aangemaakt_op: new Date().toISOString(),
    },
    { onConflict: 'endpoint' },
  )
  log('abonnement opslaan', error)
  if (error) return false
  await houdBinnenGrens(admin, a.userId, a.lidId)
  return zetVoorkeur(admin, a.userId, a.lidId, true)
}

/** Meldingen uit op dit toestel. Geen toestel meer over: de voorkeur gaat op uit. */
export async function verwijderAbonnement(admin: SupabaseClient, userId: string, lidId: string, endpoint: string | null): Promise<boolean> {
  if (endpoint) {
    const { error } = await admin.from(TABEL).delete().eq('user_id', userId).eq('lid_id', lidId).eq('endpoint', endpoint)
    log('abonnement wissen', error)
    if (error) return false
  }
  const { count, error } = await admin.from(TABEL).select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('lid_id', lidId)
  log('toestellen tellen', error)
  if (error) return false
  return (count ?? 0) > 0 ? true : zetVoorkeur(admin, userId, lidId, false)
}

/** Bij uitloggen: de abonnementen van deze sessie, of met `lid` alle van het lid. */
export async function wisAbonnementenBijUitloggen(admin: SupabaseClient, wie: { sessieHash: string } | { userId: string; lidId: string }): Promise<void> {
  const q = admin.from(TABEL).delete()
  const { error } = 'sessieHash' in wie ? await q.eq('sessie_hash', wie.sessieHash) : await q.eq('user_id', wie.userId).eq('lid_id', wie.lidId)
  log('abonnementen wissen bij uitloggen', error)
}

function uitRij(r: Record<string, unknown>): OpgeslagenAbonnement | null {
  if (typeof r.id !== 'string' || typeof r.user_id !== 'string' || typeof r.lid_id !== 'string') return null
  if (typeof r.endpoint !== 'string' || typeof r.p256dh !== 'string' || typeof r.auth !== 'string') return null
  return { id: r.id, userId: r.user_id, lidId: r.lid_id, endpoint: r.endpoint, p256dh: r.p256dh, auth: r.auth }
}

/** De abonnementen van deze leden, per "sportschool:lid". */
export async function abonnementenVan(admin: SupabaseClient, lidIds: readonly string[]): Promise<Map<string, OpgeslagenAbonnement[]>> {
  const uit = new Map<string, OpgeslagenAbonnement[]>()
  const uniek = [...new Set(lidIds)]
  if (uniek.length === 0) return uit
  const { data, error } = await admin.from(TABEL).select('id, user_id, lid_id, endpoint, p256dh, auth').in('lid_id', uniek)
  log('abonnementen lezen', error)
  for (const r of ((data ?? []) as Array<Record<string, unknown>>).map(uitRij)) {
    if (!r) continue
    const sleutel = `${r.userId}:${r.lidId}`
    uit.set(sleutel, [...(uit.get(sleutel) ?? []), r])
  }
  return uit
}

export async function wisAbonnement(admin: SupabaseClient, id: string): Promise<void> {
  const { error } = await admin.from(TABEL).delete().eq('id', id)
  log('verlopen abonnement wissen', error)
}

export async function markeerGebruikt(admin: SupabaseClient, ids: readonly string[], nu: Date): Promise<void> {
  if (ids.length === 0) return
  const { error } = await admin.from(TABEL).update({ laatst_gebruikt_op: nu.toISOString() }).in('id', [...ids])
  log('laatst gebruikt bijwerken', error)
}
