// ─── Club en ledenapp: weggeklikte eerste-keer-uitleg per account (SERVER) ──
// Migratie 476: club_medewerkers.uitleg_gezien (het profiel, ook van een
// eigenaar of clubmanager) en club_lid_toegang.uitleg_gezien (het account van
// een lid). Elke query filtert op de sportschool (user_id). Een leesfout telt
// als "nog niet gezien": dan verschijnt de uitleg, en wegklikken onthoudt de
// browser nog altijd (WelkomKaarten).

import type { SupabaseClient } from '@supabase/supabase-js'
import { metGezien } from '@/lib/club/rollen/welkom'

type Waar = { soort: 'profiel'; id: string } | { soort: 'lid'; id: string }

function bron(waar: Waar): { tabel: string; kolom: string } {
  return waar.soort === 'profiel' ? { tabel: 'club_medewerkers', kolom: 'id' } : { tabel: 'club_lid_toegang', kolom: 'lid_id' }
}

function lijstUit(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []
}

/** Welke uitleg dit account al wegklikte; [] als er niets is of bij een fout. */
export async function haalGezien(admin: SupabaseClient, userId: string, waar: Waar): Promise<string[]> {
  const { tabel, kolom } = bron(waar)
  const { data, error } = await admin.from(tabel).select('uitleg_gezien').eq('user_id', userId).eq(kolom, waar.id).maybeSingle()
  if (error) {
    console.error('[club/uitleg] lezen mislukt', { tabel, code: error.code })
    return []
  }
  return lijstUit(data?.uitleg_gezien)
}

/** Onthoud dat dit account de uitleg wegklikte. false als het niet lukte. */
export async function bewaarGezien(admin: SupabaseClient, userId: string, waar: Waar, code: string): Promise<boolean> {
  const { tabel, kolom } = bron(waar)
  const nu = await haalGezien(admin, userId, waar)
  if (nu.includes(code)) return true
  const { error } = await admin.from(tabel).update({ uitleg_gezien: metGezien(nu, code) }).eq('user_id', userId).eq(kolom, waar.id)
  if (error) {
    console.error('[club/uitleg] opslaan mislukt', { tabel, code: error.code })
    return false
  }
  return true
}
