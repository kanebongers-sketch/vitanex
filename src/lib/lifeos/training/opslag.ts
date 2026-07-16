// ─── LifeOS — trainingen in de database ─────────────────────────────────────
// SERVER-ONLY. Alle databasetoegang voor trainingen staat hier; de routes doen
// auth, validatie en het antwoord.
//
// De service-role client komt als PARAMETER binnen, niet uit een import. LifeOS
// leeft in een EIGEN Supabase-project (zie `@/lib/lifeos/admin`): de route haalt
// die client achter de founder-gate op met `vereisLifeosToegang` en reikt 'm
// hier aan. Zo praat deze module gegarandeerd met de LifeOS-database en nooit
// met de B2B-database van MentaForce.
//
// De check-constraint `trainingen_gepland_meet_niet` (migratie 070) is hier het
// interessante geval. Een PATCH ziet maar de helft van de rij: `{ gepland: true }`
// op een training die al een RPE heeft, is pas onmogelijk als je beide kent. Dat
// lossen we NIET op met "eerst lezen en dan schrijven" — daar zit een race in.
// De database ziet de hele rij ná de update en wijst af met 23514; dat vertalen
// we hier naar één begrijpelijke uitkomst: 'ongeldig'.

import type { SupabaseClient } from '@supabase/supabase-js'
import {
  trainingenVanRijen,
  trainingVanRij,
  type NieuweTraining,
  type Training,
  type TrainingWijziging,
} from './training'

const KOLOMMEN =
  'id, datum, soort, omschrijving, duur_minuten, rpe, actieve_minuten, gepland, aangemaakt_op'

/** Postgres: check-constraint geschonden. */
const CHECK_GESCHONDEN = '23514'

export type Reden = 'db' | 'ongeldig' | 'niet_gevonden'
export type Uitkomst<T> = { ok: true; waarde: T } | { ok: false; reden: Reden }

function foutCode(error: unknown): string | null {
  if (typeof error !== 'object' || error === null || !('code' in error)) return null
  const code = (error as { code: unknown }).code
  return typeof code === 'string' ? code : null
}

function vertaalFout(error: unknown): Reden {
  return foutCode(error) === CHECK_GESCHONDEN ? 'ongeldig' : 'db'
}

/**
 * Welk stuk tijd je wilt zien.
 *
 * Een unie en geen object met optionele velden: zo bestaat "geen venster" niet
 * als aanroep. Een ongebonden query groeit stil mee met de jaren en is op een
 * dag traag zonder dat iemand iets veranderde — dat mag hier niet eens getypt
 * worden.
 */
export type TrainingVenster =
  | { soort: 'dag'; datum: string }
  /** Beide grenzen inclusief. */
  | { soort: 'reeks'; vanaf: string; tot: string }

/** De trainingen van een dag of een reeks dagen. */
export async function haalTrainingen(
  admin: SupabaseClient,
  userId: string,
  venster: TrainingVenster,
): Promise<Uitkomst<Training[]>> {
  const basis = admin.from('trainingen').select(KOLOMMEN).eq('user_id', userId)
  const opDatum =
    venster.soort === 'dag'
      ? basis.eq('datum', venster.datum)
      : basis.gte('datum', venster.vanaf).lte('datum', venster.tot)

  const { data, error } = await opDatum
    // Gepland eerst: dat is wat er nog moet gebeuren, en dat is wat je in het
    // Nu-moment wilt zien. Daarna op invoervolgorde.
    .order('datum', { ascending: false })
    .order('gepland', { ascending: false })
    .order('aangemaakt_op', { ascending: true })

  if (error) return { ok: false, reden: vertaalFout(error) }
  return { ok: true, waarde: trainingenVanRijen(Array.isArray(data) ? data : []) }
}

export async function maakTraining(
  admin: SupabaseClient,
  userId: string,
  nieuw: NieuweTraining,
): Promise<Uitkomst<Training>> {
  const { data, error } = await admin
    .from('trainingen')
    .insert({
      user_id: userId,
      datum: nieuw.datum,
      soort: nieuw.soort,
      omschrijving: nieuw.omschrijving,
      duur_minuten: nieuw.duurMinuten,
      rpe: nieuw.rpe,
      actieve_minuten: nieuw.actieveMinuten,
      gepland: nieuw.gepland,
    })
    .select(KOLOMMEN)
    .single()

  if (error) return { ok: false, reden: vertaalFout(error) }

  const training = trainingVanRij(data)
  return training ? { ok: true, waarde: training } : { ok: false, reden: 'db' }
}

/**
 * Wijzigt alleen de meegestuurde velden.
 *
 * `undefined` = niet meegestuurd, `null` = expliciet wissen. Die twee door
 * elkaar halen zou betekenen dat je een RPE niet meer kunt weghalen — en een
 * verkeerde RPE is erger dan geen RPE.
 */
export async function wijzigTraining(
  admin: SupabaseClient,
  userId: string,
  id: string,
  wijziging: TrainingWijziging,
): Promise<Uitkomst<Training>> {
  const velden: Record<string, unknown> = {}
  if (wijziging.datum !== undefined) velden.datum = wijziging.datum
  if (wijziging.soort !== undefined) velden.soort = wijziging.soort
  if (wijziging.omschrijving !== undefined) velden.omschrijving = wijziging.omschrijving
  if (wijziging.duurMinuten !== undefined) velden.duur_minuten = wijziging.duurMinuten
  if (wijziging.rpe !== undefined) velden.rpe = wijziging.rpe
  if (wijziging.actieveMinuten !== undefined) velden.actieve_minuten = wijziging.actieveMinuten
  if (wijziging.gepland !== undefined) velden.gepland = wijziging.gepland

  const { data, error } = await admin
    .from('trainingen')
    .update(velden)
    .eq('id', id)
    .eq('user_id', userId)
    .select(KOLOMMEN)
    .maybeSingle()

  if (error) return { ok: false, reden: vertaalFout(error) }
  if (!data) return { ok: false, reden: 'niet_gevonden' }

  const training = trainingVanRij(data)
  return training ? { ok: true, waarde: training } : { ok: false, reden: 'db' }
}

export async function verwijderTraining(
  admin: SupabaseClient,
  userId: string,
  id: string,
): Promise<Uitkomst<null>> {
  const { data, error } = await admin
    .from('trainingen')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
    .select('id')
    .maybeSingle()

  if (error) return { ok: false, reden: vertaalFout(error) }
  if (!data) return { ok: false, reden: 'niet_gevonden' }
  return { ok: true, waarde: null }
}
