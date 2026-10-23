// ─── Club, health: lezen en schrijven in de database (SERVER-ONLY) ──────────
// Alles filtert op de sportschool (user_id) en het lid. Tokens gaan alleen
// versleuteld de database in en komen nooit in een log of in een antwoord aan de
// browser (KOPPELING_VELDEN_PUBLIEK heeft geen tokenkolom).

import type { SupabaseClient } from '@supabase/supabase-js'
import type { HttpAntwoord, HttpVerzoek } from './adapter'
import type { Koppeling, KoppelingStatus, KoppelingWijziging, SyncLogRegel, SyncOpslag } from './sync'
import { toestemmingUitRij, type Toestemming } from './toestemming'
import { isBronId, isDataSoort, type BronId, type DataSoort, type Meting, type TrainingDetails } from './typen'

export const KOPPELING_VELDEN = 'id, user_id, lid_id, bron, status, tokens_versleuteld, cursor, fout_pogingen'
const KOPPELING_VELDEN_PUBLIEK = 'bron, status, laatste_sync_op, laatste_fout, aangemaakt_op'
const METING_VELDEN = 'bron, extern_id, soort, waarde, training, gemeten_op'

const STATUSSEN: readonly KoppelingStatus[] = ['actief', 'fout', 'opnieuw_koppelen', 'ingetrokken']

function isStatus(v: unknown): v is KoppelingStatus {
  return typeof v === 'string' && (STATUSSEN as readonly string[]).includes(v)
}

export function koppelingUitRij(r: Record<string, unknown>): Koppeling | null {
  if (typeof r.id !== 'string' || typeof r.user_id !== 'string' || typeof r.lid_id !== 'string' || !isBronId(r.bron) || !isStatus(r.status)) return null
  return {
    id: r.id,
    userId: r.user_id,
    lidId: r.lid_id,
    bron: r.bron,
    status: r.status,
    tokensVersleuteld: typeof r.tokens_versleuteld === 'string' ? r.tokens_versleuteld : null,
    cursor: typeof r.cursor === 'string' ? r.cursor : null,
    foutPogingen: typeof r.fout_pogingen === 'number' ? r.fout_pogingen : 0,
  }
}

function trainingUit(v: unknown): TrainingDetails | null {
  if (typeof v !== 'object' || v === null) return null
  const r = v as Record<string, unknown>
  if (typeof r.soort !== 'string' || typeof r.duurSec !== 'number') return null
  const n = (x: unknown): number | null => (typeof x === 'number' ? x : null)
  return { soort: r.soort, duurSec: r.duurSec, kcal: n(r.kcal), gemHartslag: n(r.gemHartslag) }
}

function metingUitRij(r: Record<string, unknown>): Meting | null {
  if (!isBronId(r.bron) || !isDataSoort(r.soort) || typeof r.extern_id !== 'string' || typeof r.gemeten_op !== 'string') return null
  const waarde = typeof r.waarde === 'number' ? r.waarde : Number(r.waarde)
  if (!Number.isFinite(waarde)) return null
  return { soort: r.soort, waarde, training: trainingUit(r.training), bron: r.bron, externId: r.extern_id, gemetenOp: r.gemeten_op }
}

// ── Toestemming ────────────────────────────────────────────────────────────

/** De laatste keuze van het lid; null bij een leesfout. */
export async function haalToestemming(admin: SupabaseClient, userId: string, lidId: string): Promise<Toestemming | null> {
  const { data, error } = await admin
    .from('club_health_toestemmingen')
    .select('delen, trainer_zien, trainer_bronnen, tekst_versie, gegeven_op, ingetrokken_op')
    .eq('user_id', userId)
    .eq('lid_id', lidId)
    .order('gegeven_op', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) {
    console.error('[club/health] toestemming lezen mislukt', error.code)
    return null
  }
  return toestemmingUitRij(data as Record<string, unknown> | null)
}

/** Een nieuwe keuze (altijd een nieuwe rij: zo blijft vastliggen wat wanneer gekozen is). */
export async function bewaarToestemming(admin: SupabaseClient, p: { userId: string; lidId: string; delen: readonly DataSoort[]; trainerZien: readonly DataSoort[]; trainerBronnen: readonly BronId[]; versie: string; ingetrokken: boolean }): Promise<boolean> {
  const nu = new Date().toISOString()
  const { error } = await admin.from('club_health_toestemmingen').insert({
    user_id: p.userId,
    lid_id: p.lidId,
    delen: p.ingetrokken ? [] : p.delen,
    trainer_zien: p.ingetrokken ? [] : p.trainerZien,
    trainer_bronnen: p.ingetrokken ? [] : p.trainerBronnen,
    tekst_versie: p.versie,
    gegeven_op: nu,
    ingetrokken_op: p.ingetrokken ? nu : null,
  })
  if (error) console.error('[club/health] toestemming opslaan mislukt', error.code)
  return !error
}

