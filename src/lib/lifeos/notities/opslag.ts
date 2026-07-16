// ─── LifeOS — notities in de database ───────────────────────────────────────
// SERVER-ONLY. Alle databasetoegang voor notities staat hier; de routes doen
// auth, validatie en het antwoord.
//
// De journal-race is hier het interessante geval — zie `lib/journal/opslag.ts`.
// Deze module blijft dom: hij leest en schrijft rijen, hij kent geen functie 7
// of 9. Het onderscheid zit in `soort`.
//
// De service-role-client komt als PARAMETER binnen (van `vereisLifeosToegang`):
// deze module weet niets van env of van welk Supabase-project. Zo blijft de
// LifeOS-brug op precies één plek.

import type { SupabaseClient } from '@supabase/supabase-js'
import {
  notitiesVanRijen,
  notitieVanRij,
  type NieuweNotitie,
  type Notitie,
  type NotitieWijziging,
  type Soort,
} from './notities'

export const KOLOMMEN = 'id, tekst, soort, datum, tags, categorie, aangemaakt_op, bijgewerkt_op'

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
  /** Vrije zoektekst (substring, case-insensitief op tekst). */
  zoek?: string
  /** Filter op één tag (exacte, genormaliseerde match). */
  tag?: string
  /** Filter op categorie. */
  categorie?: string
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
  let vraag = admin
    .from('notities')
    .select(KOLOMMEN)
    .eq('user_id', userId)
    .eq('soort', filter.soort)

  if (filter.datum !== undefined) vraag = vraag.eq('datum', filter.datum)
  if (filter.categorie !== undefined) vraag = vraag.eq('categorie', filter.categorie)
  // Tag-containment: rijen waarvan de tags-array deze tag bevat.
  if (filter.tag !== undefined) vraag = vraag.contains('tags', [filter.tag])
  // Zoeken: substring, case-insensitief. `%` en `_` in de invoer escapen we,
  // anders zou een gebruiker die letterlijk "50%" zoekt een wildcard triggeren.
  if (filter.zoek !== undefined) {
    const veilig = filter.zoek.replace(/[%_\\]/g, '\\$&')
    vraag = vraag.ilike('tekst', `%${veilig}%`)
  }

  const { data, error } = await vraag
    .order('datum', { ascending: false })
    .order('aangemaakt_op', { ascending: true })

  if (error) return { ok: false, reden: vertaalFout(error) }
  return { ok: true, waarde: notitiesVanRijen(Array.isArray(data) ? data : []) }
}

/**
 * Werkt tags en/of categorie van één notitie bij. Alleen de meegestuurde velden
 * veranderen (partiële update). `.eq('user_id', ...)` blijft de regel die je niet
 * mag vergeten — zie `verwijderNotitie`.
 */
export async function wijzigNotitie(
  admin: SupabaseClient,
  userId: string,
  id: string,
  wijziging: NotitieWijziging,
): Promise<Uitkomst<Notitie>> {
  const velden: Record<string, unknown> = {}
  if (wijziging.tags !== undefined) velden.tags = wijziging.tags
  if (wijziging.categorie !== undefined) velden.categorie = wijziging.categorie
  // Niets te wijzigen? Dan is dit een no-op-fout, geen stille success — de route
  // hoort dat als "ongeldig" terug te geven i.p.v. een lege PATCH te doen.
  if (Object.keys(velden).length === 0) return { ok: false, reden: 'ongeldig' }

  const { data, error } = await admin
    .from('notities')
    .update(velden)
    .eq('id', id)
    .eq('user_id', userId)
    .select(KOLOMMEN)
    .maybeSingle()

  if (error) return { ok: false, reden: vertaalFout(error) }
  if (!data) return { ok: false, reden: 'niet_gevonden' }

  const notitie = notitieVanRij(data)
  return notitie ? { ok: true, waarde: notitie } : { ok: false, reden: 'db' }
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
