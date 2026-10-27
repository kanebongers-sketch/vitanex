// ─── Club, ledenkaart als hub: extra lezen (SERVER-ONLY) ────────────────────
// Wat de tabbladen naast de ledenkaart (kaart.ts) nodig hebben. Alles filtert
// op de sportschool (user_id). Bij een leesfout: loggen en null teruggeven.

import type { SupabaseClient } from '@supabase/supabase-js'
import { haalPlannen, haalPrijzen } from '@/lib/club/betalen/plannen/opslag'
import type { Plan } from '@/lib/club/betalen/plannen/model'
import { prijsOp, type Prijs } from '@/lib/club/betalen/plannen/prijsversie'
import { vandaagInAmsterdam } from '@/lib/club/betalen/contract/datum'

/** Postgres: kolom bestaat niet (migratie 464 nog niet uitgevoerd). */
const KOLOM_ONTBREEKT = '42703'

export interface Pauze {
  van: string | null
  tot: string | null
  /** false = de kolommen bestaan nog niet (migratie 464). */
  bewaarbaar: boolean
}

function datumOfNull(v: unknown): string | null {
  return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null
}

/** De pauzedatums van een lid. Zonder migratie 464: leeg en niet bewaarbaar. */
export async function haalPauze(admin: SupabaseClient, userId: string, lidId: string): Promise<Pauze | null> {
  const { data, error } = await admin.from('club_leden').select('pauze_van, pauze_tot').eq('user_id', userId).eq('id', lidId).maybeSingle()
  if (error) {
    if (error.code === KOLOM_ONTBREEKT) return { van: null, tot: null, bewaarbaar: false }
    console.error('[club] pauze van lid lezen mislukt', error.message)
    return null
  }
  const rij: Record<string, unknown> = data ?? {}
  return { van: datumOfNull(rij.pauze_van), tot: datumOfNull(rij.pauze_tot), bewaarbaar: true }
}

export interface PlanRegel {
  id: string
  naam: string
  actief: boolean
  interval: Plan['interval']
  contractMaanden: number | null
  /** De prijs voor een nieuw contract dat vandaag begint. */
  prijs: Prijs
}

/** De prijsplannen bij een vorm, met de prijs van vandaag. Alleen lezen: koppelen komt later (fase 7). */
export async function haalPlannenVoorVorm(admin: SupabaseClient, userId: string, vormId: string, nu: Date): Promise<PlanRegel[] | null> {
  const [plannen, prijzen] = await Promise.all([haalPlannen(admin, userId), haalPrijzen(admin, userId)])
  if (!plannen || !prijzen) return null
  const vandaag = vandaagInAmsterdam(nu)
  return plannen
    .filter((p) => p.vormId === vormId)
    .map((p) => ({
      id: p.id,
      naam: p.naam,
      actief: p.actief,
      interval: p.interval,
      contractMaanden: p.contractMaanden,
      prijs: prijsOp(p, prijzen.filter((v) => v.planId === p.id), vandaag),
    }))
}
