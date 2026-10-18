// ─── Gezondheidscontrole: de proefvraag op de database (SERVER-ONLY) ────────
// Een kleine vraag op de LifeOS-database (waar Club in staat) met een harde
// tijdslimiet. Leest een rij-id, geeft het nooit terug.

import type { SupabaseClient } from '@supabase/supabase-js'
import { DB_TIMEOUT_MS, dbStandUit, type DbStand } from './status'

export interface DbMeting {
  stand: DbStand
  /** Hoe lang de vraag duurde, in milliseconden. */
  ms: number
}

export async function meetDatabase(admin: SupabaseClient, timeoutMs = DB_TIMEOUT_MS): Promise<DbMeting> {
  const start = Date.now()
  const rem = new AbortController()
  const klok = setTimeout(() => rem.abort(), timeoutMs)
  try {
    const { error } = await admin.from('club_organisaties').select('id').limit(1).abortSignal(rem.signal)
    if (error && !rem.signal.aborted) console.error('[status] databasecontrole mislukt', error.message)
    return { stand: dbStandUit({ fout: Boolean(error), verlopen: rem.signal.aborted }), ms: Date.now() - start }
  } catch {
    return { stand: dbStandUit({ fout: true, verlopen: rem.signal.aborted }), ms: Date.now() - start }
  } finally {
    clearTimeout(klok)
  }
}
