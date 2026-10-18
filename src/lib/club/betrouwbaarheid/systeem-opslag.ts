// ─── Systeemoverzicht: gegevens ophalen (SERVER-ONLY) ───────────────────────
// Alleen voor Kane (/clubkane/systeem, layout met eisKane). club_fouten is
// bewust niet per sportschool: het is het overzicht van het hele platform.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { FoutGebied, FoutSoort } from './fout'
import { dagTerug, type FoutRij } from './overzicht'
import { meetDatabase, type DbMeting } from './database'

export interface LaatsteFout {
  id: number
  gebied: FoutGebied
  route: string
  methode: string | null
  soort: FoutSoort | null
  sportschool: string | null
  melding: string
  aantal: number
  laatstOp: string
}

export interface SysteemStand {
  db: DbMeting
  databaseBytes: number | null
  postgresVersie: string | null
  rijen: FoutRij[]
  laatste: LaatsteFout[]
  /** true als club_fouten niet te lezen was (bijv. migratie 428 ontbreekt). */
  leesFout: boolean
}

export const DAGEN = 14

function vandaagNl(): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Amsterdam' }).format(new Date())
}

async function statusRpc(admin: SupabaseClient): Promise<{ bytes: number | null; versie: string | null }> {
  const { data, error } = await admin.rpc('club_systeem_status')
  if (error) {
    console.error('[systeem] status lezen mislukt', error.message)
    return { bytes: null, versie: null }
  }
  const rij = Array.isArray(data) ? data[0] : data
  const bytes = Number(rij?.database_bytes)
  return { bytes: Number.isFinite(bytes) ? bytes : null, versie: typeof rij?.postgres_versie === 'string' ? rij.postgres_versie : null }
}

function laatsteUitRij(r: Record<string, unknown>): LaatsteFout {
  return {
    id: Number(r.id),
    gebied: r.gebied as FoutGebied,
    route: String(r.route ?? ''),
    methode: typeof r.methode === 'string' ? r.methode : null,
    soort: typeof r.soort === 'string' ? (r.soort as FoutSoort) : null,
    sportschool: typeof r.sportschool === 'string' ? r.sportschool : null,
    melding: String(r.melding ?? ''),
    aantal: Number(r.aantal ?? 1),
    laatstOp: String(r.laatst_op ?? ''),
  }
}

export async function haalSysteemStand(admin: SupabaseClient): Promise<{ stand: SysteemStand; vandaag: string }> {
  const vandaag = vandaagNl()
  const vanaf = dagTerug(vandaag, DAGEN - 1)
  const [db, status, perDag, laatste] = await Promise.all([
    meetDatabase(admin),
    statusRpc(admin),
    admin.from('club_fouten').select('dag, gebied, aantal').gte('dag', vanaf).limit(5000),
    admin.from('club_fouten').select('id, gebied, route, methode, soort, sportschool, melding, aantal, laatst_op').order('laatst_op', { ascending: false }).limit(30),
  ])
  if (perDag.error) console.error('[systeem] fouten per dag lezen mislukt', perDag.error.message)
  if (laatste.error) console.error('[systeem] laatste fouten lezen mislukt', laatste.error.message)
  const rijen: FoutRij[] = (perDag.data ?? []).map((r) => ({ dag: String(r.dag), gebied: r.gebied as FoutGebied, aantal: Number(r.aantal) }))
  return {
    vandaag,
    stand: {
      db,
      databaseBytes: status.bytes,
      postgresVersie: status.versie,
      rijen,
      laatste: (laatste.data ?? []).map((r) => laatsteUitRij(r as Record<string, unknown>)),
      leesFout: Boolean(perDag.error || laatste.error),
    },
  }
}
