// ─── PT-app — checkup-afspraken lezen en opslaan (SERVER-ONLY) ──────────────
// Tabel `pt_groeiafspraken` (migratie 373). Per PT'er telt de nieuwste afspraak;
// oudere blijven staan als geschiedenis.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Afspraak, AfspraakInvoer } from './checkup'

const KOLOMMEN = 'id, persoon_id, gemaakt_op, gesprekken, nieuwe_klanten, referrals, niets_te_laat, notitie, gemaakt_door'

interface Rij {
  id: string
  persoon_id: string
  gemaakt_op: string
  gesprekken: number | null
  nieuwe_klanten: number | null
  referrals: number | null
  niets_te_laat: boolean
  notitie: string | null
  gemaakt_door: string | null
}

function vanRij(r: Rij): Afspraak {
  return {
    id: r.id, gemaaktOp: r.gemaakt_op, gemaaktDoor: r.gemaakt_door, gesprekken: r.gesprekken, nieuweKlanten: r.nieuwe_klanten,
    referrals: r.referrals, nietsTeLaat: r.niets_te_laat, notitie: r.notitie,
  }
}

/** De lopende (nieuwste) afspraak per PT'er. Null = lezen mislukt. */
export async function haalLopendeAfspraken(admin: SupabaseClient, userId: string, persoonIds: readonly string[]): Promise<Map<string, Afspraak> | null> {
  const uit = new Map<string, Afspraak>()
  if (persoonIds.length === 0) return uit
  const { data, error } = await admin
    .from('pt_groeiafspraken')
    .select(KOLOMMEN)
    .eq('user_id', userId)
    .in('persoon_id', persoonIds)
    .order('aangemaakt_op', { ascending: false })
    .limit(Math.max(50, persoonIds.length * 30))
  if (error) return null
  for (const r of (data ?? []) as Rij[]) if (!uit.has(r.persoon_id)) uit.set(r.persoon_id, vanRij(r))
  return uit
}

export async function maakAfspraak(
  admin: SupabaseClient,
  userId: string,
  persoonId: string,
  a: AfspraakInvoer,
  gemaaktOp: string,
  door: string,
): Promise<boolean> {
  const { error } = await admin.from('pt_groeiafspraken').insert({
    user_id: userId, persoon_id: persoonId, gemaakt_op: gemaaktOp, gesprekken: a.gesprekken, nieuwe_klanten: a.nieuweKlanten,
    referrals: a.referrals, niets_te_laat: a.nietsTeLaat, notitie: a.notitie, gemaakt_door: door,
  })
  return !error
}