// ── Koppelingen ────────────────────────────────────────────────────────────

export interface KoppelingPubliek {
  bron: BronId
  status: KoppelingStatus
  laatsteSyncOp: string | null
  laatsteFout: string | null
  sinds: string
}

export async function haalKoppelingenPubliek(admin: SupabaseClient, userId: string, lidId: string): Promise<KoppelingPubliek[] | null> {
  const { data, error } = await admin.from('club_health_koppelingen').select(KOPPELING_VELDEN_PUBLIEK).eq('user_id', userId).eq('lid_id', lidId)
  if (error) {
    console.error('[club/health] koppelingen lezen mislukt', error.code)
    return null
  }
  return ((data ?? []) as Record<string, unknown>[]).flatMap((r) =>
    isBronId(r.bron) && isStatus(r.status)
      ? [{ bron: r.bron, status: r.status, laatsteSyncOp: typeof r.laatste_sync_op === 'string' ? r.laatste_sync_op : null, laatsteFout: typeof r.laatste_fout === 'string' ? r.laatste_fout : null, sinds: String(r.aangemaakt_op ?? '') }]
      : [],
  )
}

/** undefined = leesfout, null = geen koppeling. */
export async function haalKoppeling(admin: SupabaseClient, userId: string, lidId: string, bron: BronId): Promise<Koppeling | null | undefined> {
  const { data, error } = await admin.from('club_health_koppelingen').select(KOPPELING_VELDEN).eq('user_id', userId).eq('lid_id', lidId).eq('bron', bron).maybeSingle()
  if (error) {
    console.error('[club/health] koppeling lezen mislukt', error.code)
    return undefined
  }
  return data ? koppelingUitRij(data as Record<string, unknown>) : null
}

function wijzigingNaarRij(w: KoppelingWijziging): Record<string, unknown> {
  const rij: Record<string, unknown> = { gewijzigd_op: new Date().toISOString() }
  if (w.status !== undefined) rij.status = w.status
  if (w.tokensVersleuteld !== undefined) rij.tokens_versleuteld = w.tokensVersleuteld
  if (w.tokenVerlooptOp !== undefined) rij.token_verloopt_op = w.tokenVerlooptOp
  if (w.externGebruikerId !== undefined) rij.extern_gebruiker_id = w.externGebruikerId
  if (w.scope !== undefined) rij.scope = w.scope?.slice(0, 300) ?? null
  if (w.cursor !== undefined) rij.cursor = w.cursor
  if (w.laatsteSyncOp !== undefined) rij.laatste_sync_op = w.laatsteSyncOp
  if (w.volgendeSyncOp !== undefined) rij.volgende_sync_op = w.volgendeSyncOp
  if (w.foutPogingen !== undefined) rij.fout_pogingen = w.foutPogingen
  if (w.laatsteFout !== undefined) rij.laatste_fout = w.laatsteFout?.slice(0, 40) ?? null
  return rij
}

/** Nieuw koppelen (of opnieuw): een rij per lid en bron. Geeft de koppeling terug. */
export async function bewaarKoppeling(admin: SupabaseClient, p: { userId: string; lidId: string; bron: BronId; wijziging: KoppelingWijziging }): Promise<Koppeling | null> {
  const { data, error } = await admin
    .from('club_health_koppelingen')
    .upsert({ user_id: p.userId, lid_id: p.lidId, bron: p.bron, cursor: null, fout_pogingen: 0, laatste_fout: null, volgende_sync_op: new Date().toISOString(), ...wijzigingNaarRij(p.wijziging) }, { onConflict: 'lid_id,bron' })
    .select(KOPPELING_VELDEN)
    .single()
  if (error) {
    console.error('[club/health] koppeling opslaan mislukt', error.code)
    return null
  }
  return koppelingUitRij(data as Record<string, unknown>)
}

export async function werkKoppelingBij(admin: SupabaseClient, k: Pick<Koppeling, 'id' | 'userId'>, w: KoppelingWijziging): Promise<boolean> {
  const { error } = await admin.from('club_health_koppelingen').update(wijzigingNaarRij(w)).eq('id', k.id).eq('user_id', k.userId)
  if (error) console.error('[club/health] koppeling bijwerken mislukt', error.code)
  return !error
}

export async function verwijderKoppeling(admin: SupabaseClient, userId: string, lidId: string, bron: BronId): Promise<boolean> {
  const { error } = await admin.from('club_health_koppelingen').delete().eq('user_id', userId).eq('lid_id', lidId).eq('bron', bron)
  if (error) console.error('[club/health] koppeling verwijderen mislukt', error.code)
  return !error
}

