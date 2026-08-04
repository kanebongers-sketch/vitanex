// ─── LifeOS — 4-weken blok: de startdatum ───────────────────────────────────
// SERVER-ONLY. Leest/schrijft `blok_start` (migratie 160): de datum waarop Kane's
// huidige blok begon. Zonder die datum weet `blokWeekVoorDatum` niet of vandaag
// week 1 of week 3 is. Admin-client als parameter, net als alle opslag-modules.

import type { SupabaseClient } from '@supabase/supabase-js'

export type Uitkomst<T> = { ok: true; waarde: T } | { ok: false; reden: string }

/** De startdatum (YYYY-MM-DD) van het blok, of null als het nog niet gestart is. */
export async function haalBlokStart(
  admin: SupabaseClient,
  userId: string,
): Promise<Uitkomst<string | null>> {
  const { data, error } = await admin
    .from('blok_start')
    .select('start_datum')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) return { ok: false, reden: 'db' }
  if (data === null || data === undefined) return { ok: true, waarde: null }

  const ruw = (data as { start_datum?: unknown }).start_datum
  return { ok: true, waarde: typeof ruw === 'string' ? ruw.slice(0, 10) : null }
}

/** Zet (of vervangt) de startdatum. Opnieuw beginnen = deze functie opnieuw. */
export async function zetBlokStart(
  admin: SupabaseClient,
  userId: string,
  datum: string,
): Promise<Uitkomst<string>> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datum)) return { ok: false, reden: 'ongeldig' }

  const { error } = await admin
    .from('blok_start')
    .upsert(
      { user_id: userId, start_datum: datum, bijgewerkt_op: new Date().toISOString() },
      { onConflict: 'user_id' },
    )

  if (error) return { ok: false, reden: 'db' }
  return { ok: true, waarde: datum }
}

/**
 * De startdatum, en start het blok automatisch op `vandaag` als het er nog niet is.
 *
 * Zo "werkt het gewoon" als Kane de app voor het eerst opent: het blok begint die
 * dag, week 1 loopt zeven dagen. Idempotent (upsert), dus een tweede aanroep op
 * dezelfde dag verandert niets.
 */
export async function haalOfStartBlok(
  admin: SupabaseClient,
  userId: string,
  vandaag: string,
): Promise<Uitkomst<string>> {
  const bestaand = await haalBlokStart(admin, userId)
  if (!bestaand.ok) return bestaand
  if (bestaand.waarde !== null) return { ok: true, waarde: bestaand.waarde }
  return zetBlokStart(admin, userId, vandaag)
}
