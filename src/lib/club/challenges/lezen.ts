// ─── Club, challenges: lezen (SERVER-ONLY) ──────────────────────────────────
// Challenges, deelnemers en de momenten die meetellen (check-ins,
// trainingslog, aanwezige groepslessen). Elke query filtert op user_id van de
// sportschool. Een leesfout wordt gelogd en geeft null, zodat het scherm een
// nette melding toont.

import type { SupabaseClient } from '@supabase/supabase-js'
import { alleRijen } from '@/lib/club/leden/data'
import { CHALLENGE_KOLOMMEN, challengeUitRij, type Challenge, type ChallengeSoort } from './model'
import { laatsteDag } from './periode'
import { perLid, ranglijst, scoreVoor, vatSamen, type Deelnemer, type Stand, type Samenvatting } from './voortgang'

/** Leden met deze status doen automatisch mee (zelfde regel als trainen mogen). */
const MEEDOEN_STATUSSEN = ['actief', 'proef', 'opgezegd']

function meld(wat: string, fout: { message: string }): void {
  console.error(`[club/challenges] ${wat} mislukt`, fout.message)
}

export async function haalChallenges(admin: SupabaseClient, userId: string): Promise<Challenge[] | null> {
  const { data, error } = await admin.from('club_challenges').select(CHALLENGE_KOLOMMEN).eq('user_id', userId).order('eind_op', { ascending: false }).limit(300)
  if (error) {
    meld('challenges lezen', error)
    return null
  }
  return (data ?? []).map(challengeUitRij).filter((c): c is Challenge => c !== null)
}

export async function haalChallenge(admin: SupabaseClient, userId: string, id: string): Promise<Challenge | null> {
  const { data, error } = await admin.from('club_challenges').select(CHALLENGE_KOLOMMEN).eq('user_id', userId).eq('id', id).maybeSingle()
  if (error) meld('challenge lezen', error)
  return error ? null : challengeUitRij(data)
}

/** Een ruim venster rond de periode; de precieze grens (Nederlandse dag) bewaakt voortgang.ts. */
export function momentenVenster(c: Pick<Challenge, 'start' | 'eind' | 'gestoptOp'>): { van: string; tot: string } {
  const van = new Date(`${c.start}T00:00:00Z`)
  van.setUTCDate(van.getUTCDate() - 1)
  const tot = new Date(`${laatsteDag(c)}T00:00:00Z`)
  tot.setUTCDate(tot.getUTCDate() + 2)
  return { van: van.toISOString(), tot: tot.toISOString() }
}

interface Moment {
  lidId: string
  op: string
}

function momentUitRij(rij: unknown): Moment | null {
  if (typeof rij !== 'object' || rij === null) return null
  const r = rij as Record<string, unknown>
  const les = r.club_lessen as Record<string, unknown> | null | undefined
  const op = typeof r.op === 'string' ? r.op : typeof les?.start_op === 'string' ? les.start_op : null
  return typeof r.lid_id === 'string' && op ? { lidId: r.lid_id, op } : null
}

/**
 * De momenten die voor een soort tellen, tussen van en tot. Met `lidId` alleen
 * van dat lid. Bezoeken tellen in alle vestigingen.
 */
export async function haalMomenten(admin: SupabaseClient, userId: string, soort: ChallengeSoort, bereik: { van: string; tot: string }, lidId?: string): Promise<Moment[] | null> {
  const rijen = await alleRijen(`momenten (${soort})`, (van, tot) => {
    if (soort === 'lessen') {
      const q = admin.from('club_reserveringen').select('id, lid_id, club_lessen!inner(start_op)').eq('user_id', userId).eq('status', 'aanwezig')
        .gte('club_lessen.start_op', bereik.van).lt('club_lessen.start_op', bereik.tot)
      return (lidId ? q.eq('lid_id', lidId) : q).order('id').range(van, tot)
    }
    const tabel = soort === 'trainingen' ? 'club_trainingslog' : 'club_checkins'
    const q = admin.from(tabel).select('id, lid_id, op').eq('user_id', userId).gte('op', bereik.van).lt('op', bereik.tot)
    return (lidId ? q.eq('lid_id', lidId) : q).order('id').range(van, tot)
  })
  return rijen ? rijen.map(momentUitRij).filter((m): m is Moment => m !== null) : null
}

function deelnemerUitRij(rij: unknown): (Deelnemer & { vestiging: string }) | null {
  if (typeof rij !== 'object' || rij === null) return null
  const r = rij as Record<string, unknown>
  if (typeof r.id !== 'string' || typeof r.voornaam !== 'string' || typeof r.achternaam !== 'string' || typeof r.vestiging !== 'string') return null
  return { lidId: r.id, voornaam: r.voornaam, achternaam: r.achternaam, vestiging: r.vestiging }
}

/** Wie meedoet: bij automatisch alle leden van de vestiging(en) die mogen trainen, anders wie zich inschreef. */
export async function haalDeelnemers(admin: SupabaseClient, userId: string, c: Challenge): Promise<Deelnemer[] | null> {
  if (c.deelname === 'inschrijven') {
    const rijen = await alleRijen('deelnemers', (van, tot) =>
      admin.from('club_challenge_deelnemers').select('id, club_leden!inner(id, voornaam, achternaam, vestiging)').eq('user_id', userId).eq('challenge_id', c.id).order('id').range(van, tot),
    )
    if (!rijen) return null
    return rijen
      .map((r) => deelnemerUitRij((r as { club_leden?: unknown }).club_leden))
      .filter((d): d is Deelnemer & { vestiging: string } => d !== null && (c.vestigingen.length === 0 || c.vestigingen.includes(d.vestiging)))
  }
  const rijen = await alleRijen('deelnemers (leden)', (van, tot) => {
    const q = admin.from('club_leden').select('id, voornaam, achternaam, vestiging').eq('user_id', userId).in('status', MEEDOEN_STATUSSEN)
    return (c.vestigingen.length ? q.in('vestiging', c.vestigingen) : q).order('id').range(van, tot)
  })
  return rijen ? rijen.map(deelnemerUitRij).filter((d): d is Deelnemer & { vestiging: string } => d !== null) : null
}

export interface StandData {
  stand: Stand[]
  samenvatting: Samenvatting
}

/** De stand van een challenge: alle deelnemers met hun score, plus de samenvatting. */
export async function haalStand(admin: SupabaseClient, userId: string, c: Challenge): Promise<StandData | null> {
  const [deelnemers, momenten] = await Promise.all([haalDeelnemers(admin, userId, c), haalMomenten(admin, userId, c.soort, momentenVenster(c))])
  if (!deelnemers || !momenten) return null
  const per = perLid(momenten)
  const scores = new Map(deelnemers.map((d) => [d.lidId, scoreVoor(c, per.get(d.lidId) ?? [])]))
  const stand = ranglijst(deelnemers, scores, c.doel)
  return { stand, samenvatting: vatSamen(stand) }
}

/** De challenges waarvoor dit lid zich inschreef. */
export async function haalInschrijvingen(admin: SupabaseClient, userId: string, lidId: string): Promise<Set<string> | null> {
  const { data, error } = await admin.from('club_challenge_deelnemers').select('challenge_id').eq('user_id', userId).eq('lid_id', lidId).limit(500)
  if (error) {
    meld('inschrijvingen lezen', error)
    return null
  }
  return new Set((data ?? []).map((r: { challenge_id: unknown }) => r.challenge_id).filter((id): id is string => typeof id === 'string'))
}
