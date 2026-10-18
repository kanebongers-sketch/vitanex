// ─── Club, betalen: strip terug bij annuleren (SERVER-ONLY) ─────────────────
// Annuleert de sportschool een les (zelf of via een sluitingsdag) of een
// medewerker een reservering, dan krijgt het lid de strip terug. Best effort:
// de databasefunctie doet niets als er voor die reservering niets is
// afgeboekt, en een fout breekt het annuleren nooit.

import type { SupabaseClient } from '@supabase/supabase-js'
import { geefTegoedTerug } from './opslag'

export interface GeraakteReservering {
  reserveringId: string
  lidId: string
}

/** Uit rijen van club_reserveringen (id, lid_id): alleen rijen met een lid. */
export function geraakteReserveringen(rijen: ReadonlyArray<Record<string, unknown>>): GeraakteReservering[] {
  return rijen.flatMap((r) => (typeof r.id === 'string' && typeof r.lid_id === 'string' ? [{ reserveringId: r.id, lidId: r.lid_id }] : []))
}

/** Geef per geraakte reservering de strip terug. Geeft het aantal teruggegeven strippen. */
export async function geefStrippenTerug(admin: SupabaseClient, userId: string, geraakt: readonly GeraakteReservering[], door: string): Promise<number> {
  let terug = 0
  for (const g of geraakt) {
    const ok = await geefTegoedTerug(admin, { userId, lidId: g.lidId, reserveringId: g.reserveringId, afspraakId: null, door })
    if (ok) terug++
  }
  return terug
}

/**
 * Na het annuleren van een enkele reservering: was hij met een strip betaald
 * en op tijd geannuleerd, dan komt de strip terug. Te laat geannuleerd: geen
 * strip terug (zoals bij afmelden door het lid zelf). `lidId` gegeven: alleen
 * als de reservering van dat lid is. Geeft true als er een strip terugging.
 */
export async function stripTerugNaAnnuleren(admin: SupabaseClient, userId: string, reserveringId: string, door: string, lidId: string | null = null): Promise<boolean> {
  const { data, error } = await admin.from('club_reserveringen').select('status, te_laat, lid_id').eq('user_id', userId).eq('id', reserveringId).maybeSingle()
  if (error) {
    console.error('[club/betalen] reservering lezen voor strip terug mislukt', error.code ?? '', error.message)
    return false
  }
  if (!data || typeof data.lid_id !== 'string' || data.status !== 'geannuleerd' || data.te_laat === true) return false
  if (lidId !== null && data.lid_id !== lidId) return false
  return (await geefTegoedTerug(admin, { userId, lidId: data.lid_id, reserveringId, afspraakId: null, door })) === true
}
