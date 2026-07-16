// ─── LifeOS — notities in de database ───────────────────────────────────────
// SERVER-ONLY. Alle databasetoegang voor notities staat hier; de routes doen
// auth, validatie en het antwoord.
//
// De journal-race is hier het interessante geval — zie `lib/journal/opslag.ts`.
// Deze module blijft dom: hij leest en schrijft rijen, hij kent geen functie 7
// of 9. Het onderscheid zit in `soort`.

import type { SupabaseClient } from '@supabase/supabase-js'
import { notitiesVanRijen, notitieVanRij, type NieuweNotitie, type Notitie, type Soort } from './notities'

export const KOLOMMEN = 'id, tekst, soort, datum, aangemaakt_op, bijgewerkt_op'

/** Postgres: unieke index geschonden. */
const UNIEK_GESCHONDEN = '23505'
/** Postgres: check-constraint geschonden. */
const CHECK_GESCHONDEN = '23514'

export type Reden = 'db' | 'bezet' | 'ongeldig' | 'niet_gevonden'
export type Uitkomst<T> = { ok: true; waarde: T } | { ok: false; reden: Reden }

function foutCode(error: unknown): string | null {
  if (typeof error !== 'object' || error === null || !('code' in error)) return null
  const code = (error as { code: unknown }).code
  return typeof code === 'string' ? code : null
}

export function vertaalFout(error: unknown): Reden {
  const code = foutCode(error)
  if (code === UNIEK_GESCHONDEN) return 'bezet'
  if (code === CHECK_GESCHONDEN) return 'ongeldig'
  return 'db'
}

export interface NotitiesFilter {
  soort: Soort
  /** Eén dag. Weglaten = alle dagen (nieuwste eerst). */
  datum?: string
}

/**
 * De notities van een soort, nieuwste eerst.
 *
 * Binnen een dag oplopend op `aangemaakt_op`: een brain dump is een lijstje in
 * de volgorde waarin je hem leegde, niet omgekeerd. De dag zelf gaat aflopend —
 * dat matcht de index uit 050 én de leesrichting van een terugblik.
 */
export async function haalNotities(
  admin: SupabaseClient,
  userId: string,
  filter: NotitiesFilter,
): Promise<Uitkomst<Notitie[]>> {
  const basis = admin
    .from('notities')
    .select(KOLOMMEN)
    .eq('user_id', userId)
    .eq('soort', filter.soort)
  const opDatum = filter.datum === undefined ? basis : basis.eq('datum', filter.datum)

  const { data, error } = await opDatum
    .order('datum', { ascending: false })
    .order('aangemaakt_op', { ascending: true })

  if (error) return { ok: false, reden: vertaalFout(error) }
  return { ok: true, waarde: notitiesVanRijen(Array.isArray(data) ? data : []) }
}

export async function maakNotitie(
  admin: SupabaseClient,
  userId: string,
  nieuw: NieuweNotitie,
): Promise<Uitkomst<Notitie>> {
  const { data, error } = await admin
    .from('notities')
    .insert({
      user_id: userId,
      tekst: nieuw.tekst,
      soort: nieuw.soort,
      datum: nieuw.datum,
    })
    .select(KOLOMMEN)
    .single()

  if (error) return { ok: false, reden: vertaalFout(error) }

  const notitie = notitieVanRij(data)
  return notitie ? { ok: true, waarde: notitie } : { ok: false, reden: 'db' }
}

/**
 * Weg ermee.
 *
 * `.eq('user_id', ...)` staat er ook al gaat dit via de service-role-client (die
 * RLS omzeilt): zonder die filter zou een geraden id de notitie van een ander
 * verwijderen. Single-tenant maakt dat vandaag theoretisch — maar dit is de
 * regel die je niet één keer mag vergeten.
 */
export async function verwijderNotitie(
  admin: SupabaseClient,
  userId: string,
  id: string,
): Promise<Uitkomst<null>> {
  const { data, error } = await admin
    .from('notities')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
    .select('id')
    .maybeSingle()

  if (error) return { ok: false, reden: vertaalFout(error) }
  if (!data) return { ok: false, reden: 'niet_gevonden' }
  return { ok: true, waarde: null }
}
