// ─── Fit Factory Club, training: schema's schrijven (SERVER) ────────────────
// Regels vervangen gaat veilig: eerst de nieuwe regels erin, pas daarna de oude
// eruit. Mislukt het invoegen, dan blijft het oude schema heel.

import type { SupabaseClient } from '@supabase/supabase-js'
import { metVolgorde, type RegelInvoer } from './invoer'
import { isRij } from './rijen'
import type { Doel, Niveau, SchemaStatus } from './typen'

export interface NieuwSchema {
  lidId: string | null
  naam: string
  doel: Doel | null
  niveau: Niveau
  weken: number | null
  status: SchemaStatus
  medewerkerId: string | null
  notitie: string | null
  dagTitels: string[]
}

export type Schrijfuitslag = { ok: true; id: string } | { ok: false; fout: string }

/** Bestaan alle oefeningen (van deze gebruiker)? */
export async function oefeningenBestaan(admin: SupabaseClient, userId: string, ids: readonly string[]): Promise<boolean> {
  const uniek = [...new Set(ids)]
  if (uniek.length === 0) return true
  const { data, error } = await admin.from('club_oefeningen').select('id').eq('user_id', userId).in('id', uniek)
  if (error) {
    console.error('[club/training] oefeningen controleren mislukt', error.message)
    return false
  }
  return (data ?? []).length === uniek.length
}

/** Hoort dit lid bij deze gebruiker? Geeft de vestiging terug (voor het logboek). */
export async function lidVestiging(admin: SupabaseClient, userId: string, lidId: string): Promise<string | null> {
  const { data, error } = await admin.from('club_leden').select('vestiging').eq('user_id', userId).eq('id', lidId).maybeSingle()
  if (error || !isRij(data) || typeof data.vestiging !== 'string') return null
  return data.vestiging
}

function regelRijen(userId: string, schemaId: string, regels: readonly RegelInvoer[]) {
  return metVolgorde(regels).map((r) => ({
    user_id: userId,
    schema_id: schemaId,
    dag: r.dag,
    volgorde: r.volgorde,
    oefening_id: r.oefeningId,
    sets: r.sets,
    herhalingen: r.herhalingen,
    gewicht_kg: r.gewichtKg,
    rust_sec: r.rustSec,
    notitie: r.notitie,
  }))
}

/** Vervang alle regels van een schema. */
export async function vervangRegels(admin: SupabaseClient, userId: string, schemaId: string, regels: readonly RegelInvoer[]): Promise<boolean> {
  const oud = await admin.from('club_schema_oefeningen').select('id').eq('user_id', userId).eq('schema_id', schemaId)
  if (oud.error) {
    console.error('[club/training] oude regels lezen mislukt', oud.error.message)
    return false
  }
  if (regels.length > 0) {
    const nieuw = await admin.from('club_schema_oefeningen').insert(regelRijen(userId, schemaId, regels))
    if (nieuw.error) {
      console.error('[club/training] regels opslaan mislukt', nieuw.error.message)
      return false
    }
  }
  const oudeIds = (oud.data ?? []).map((r) => (isRij(r) && typeof r.id === 'string' ? r.id : null)).filter((id): id is string => id !== null)
  if (oudeIds.length === 0) return true
  const weg = await admin.from('club_schema_oefeningen').delete().eq('user_id', userId).in('id', oudeIds)
  if (weg.error) console.error('[club/training] oude regels opruimen mislukt', weg.error.message)
  return !weg.error
}

/** Een nieuw schema met regels. */
export async function maakSchema(admin: SupabaseClient, userId: string, s: NieuwSchema, regels: readonly RegelInvoer[]): Promise<Schrijfuitslag> {
  const { data, error } = await admin
    .from('club_schemas')
    .insert({
      user_id: userId,
      lid_id: s.lidId,
      naam: s.naam,
      doel: s.doel,
      niveau: s.niveau,
      weken: s.weken,
      status: s.status,
      medewerker_id: s.medewerkerId,
      notitie: s.notitie,
      dag_titels: s.dagTitels,
    })
    .select('id')
    .single()
  if (error || !isRij(data) || typeof data.id !== 'string') {
    if (error) console.error('[club/training] schema aanmaken mislukt', error.message)
    return { ok: false, fout: 'Het schema kon niet worden aangemaakt.' }
  }
  const id = data.id
  if (!(await vervangRegels(admin, userId, id, regels))) {
    await admin.from('club_schemas').delete().eq('user_id', userId).eq('id', id)
    return { ok: false, fout: 'De oefeningen konden niet worden opgeslagen.' }
  }
  return { ok: true, id }
}
