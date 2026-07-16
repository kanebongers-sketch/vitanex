// ─── LifeOS — opslag van herstelmetingen ───────────────────────────────────
// Leest en schrijft `herstel_metingen` via de service-role. Alleen server-side.
//
// De service-role client komt als PARAMETER binnen, niet uit een import. LifeOS
// leeft in een EIGEN Supabase-project (zie `@/lib/lifeos/admin`): de route haalt
// die client achter de founder-gate op met `vereisLifeosToegang` en reikt 'm
// hier aan. Zo praat deze module gegarandeerd met de LifeOS-database en nooit
// met de B2B-database van MentaForce.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { HerstelBron, HerstelMeting } from './herstel'
import { getal, isObject, lijst, tekst } from './narrow'
import { isoDatum, type IsoDatum } from './tijd'

export interface TeBewaren {
  meting: HerstelMeting
  /** De onbewerkte leverancier-respons, voor de audittrail. */
  ruw: Record<string, unknown>
}

/**
 * Upsert op (user_id, bron, datum) — dit is wat de sync idempotent maakt:
 * twee keer draaien geeft exact hetzelfde resultaat, geen dubbele rijen.
 */
export async function bewaarMetingen(
  admin: SupabaseClient,
  userId: string,
  rijen: readonly TeBewaren[],
): Promise<number> {
  if (rijen.length === 0) return 0

  const { error } = await admin.from('herstel_metingen').upsert(
    rijen.map(({ meting, ruw }) => ({
      user_id: userId,
      datum: meting.datum,
      bron: meting.bron,
      hrv_ms: meting.hrvMs,
      rust_hartslag: meting.rustHartslag,
      slaap_minuten: meting.slaapMinuten,
      slaap_efficientie: meting.slaapEfficientie,
      leverancier_score: meting.leverancierScore,
      ruw,
    })),
    { onConflict: 'user_id,bron,datum' },
  )

  if (error) throw new Error(`opslaan mislukt: ${error.message}`)
  return rijen.length
}

/** Alle metingen van alle bronnen in [vanaf, tot], oplopend op datum. */
export async function leesMetingen(
  admin: SupabaseClient,
  userId: string,
  vanaf: IsoDatum,
  tot: IsoDatum,
): Promise<HerstelMeting[]> {
  const { data, error } = await admin
    .from('herstel_metingen')
    .select('datum, bron, hrv_ms, rust_hartslag, slaap_minuten, slaap_efficientie, leverancier_score')
    .eq('user_id', userId)
    .gte('datum', vanaf)
    .lte('datum', tot)
    .order('datum', { ascending: true })

  if (error) throw new Error(`lezen mislukt: ${error.message}`)

  const rijen: unknown = data
  return lijst(rijen)
    .map((rij) => leesMetingRij(rij))
    .filter((m): m is HerstelMeting => m !== null)
}

const BRONNEN: readonly string[] = ['whoop', 'oura', 'garmin', 'samsung', 'handmatig']

function isBron(v: unknown): v is HerstelBron {
  return typeof v === 'string' && BRONNEN.includes(v)
}

/**
 * Narrow één DB-rij naar een `HerstelMeting`.
 *
 * `numeric` komt bij PostgREST soms als string binnen (om precisie te bewaren);
 * `getal()` zou daar null van maken en zo een echte meting stilletjes wissen.
 * Daarom eerst door `nummer()`, die een numerieke string wél accepteert — maar
 * nog steeds nooit een lege of onzin-waarde tot 0 promoveert.
 */
function leesMetingRij(rij: unknown): HerstelMeting | null {
  if (!isObject(rij)) return null

  const datum = isoDatum(rij.datum)
  const bron = rij.bron
  if (datum === null || !isBron(bron)) return null

  return {
    bron,
    datum,
    hrvMs: nummer(rij.hrv_ms),
    rustHartslag: nummer(rij.rust_hartslag),
    slaapMinuten: nummer(rij.slaap_minuten),
    slaapEfficientie: nummer(rij.slaap_efficientie),
    leverancierScore: nummer(rij.leverancier_score),
  }
}

/** Een getal, ook als Postgres het als numerieke string aanlevert. Anders null. */
export function nummer(v: unknown): number | null {
  const direct = getal(v)
  if (direct !== null) return direct

  const s = tekst(v)
  if (s === null) return null

  const n = Number(s)
  return Number.isFinite(n) ? n : null
}
