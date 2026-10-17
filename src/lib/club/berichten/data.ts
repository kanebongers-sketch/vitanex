// ─── Club: berichten lezen (SERVER-ONLY) ─────────────────────────────────────
// Alle queries filteren op user_id (de sportschool). Fouten worden gelogd en
// als null teruggegeven; de pagina toont dan een nette melding.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Lid } from '@/lib/club/kern/lid'
import { BERICHT_KOLOMMEN, berichtUitRij, type Bericht } from './model'
import { berichtenVoorLid } from './regels'

function log(wat: string, bericht: string): void {
  console.error(`[club/berichten] ${wat} mislukt`, bericht)
}

/** Alle berichten van deze sportschool (voor het beheer), nieuwste eerst. */
export async function haalBerichten(admin: SupabaseClient, userId: string): Promise<Bericht[] | null> {
  const { data, error } = await admin
    .from('club_berichten')
    .select(BERICHT_KOLOMMEN)
    .eq('user_id', userId)
    .order('zichtbaar_van', { ascending: false })
    .limit(500)
  if (error) {
    log('berichten lezen', error.message)
    return null
  }
  return (data ?? []).flatMap((r) => berichtUitRij(r) ?? [])
}

/**
 * De berichten die dit lid nu in de ledenapp ziet: vastgepind eerst, daarna
 * het nieuwste. De database filtert al op sportschool en tijdvenster; de
 * doelgroep (vestiging, status, tag) gaat via de geteste functie berichtenVoorLid.
 * Null = lezen mislukt.
 */
export async function haalBerichtenVoorLid(
  admin: SupabaseClient,
  userId: string,
  lid: Pick<Lid, 'vestiging' | 'status' | 'tags'>,
  nu: Date,
): Promise<Bericht[] | null> {
  const moment = nu.toISOString()
  const { data, error } = await admin
    .from('club_berichten')
    .select(BERICHT_KOLOMMEN)
    .eq('user_id', userId)
    .lte('zichtbaar_van', moment)
    .or(`zichtbaar_tot.is.null,zichtbaar_tot.gt."${moment}"`)
    .order('zichtbaar_van', { ascending: false })
    .limit(100)
  if (error) {
    log('berichten voor lid lezen', error.message)
    return null
  }
  const berichten = (data ?? []).flatMap((r) => berichtUitRij(r) ?? [])
  return berichtenVoorLid(berichten, lid, nu)
}

/** Alle tags die bij leden van deze sportschool voorkomen (voor de keuzelijst). */
export async function haalLidTags(admin: SupabaseClient, userId: string): Promise<string[]> {
  const { data, error } = await admin.from('club_leden').select('tags').eq('user_id', userId).not('tags', 'is', null).limit(5000)
  if (error) {
    log('tags lezen', error.message)
    return []
  }
  const tags = (data ?? []).flatMap((r: { tags: unknown }) => (Array.isArray(r.tags) ? r.tags.filter((t): t is string => typeof t === 'string' && t.trim() !== '') : []))
  return [...new Set(tags.map((t) => t.trim()))].sort((a, b) => a.localeCompare(b, 'nl'))
}
