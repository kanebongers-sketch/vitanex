// ─── Club, nieuwe leden: de intake van het lid opslaan (SERVER-ONLY) ────────
// Een gewone rij in club_intakes met bron 'lid'. Het lid komt altijd uit de
// sessie (ledenlogin/toegang.ts), de sportschool ook.

import type { SupabaseClient } from '@supabase/supabase-js'
import { dagSleutelNl } from '@/lib/club/kern/datum'
import { leesAntwoorden, type Antwoorden } from '@/lib/club/training/intake'
import { intakeRij, type LidIntake } from './intake'
import { TOESTEMMING_VERSIE } from './regels'

/** Hooguit zoveel intakes per lid per dag (opnieuw invullen mag, eindeloos niet). */
export const MAX_PER_DAG = 3

function log(wat: string, fout: { message: string } | null | undefined): void {
  if (fout) console.error(`[club/nieuwe-leden] ${wat} mislukt`, fout.message)
}

export interface LaatsteIntake {
  datum: string
  bron: 'trainer' | 'lid'
  antwoorden: Antwoorden | null
}

/** De laatste intake van dit lid (van de trainer of van het lid zelf), null als er geen is, undefined bij een leesfout. */
export async function haalLaatsteIntake(admin: SupabaseClient, userId: string, lidId: string): Promise<LaatsteIntake | null | undefined> {
  const { data, error } = await admin
    .from('club_intakes')
    .select('datum, bron, antwoorden, toestemming_gezondheid')
    .eq('user_id', userId)
    .eq('lid_id', lidId)
    .order('datum', { ascending: false })
    .order('aangemaakt_op', { ascending: false })
    .limit(1)
  log('laatste intake lezen', error)
  if (error) return undefined
  const r = (data ?? [])[0] as Record<string, unknown> | undefined
  if (!r || typeof r.datum !== 'string') return null
  const a = leesAntwoorden(r.antwoorden, r.toestemming_gezondheid === true)
  return { datum: r.datum.slice(0, 10), bron: r.bron === 'lid' ? 'lid' : 'trainer', antwoorden: a.ok ? a.waarde : null }
}

export type OpslaanUitkomst = { staat: 'ok'; id: string } | { staat: 'teVeel' } | { staat: 'db' }

export async function bewaarLidIntake(admin: SupabaseClient, userId: string, lidId: string, i: LidIntake, nu: Date): Promise<OpslaanUitkomst> {
  const vandaag = dagSleutelNl(nu)
  const { count, error: telFout } = await admin.from('club_intakes').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('lid_id', lidId).eq('bron', 'lid').eq('datum', vandaag)
  log('intakes van vandaag tellen', telFout)
  if (telFout) return { staat: 'db' }
  if ((count ?? 0) >= MAX_PER_DAG) return { staat: 'teVeel' }
  const { data, error } = await admin
    .from('club_intakes')
    .insert({ ...intakeRij(i, nu, TOESTEMMING_VERSIE), user_id: userId, lid_id: lidId, datum: vandaag })
    .select('id')
    .single()
  log('intake van lid opslaan', error)
  const id = (data as { id?: unknown } | null)?.id
  return !error && typeof id === 'string' ? { staat: 'ok', id } : { staat: 'db' }
}
