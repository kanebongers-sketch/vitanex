// ─── Club, training: alternatieven voor de ledenapp (SERVER-ONLY) ───────────
// Gedeeld door /api/club/lid/training/alternatieven (het lid zelf) en
// /api/club/app/training/alternatieven (voorvertoning in Club). Het lid is
// altijd al bepaald door de aanroeper; hier wordt gecontroleerd dat de
// schemaregel bij een schema van dat lid hoort. De keuze zelf is puur
// (alternatieven.ts), met de regels voor het lid: nooit zwaarder dan het origineel.

import type { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { clubFout, clubJson } from '@/lib/club/toegang'
import { alternatievenVoor, materiaalVolgorde, naarAppAlternatief, toegestaanMetAlternatieven } from './alternatieven'
import { haalOefeningen } from './data'
import { isRij, type Oefening } from './rijen'
import { isUuid } from './typen'

interface Bron {
  admin: SupabaseClient
  userId: string
}

interface SchemaRegelKort {
  id: string
  dag: number
  oefeningId: string
}

function regelKort(r: unknown): SchemaRegelKort | null {
  if (!isRij(r) || typeof r.id !== 'string' || typeof r.dag !== 'number' || typeof r.oefening_id !== 'string') return null
  return { id: r.id, dag: r.dag, oefeningId: r.oefening_id }
}

/** Alle regels van het schema waar deze regel in staat, als het schema van dit lid is; anders null. */
async function regelsVanLid(s: Bron, lidId: string, regelId: string): Promise<{ regel: SchemaRegelKort; alle: SchemaRegelKort[] } | null> {
  const r = await s.admin.from('club_schema_oefeningen').select('id, dag, oefening_id, schema_id').eq('user_id', s.userId).eq('id', regelId).maybeSingle()
  if (r.error) console.error('[club/training] schemaregel lezen mislukt', r.error.message)
  const schemaId = isRij(r.data) && typeof r.data.schema_id === 'string' ? r.data.schema_id : null
  const regel = regelKort(r.data)
  if (!schemaId || !regel) return null
  const schema = await s.admin.from('club_schemas').select('id').eq('user_id', s.userId).eq('id', schemaId).eq('lid_id', lidId).maybeSingle()
  if (schema.error) console.error('[club/training] schema lezen mislukt', schema.error.message)
  if (!schema.data) return null
  const alle = await s.admin.from('club_schema_oefeningen').select('id, dag, oefening_id').eq('user_id', s.userId).eq('schema_id', schemaId)
  if (alle.error) {
    console.error('[club/training] schemaregels lezen mislukt', alle.error.message)
    return null
  }
  return { regel, alle: (alle.data ?? []).map(regelKort).filter((x): x is SchemaRegelKort => x !== null) }
}

/** GET ?regel=<id>: de alternatieven voor een oefening in het schema van het lid, best passend eerst. */
export async function alternatievenAntwoord(s: Bron, lidId: string, regelId: string | null): Promise<NextResponse> {
  if (!isUuid(regelId) || !isUuid(lidId)) return clubFout('Onbekende oefening.', 404)
  const [schema, oefeningen] = await Promise.all([regelsVanLid(s, lidId, regelId), haalOefeningen(s.admin, s.userId)])
  if (!schema) return clubFout('Onbekende oefening.', 404)
  if (!oefeningen) return clubFout('De oefeningen konden niet worden gelezen.', 500)
  const perId = new Map(oefeningen.map((o) => [o.id, o]))
  const origineel = perId.get(schema.regel.oefeningId)
  if (!origineel) return clubFout('Onbekende oefening.', 404)
  const inSchema = schema.alle.map((r) => perId.get(r.oefeningId)).filter((o): o is Oefening => o !== undefined)
  const opDag = new Set(schema.alle.filter((r) => r.dag === schema.regel.dag).map((r) => r.oefeningId))
  const lijst = alternatievenVoor(origineel, oefeningen, { voorLid: true, uitsluiten: opDag, volgorde: materiaalVolgorde(inSchema, oefeningen), max: 8 })
  return clubJson({ alternatieven: lijst.map((o) => naarAppAlternatief(origineel, o)) })
}

/**
 * Wat een lid op deze schemadag mag loggen: de oefeningen van de dag plus hun
 * alternatieven (toestel bezet). Null bij een leesfout.
 */
export async function toegestaanOpDag(s: Bron, dagIds: ReadonlySet<string>): Promise<Set<string> | null> {
  const oefeningen = await haalOefeningen(s.admin, s.userId)
  return oefeningen ? toegestaanMetAlternatieven(dagIds, oefeningen) : null
}

/** De namen van oefeningen (voor het logboek). */
export async function oefeningNamen(s: Bron, ids: readonly string[]): Promise<string[]> {
  if (ids.length === 0) return []
  const { data, error } = await s.admin.from('club_oefeningen').select('naam').eq('user_id', s.userId).in('id', [...new Set(ids)])
  if (error) console.error('[club/training] oefeningnamen lezen mislukt', error.message)
  return (data ?? []).map((r) => (isRij(r) && typeof r.naam === 'string' ? r.naam : '')).filter(Boolean)
}
