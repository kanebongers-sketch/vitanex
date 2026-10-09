/**
 * Server-side opslag van gezondheidsdata (migratie 053).
 * - Dagrijen: één rij per (user_id, datum, bron), idempotente upsert. Nieuwe
 *   waarden winnen, lege velden laten bestaande waarden van dezelfde bron staan.
 * - Trainingen: upsert op (user_id, bron, extern_id).
 * - Sync-status: rechten, laatste sync en laatste fout per bron.
 *
 * Werkt met elke Supabase-client: de native route geeft een RLS-gebonden
 * client met de sessie van de gebruiker; de (oude) Google Fit-route nog de admin.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  DAGRIJ_SELECT, mergeDagMetingen, normaliseerBron,
  type DagMeting, type DagRij, type HealthBron, type WorkoutMeting,
} from './health-data'

function fout(context: string, err: { message: string; code?: string }): Error {
  return new Error(`${context}: ${err.message}${err.code ? ` (${err.code})` : ''}`)
}

/** Slaat dagmetingen op voor één bron. Accepteert ook oude bronnamen. */
export async function slaDagMetingenOp(
  db: SupabaseClient,
  userId: string,
  bronInvoer: string,
  metingen: DagMeting[],
): Promise<{ opgeslagen: number }> {
  const bron = normaliseerBron(bronInvoer)
  if (!bron) throw new Error(`Onbekende gezondheidsbron: ${bronInvoer}`)
  if (metingen.length === 0) return { opgeslagen: 0 }

  const { data: bestaand, error: leesFout } = await db
    .from('health_native_logs')
    .select(DAGRIJ_SELECT)
    .eq('user_id', userId)
    .eq('bron', bron)
    .in('datum', metingen.map(m => m.datum))
  if (leesFout) throw fout('health_native_logs lezen mislukt', leesFout)

  const rijen = mergeDagMetingen((bestaand ?? []) as unknown as DagRij[], metingen, bron)
  if (rijen.length === 0) return { opgeslagen: 0 }

  const nu = new Date().toISOString()
  const { error: schrijfFout } = await db
    .from('health_native_logs')
    .upsert(rijen.map(r => ({ ...r, user_id: userId, bijgewerkt_op: nu })), { onConflict: 'user_id,datum,bron' })
  if (schrijfFout) throw fout('health_native_logs schrijven mislukt', schrijfFout)
  return { opgeslagen: rijen.length }
}

/** Upsert trainingen idempotent op (user_id, bron, extern_id). */
export async function slaWorkoutsOp(
  db: SupabaseClient,
  userId: string,
  bron: HealthBron,
  workouts: WorkoutMeting[],
): Promise<{ opgeslagen: number }> {
  if (workouts.length === 0) return { opgeslagen: 0 }
  // Dubbele extern_id's in één batch laten Postgres' upsert falen: ontdubbelen.
  const uniek = [...new Map(workouts.map(w => [w.externId, w])).values()]
  const { error } = await db.from('health_workouts').upsert(
    uniek.map(w => ({
      user_id: userId,
      bron,
      extern_id: w.externId,
      soort: w.soort,
      start: w.start,
      eind: w.eind,
      kcal: w.kcal ?? null,
      afstand_m: w.afstandM ?? null,
      gem_hartslag: w.gemHartslag ?? null,
    })),
    { onConflict: 'user_id,bron,extern_id' },
  )
  if (error) throw fout('health_workouts schrijven mislukt', error)
  return { opgeslagen: uniek.length }
}

export interface SyncStatusUpdate {
  rechten?: string[]
  /** Gezet = de sync is gelukt op dit moment. */
  laatsteSync?: string
  laatsteFout: string | null
}

/** Werkt de sync-status bij. Gooit niet: status mag een sync nooit breken. */
export async function werkSyncStatusBij(
  db: SupabaseClient,
  userId: string,
  bron: HealthBron,
  update: SyncStatusUpdate,
): Promise<void> {
  const rij = {
    user_id: userId,
    bron,
    laatste_fout: update.laatsteFout,
    bijgewerkt_op: new Date().toISOString(),
    ...(update.rechten ? { rechten: update.rechten } : {}),
    ...(update.laatsteSync ? { laatste_sync: update.laatsteSync } : {}),
  }
  const { error } = await db.from('health_sync_status').upsert(rij, { onConflict: 'user_id,bron' })
  if (error) console.error('[health-sync] status bijwerken mislukt', error.message)
}

export interface SyncStatus {
  bron: HealthBron
  rechten: string[]
  laatsteSync: string | null
  laatsteFout: string | null
}

/** Leest de sync-status van alle bronnen van de gebruiker. */
export async function leesSyncStatus(db: SupabaseClient, userId: string): Promise<SyncStatus[]> {
  const { data, error } = await db
    .from('health_sync_status')
    .select('bron, rechten, laatste_sync, laatste_fout')
    .eq('user_id', userId)
  if (error) throw fout('health_sync_status lezen mislukt', error)
  return (data ?? []).map(r => ({
    bron: r.bron as HealthBron,
    rechten: (r.rechten as string[] | null) ?? [],
    laatsteSync: (r.laatste_sync as string | null) ?? null,
    laatsteFout: (r.laatste_fout as string | null) ?? null,
  }))
}
