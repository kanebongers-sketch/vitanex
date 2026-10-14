// ─── Fit Factory Club, training: lezen uit de database (SERVER) ─────────────
// Elke query filtert op user_id. Een fout wordt gelogd en geeft null, zodat de
// pagina een nette melding toont in plaats van te crashen.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Vestiging } from '@/lib/club/kern/vestiging'
import { INTAKE_KOLOMMEN, intakeUitRij, type Intake } from './intake-rij'
import {
  OEFENING_KOLOMMEN, REGEL_KOLOMMEN, SCHEMA_KOLOMMEN, logUitRij, oefeningUitRij, regelUitRij, schemaUitRij,
  type LogRegel, type Oefening, type SchemaKop, type SchemaRegel,
} from './rijen'
import { isUuid } from './typen'

function meld(wat: string, fout: { message: string }): null {
  console.error(`[club/training] ${wat} mislukt`, fout.message)
  return null
}

function alle<T>(rijen: unknown[] | null, map: (r: unknown) => T | null): T[] {
  return (rijen ?? []).map(map).filter((x): x is T => x !== null)
}

export async function haalOefeningen(admin: SupabaseClient, userId: string): Promise<Oefening[] | null> {
  const { data, error } = await admin.from('club_oefeningen').select(OEFENING_KOLOMMEN).eq('user_id', userId).order('naam').limit(1000)
  if (error) return meld('oefeningen lezen', error)
  return alle(data, oefeningUitRij)
}

interface Filter {
  vestiging: Vestiging
  lidId: string | null
}

const INTAKE_INNER = INTAKE_KOLOMMEN.replace('club_leden(', 'club_leden!inner(vestiging, ')
const SCHEMA_INNER = SCHEMA_KOLOMMEN.replace('club_leden(', 'club_leden!inner(vestiging, ')

/** Intakes van een lid, of de laatste intakes van de vestiging. Nieuwste eerst. */
export async function haalIntakes(admin: SupabaseClient, userId: string, f: Filter, limiet = 60): Promise<Intake[] | null> {
  let q = admin.from('club_intakes').select(INTAKE_INNER).eq('user_id', userId)
  q = f.lidId ? q.eq('lid_id', f.lidId) : q.eq('club_leden.vestiging', f.vestiging)
  const { data, error } = await q.order('datum', { ascending: false }).order('aangemaakt_op', { ascending: false }).limit(limiet)
  if (error) return meld('intakes lezen', error)
  return alle(data, intakeUitRij)
}

export async function haalIntake(admin: SupabaseClient, userId: string, id: string): Promise<Intake | null> {
  if (!isUuid(id)) return null
  const { data, error } = await admin.from('club_intakes').select(INTAKE_KOLOMMEN).eq('user_id', userId).eq('id', id).maybeSingle()
  if (error) return meld('intake lezen', error)
  return intakeUitRij(data)
}

/** Schema's van leden (per vestiging of per lid), of de sjablonen (lid_id null). */
export async function haalSchemas(admin: SupabaseClient, userId: string, f: Filter & { sjablonen: boolean }): Promise<SchemaKop[] | null> {
  const basis = f.sjablonen || f.lidId ? SCHEMA_KOLOMMEN : SCHEMA_INNER
  let q = admin.from('club_schemas').select(basis).eq('user_id', userId)
  if (f.sjablonen) q = q.is('lid_id', null)
  else if (f.lidId) q = q.eq('lid_id', f.lidId)
  else q = q.eq('club_leden.vestiging', f.vestiging)
  const { data, error } = await q.order('bijgewerkt_op', { ascending: false }).limit(200)
  if (error) return meld("schema's lezen", error)
  return alle(data, schemaUitRij)
}

export interface SchemaVolledig {
  kop: SchemaKop
  regels: SchemaRegel[]
}

export async function haalSchema(admin: SupabaseClient, userId: string, id: string): Promise<SchemaVolledig | null> {
  if (!isUuid(id)) return null
  const [kopRes, regelRes] = await Promise.all([
    admin.from('club_schemas').select(SCHEMA_KOLOMMEN).eq('user_id', userId).eq('id', id).maybeSingle(),
    admin.from('club_schema_oefeningen').select(REGEL_KOLOMMEN).eq('user_id', userId).eq('schema_id', id).order('dag').order('volgorde'),
  ])
  if (kopRes.error) return meld('schema lezen', kopRes.error)
  if (regelRes.error) return meld('schema-oefeningen lezen', regelRes.error)
  const kop = schemaUitRij(kopRes.data)
  return kop ? { kop, regels: alle(regelRes.data, regelUitRij) } : null
}

/** Wat leden in de app afvinkten bij deze schema's (alleen lezen). Nieuwste eerst. */
export async function haalTrainingslog(admin: SupabaseClient, userId: string, schemaIds: string[]): Promise<LogRegel[] | null> {
  const ids = schemaIds.filter(isUuid)
  if (ids.length === 0) return []
  const { data, error } = await admin
    .from('club_trainingslog')
    .select('id, schema_id, dag, op, uitgevoerd')
    .eq('user_id', userId)
    .in('schema_id', ids)
    .order('op', { ascending: false })
    .limit(500)
  if (error) return meld('trainingslog lezen', error)
  return alle(data, logUitRij)
}