// ── Metingen ───────────────────────────────────────────────────────────────

const BLOK = 500

/**
 * Upsert zonder dubbelen (unique lid, bron, extern id): dezelfde meting nog eens
 * werkt de rij bij (de stappen van vandaag groeien nog). Het aantal verwerkte rijen, of null.
 */
export async function bewaarMetingen(admin: SupabaseClient, userId: string, lidId: string, metingen: readonly Meting[]): Promise<number | null> {
  let nieuw = 0
  for (let i = 0; i < metingen.length; i += BLOK) {
    const rijen = metingen.slice(i, i + BLOK).map((m) => ({ user_id: userId, lid_id: lidId, bron: m.bron, extern_id: m.externId, soort: m.soort, waarde: m.waarde, training: m.training, gemeten_op: m.gemetenOp }))
    const { data, error } = await admin.from('club_health_metingen').upsert(rijen, { onConflict: 'lid_id,bron,extern_id' }).select('id')
    if (error) {
      console.error('[club/health] metingen opslaan mislukt', error.code)
      return null
    }
    nieuw += data?.length ?? 0
  }
  return nieuw
}

/** De laatste metingen van een lid, eventueel alleen bepaalde soorten. null bij een fout. */
export async function haalMetingen(admin: SupabaseClient, userId: string, lidId: string, p: { soorten?: readonly DataSoort[]; limiet?: number } = {}): Promise<Meting[] | null> {
  if (p.soorten && p.soorten.length === 0) return []
  let q = admin.from('club_health_metingen').select(METING_VELDEN).eq('user_id', userId).eq('lid_id', lidId)
  if (p.soorten) q = q.in('soort', [...p.soorten])
  const { data, error } = await q.order('gemeten_op', { ascending: false }).limit(Math.min(p.limiet ?? 200, 1000))
  if (error) {
    console.error('[club/health] metingen lezen mislukt', error.code)
    return null
  }
  return ((data ?? []) as Record<string, unknown>[]).map(metingUitRij).filter((m): m is Meting => m !== null)
}

/** Ingevoerde gegevens wissen: van een bron, of alles (bron null). */
export async function wisMetingen(admin: SupabaseClient, userId: string, lidId: string, bron: BronId | null): Promise<boolean> {
  let q = admin.from('club_health_metingen').delete().eq('user_id', userId).eq('lid_id', lidId)
  if (bron) q = q.eq('bron', bron)
  const { error } = await q
  if (error) console.error('[club/health] metingen wissen mislukt', error.code)
  return !error
}

/** Soorten zonder toestemming meer: die metingen gaan weg (bij intrekken per soort). */
export async function wisSoorten(admin: SupabaseClient, userId: string, lidId: string, soorten: readonly DataSoort[]): Promise<boolean> {
  if (soorten.length === 0) return true
  const { error } = await admin.from('club_health_metingen').delete().eq('user_id', userId).eq('lid_id', lidId).in('soort', [...soorten])
  if (error) console.error('[club/health] soorten wissen mislukt', error.code)
  return !error
}

// ── Sync en webhooks ───────────────────────────────────────────────────────

export function supabaseSyncOpslag(admin: SupabaseClient): SyncOpslag {
  return {
    haalToestemming: (userId, lidId) => haalToestemming(admin, userId, lidId),
    bewaarMetingen: (userId, lidId, metingen) => bewaarMetingen(admin, userId, lidId, metingen),
    werkKoppelingBij: (k, w) => werkKoppelingBij(admin, k, w),
    logSync: async (r: SyncLogRegel) => {
      const { error } = await admin.from('club_health_sync_log').insert({
        user_id: r.userId, koppeling_id: r.koppelingId, bron: r.bron, gestart_op: r.gestartOp, klaar_op: r.klaarOp, status: r.status, nieuw: r.nieuw, fout_code: r.foutCode,
      })
      if (error) console.error('[club/health] synclog schrijven mislukt', error.code)
    },
  }
}

const TIMEOUT_MS = 15_000

/** Het echte netwerk, met een time-out. Logt nooit kopteksten of bodies (daar staan tokens in). */
export async function echteHttp(v: HttpVerzoek): Promise<HttpAntwoord> {
  const res = await fetch(v.url, { method: v.methode, headers: v.headers, body: v.body, signal: AbortSignal.timeout(TIMEOUT_MS), cache: 'no-store', redirect: 'error' })
  const headers: Record<string, string> = {}
  res.headers.forEach((waarde, sleutel) => {
    headers[sleutel.toLowerCase()] = waarde
  })
  const tekst = await res.text()
  let json: unknown = null
  try {
    json = tekst ? (JSON.parse(tekst) as unknown) : null
  } catch {
    json = null
  }
  return { status: res.status, headers, json }
}
