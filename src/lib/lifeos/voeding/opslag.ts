// ─── LifeOS — voeding & water in de database ────────────────────────────────
// SERVER-ONLY. Alle databasetoegang voor functie 5 staat hier; de routes doen
// auth, validatie en het antwoord.
//
// De service-role client komt als PARAMETER binnen, niet uit een import. LifeOS
// leeft in een EIGEN Supabase-project (zie `@/lib/lifeos/admin`): de route haalt
// die client achter de founder-gate op met `vereisLifeosToegang` en reikt 'm
// hier aan. Zo praat deze module gegarandeerd met de LifeOS-database en nooit
// met de B2B-database van MentaForce.
//
// Bewust géén dagtotalen in SQL. Die berekening staat in `totalen.ts`, puur en
// getest, en is de plek waar het onderscheid tussen "niet ingevuld" en "nul"
// bewaakt wordt. `sum(eiwit_g)` in Postgres negeert nulls stilzwijgend en geeft
// je een getal zonder te zeggen hoeveel rijen het miste — precies de informatie
// waar deze functie op draait.

import type { SupabaseClient } from '@supabase/supabase-js'
import {
  doelenVanRij,
  voedingLogVanRij,
  voedingLogsVanRijen,
  waterLogVanRij,
  waterLogsVanRijen,
  type NieuweVoedingLog,
  type NieuweWaterLog,
  type VoedingDoelen,
  type VoedingLog,
  type WaterLog,
} from './voeding'

const WATER_KOLOMMEN = 'id, datum, ml, aangemaakt_op'
const VOEDING_KOLOMMEN =
  'id, datum, omschrijving, kcal, eiwit_g, koolhydraten_g, vet_g, moment, aangemaakt_op'
const DOELEN_KOLOMMEN = 'kcal_doel, eiwit_doel_g, water_doel_ml'

/** Postgres: check-constraint geschonden. */
const CHECK_GESCHONDEN = '23514'

export type Reden = 'db' | 'ongeldig' | 'niet_gevonden'
export type Uitkomst<T> = { ok: true; waarde: T } | { ok: false; reden: Reden }

function foutCode(error: unknown): string | null {
  if (typeof error !== 'object' || error === null || !('code' in error)) return null
  const code = (error as { code: unknown }).code
  return typeof code === 'string' ? code : null
}

function vertaalFout(error: unknown): Reden {
  return foutCode(error) === CHECK_GESCHONDEN ? 'ongeldig' : 'db'
}

// ─── Water ──────────────────────────────────────────────────────────────────

export async function haalWaterLogs(
  admin: SupabaseClient,
  userId: string,
  datum: string,
): Promise<Uitkomst<WaterLog[]>> {
  const { data, error } = await admin
    .from('water_logs')
    .select(WATER_KOLOMMEN)
    .eq('user_id', userId)
    .eq('datum', datum)
    .order('aangemaakt_op', { ascending: true })

  if (error) return { ok: false, reden: vertaalFout(error) }
  return { ok: true, waarde: waterLogsVanRijen(Array.isArray(data) ? data : []) }
}

export async function maakWaterLog(
  admin: SupabaseClient,
  userId: string,
  nieuw: NieuweWaterLog,
): Promise<Uitkomst<WaterLog>> {
  const { data, error } = await admin
    .from('water_logs')
    .insert({ user_id: userId, datum: nieuw.datum, ml: nieuw.ml })
    .select(WATER_KOLOMMEN)
    .single()

  if (error) return { ok: false, reden: vertaalFout(error) }

  const log = waterLogVanRij(data)
  return log ? { ok: true, waarde: log } : { ok: false, reden: 'db' }
}

export async function verwijderWaterLog(
  admin: SupabaseClient,
  userId: string,
  id: string,
): Promise<Uitkomst<null>> {
  const { data, error } = await admin
    .from('water_logs')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
    .select('id')
    .maybeSingle()

  if (error) return { ok: false, reden: vertaalFout(error) }
  if (!data) return { ok: false, reden: 'niet_gevonden' }
  return { ok: true, waarde: null }
}

// ─── Voeding ────────────────────────────────────────────────────────────────

export async function haalVoedingLogs(
  admin: SupabaseClient,
  userId: string,
  datum: string,
): Promise<Uitkomst<VoedingLog[]>> {
  const { data, error } = await admin
    .from('voeding_logs')
    .select(VOEDING_KOLOMMEN)
    .eq('user_id', userId)
    .eq('datum', datum)
    .order('aangemaakt_op', { ascending: true })

  if (error) return { ok: false, reden: vertaalFout(error) }
  return { ok: true, waarde: voedingLogsVanRijen(Array.isArray(data) ? data : []) }
}

export async function maakVoedingLog(
  admin: SupabaseClient,
  userId: string,
  nieuw: NieuweVoedingLog,
): Promise<Uitkomst<VoedingLog>> {
  // Expliciet null schrijven waar de gebruiker niets invulde. Niet weglaten en
  // niet 0: de kolom is nullable omdat null hier betekenis heeft (zie 060).
  const { data, error } = await admin
    .from('voeding_logs')
    .insert({
      user_id: userId,
      datum: nieuw.datum,
      omschrijving: nieuw.omschrijving,
      kcal: nieuw.kcal,
      eiwit_g: nieuw.eiwitG,
      koolhydraten_g: nieuw.koolhydratenG,
      vet_g: nieuw.vetG,
      moment: nieuw.moment,
    })
    .select(VOEDING_KOLOMMEN)
    .single()

  if (error) return { ok: false, reden: vertaalFout(error) }

  const log = voedingLogVanRij(data)
  return log ? { ok: true, waarde: log } : { ok: false, reden: 'db' }
}

export async function verwijderVoedingLog(
  admin: SupabaseClient,
  userId: string,
  id: string,
): Promise<Uitkomst<null>> {
  const { data, error } = await admin
    .from('voeding_logs')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
    .select('id')
    .maybeSingle()

  if (error) return { ok: false, reden: vertaalFout(error) }
  if (!data) return { ok: false, reden: 'niet_gevonden' }
  return { ok: true, waarde: null }
}

// ─── Doelen ─────────────────────────────────────────────────────────────────

/**
 * Je doelen, of `GEEN_DOELEN` als je er nooit een stelde.
 *
 * `maybeSingle`, geen `single`: geen rij is hier het normale geval en geen
 * fout. `single` zou daar een PGRST116 van maken en de kaart in zijn foutstaat
 * duwen — dan zou "ik heb geen doel gesteld" op het scherm verschijnen als
 * "we konden je voeding niet ophalen". Dat is precies de fout-≠-leeg-regel.
 */
export async function haalDoelen(
  admin: SupabaseClient,
  userId: string,
): Promise<Uitkomst<VoedingDoelen>> {
  const { data, error } = await admin
    .from('voeding_doelen')
    .select(DOELEN_KOLOMMEN)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) return { ok: false, reden: vertaalFout(error) }
  return { ok: true, waarde: doelenVanRij(data) }
}
