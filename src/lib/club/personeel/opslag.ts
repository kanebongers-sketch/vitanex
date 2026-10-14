// ─── Fit Factory Club, personeel: lezen uit de database (SERVER) ────────────
// Elke query filtert op user_id. Een leesfout geeft null; de pagina toont dan
// een nette melding in plaats van een half rooster.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Vestiging } from '@/lib/club/kern/vestiging'
import { openingstijdenUitJson, type Openingstijden } from '@/lib/club/rooster/openingstijden'
import {
  BESCHIKBAAR_KOLOMMEN,
  DIENST_KOLOMMEN,
  MEDEWERKER_KOLOMMEN,
  NOTITIE_KOLOMMEN,
  SOORT_KOLOMMEN,
  beschikbaarheidUitRij,
  dienstUitRij,
  lidUitRij,
  notitieUitRij,
  rijen,
  sjabloonUitRij,
  soortUitRij,
  type Beschikbaarheid,
  type Dienst,
  type DienstSoort,
  type PersoneelLid,
  type RoosterNotitie,
  type Sjabloon,
} from './typen'

const MAX_RIJEN = 5000

function meld(wat: string, fout: { message: string }): null {
  console.error(`[club-personeel] ${wat} lezen mislukt`, fout.message)
  return null
}

/** Het actieve personeel van een vestiging, op naam. */
export async function haalTeam(admin: SupabaseClient, userId: string, vestiging: Vestiging): Promise<PersoneelLid[] | null> {
  const { data, error } = await admin
    .from('club_medewerkers')
    .select(MEDEWERKER_KOLOMMEN)
    .eq('user_id', userId)
    .eq('actief', true)
    .contains('vestigingen', [vestiging])
    .order('naam')
  if (error) return meld('team', error)
  return (Array.isArray(data) ? data : []).map((r, i) => lidUitRij(r, i)).filter((l): l is PersoneelLid => l !== null)
}

function heeftDagen(v: unknown): boolean {
  return typeof v === 'object' && v !== null && !Array.isArray(v) && Object.keys(v).length > 0
}

/**
 * De bemande uren (wanneer er personeel moet staan). Uit club_vestigingen.bemand;
 * is die kolom leeg of (nog) niet aanwezig, dan de openingstijden.
 */
export async function haalBemand(admin: SupabaseClient, userId: string, vestiging: Vestiging): Promise<Openingstijden> {
  // select('*'): werkt ook zolang de kolom bemand (migratie 390) er nog niet is.
  const { data, error } = await admin.from('club_vestigingen').select('*').eq('user_id', userId).eq('vestiging', vestiging).maybeSingle()
  if (error || !data) {
    if (error) meld('bemande uren', error)
    return openingstijdenUitJson({})
  }
  const rij: Record<string, unknown> = data
  return openingstijdenUitJson(heeftDagen(rij.bemand) ? rij.bemand : rij.openingstijden)
}

export async function haalSoorten(admin: SupabaseClient, userId: string, vestiging: Vestiging): Promise<DienstSoort[] | null> {
  const { data, error } = await admin
    .from('club_dienst_soorten')
    .select(SOORT_KOLOMMEN)
    .eq('user_id', userId)
    .eq('vestiging', vestiging)
    .eq('actief', true)
    .order('volgorde')
    .order('begin')
  return error ? meld('dienstsoorten', error) : rijen(data, soortUitRij)
}

/** Diensten van een vestiging van `van` tot (niet met) `tot`, op datum en begintijd. */
export async function haalDiensten(admin: SupabaseClient, userId: string, vestiging: Vestiging, van: string, tot: string): Promise<Dienst[] | null> {
  const { data, error } = await admin
    .from('club_diensten')
    .select(DIENST_KOLOMMEN)
    .eq('user_id', userId)
    .eq('vestiging', vestiging)
    .gte('datum', van)
    .lt('datum', tot)
    .order('datum')
    .order('begin')
    .limit(MAX_RIJEN)
  return error ? meld('diensten', error) : rijen(data, dienstUitRij)
}

/** Diensten van een medewerker over alle vestigingen (voor "Mijn diensten"). */
export async function haalDienstenVan(admin: SupabaseClient, userId: string, medewerkerId: string, van: string, tot: string): Promise<Array<Dienst & { vestiging: string }> | null> {
  const { data, error } = await admin
    .from('club_diensten')
    .select(`${DIENST_KOLOMMEN}, vestiging`)
    .eq('user_id', userId)
    .eq('medewerker_id', medewerkerId)
    .gte('datum', van)
    .lt('datum', tot)
    .order('datum')
    .order('begin')
    .limit(MAX_RIJEN)
  if (error) return meld('eigen diensten', error)
  return (Array.isArray(data) ? data : []).flatMap((r: Record<string, unknown>) => {
    const d = dienstUitRij(r)
    return d && typeof r.vestiging === 'string' ? [{ ...d, vestiging: r.vestiging }] : []
  })
}

export async function haalDienst(admin: SupabaseClient, userId: string, id: string): Promise<(Dienst & { vestiging: string }) | null> {
  const { data, error } = await admin.from('club_diensten').select(`${DIENST_KOLOMMEN}, vestiging`).eq('user_id', userId).eq('id', id).maybeSingle()
  if (error) return meld('dienst', error)
  const d = dienstUitRij(data)
  const vestiging: unknown = data?.vestiging
  return d && typeof vestiging === 'string' ? { ...d, vestiging } : null
}

export async function haalBeschikbaarheid(admin: SupabaseClient, userId: string, medewerkerIds: readonly string[]): Promise<Beschikbaarheid[] | null> {
  if (medewerkerIds.length === 0) return []
  const { data, error } = await admin
    .from('club_beschikbaarheid')
    .select(BESCHIKBAAR_KOLOMMEN)
    .eq('user_id', userId)
    .in('medewerker_id', [...medewerkerIds])
    .order('weekdag', { nullsFirst: false })
    .order('datum')
    .limit(MAX_RIJEN)
  return error ? meld('beschikbaarheid', error) : rijen(data, beschikbaarheidUitRij)
}

export async function haalNotities(admin: SupabaseClient, userId: string, vestiging: Vestiging, van: string, tot: string): Promise<RoosterNotitie[] | null> {
  const { data, error } = await admin
    .from('club_rooster_notities')
    .select(NOTITIE_KOLOMMEN)
    .eq('user_id', userId)
    .eq('vestiging', vestiging)
    .gte('datum', van)
    .lt('datum', tot)
    .order('datum')
    .order('van', { nullsFirst: true })
  return error ? meld('mededelingen', error) : rijen(data, notitieUitRij)
}

export async function haalSjablonen(admin: SupabaseClient, userId: string, vestiging: Vestiging): Promise<Sjabloon[] | null> {
  const { data, error } = await admin
    .from('club_dienst_sjablonen')
    .select('id, naam, diensten')
    .eq('user_id', userId)
    .eq('vestiging', vestiging)
    .order('aangemaakt_op', { ascending: false })
  return error ? meld('patronen', error) : rijen(data, sjabloonUitRij)
}
