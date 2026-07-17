// ─── LifeOS — projecten in de database ──────────────────────────────────────
// SERVER-ONLY. Alle databasetoegang voor projecten staat hier; de routes doen
// auth, validatie en het antwoord.
//
// De dubbele naam is hier het interessante geval. Twee requests die tegelijk
// "MentaForce" aanmaken mogen niet allebei slagen — anders verdeelt je werk zich
// stilletjes over twee projecten met dezelfde naam. Dat lossen we NIET op met
// "eerst kijken of de naam vrij is en dan schrijven": daar zit precies de race
// in. De unieke index uit migratie 100 (op `lower(btrim(naam))`) wijst de tweede
// af met 23505, en dat vertalen we hier naar één begrijpelijke uitkomst:
// 'bestaat_al'. Zelfde patroon als de top-3-race in `taken/opslag.ts`.

// De service-role client komt als PARAMETER binnen, niet uit een import. LifeOS
// leeft in een EIGEN Supabase-project (zie `@/lib/lifeos/admin`): de route haalt
// die client achter de founder-gate op met `vereisLifeosToegang` en reikt 'm
// hier aan. Zo praat deze module gegarandeerd met de LifeOS-database.
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  projectVanRij,
  projectenVanRijen,
  type NieuwProject,
  type Project,
  type ProjectWijziging,
} from './projecten'

const KOLOMMEN = 'id, naam, omschrijving, actief, aangemaakt_op'

/** Postgres: unieke index geschonden. */
const UNIEK_GESCHONDEN = '23505'
/** Postgres: check-constraint geschonden. */
const CHECK_GESCHONDEN = '23514'
/** Postgres: tekst die geen geldig type is — bv. 'abc' als uuid. */
const ONLEESBAAR = '22P02'

export type Reden = 'db' | 'bestaat_al' | 'ongeldig' | 'niet_gevonden'
export type Uitkomst<T> = { ok: true; waarde: T } | { ok: false; reden: Reden }

function foutCode(error: unknown): string | null {
  if (typeof error !== 'object' || error === null || !('code' in error)) return null
  const code = (error as { code: unknown }).code
  return typeof code === 'string' ? code : null
}

function vertaalFout(error: unknown): Reden {
  const code = foutCode(error)
  if (code === UNIEK_GESCHONDEN) return 'bestaat_al'
  if (code === CHECK_GESCHONDEN) return 'ongeldig'
  if (code === ONLEESBAAR) return 'ongeldig'
  return 'db'
}

export interface ProjectenFilter {
  /** Alleen de niet-gearchiveerde projecten. */
  alleenActief?: boolean
}

export async function haalProjecten(
  admin: SupabaseClient,
  userId: string,
  filter: ProjectenFilter = {},
): Promise<Uitkomst<Project[]>> {
  let query = admin.from('projecten').select(KOLOMMEN).eq('user_id', userId)
  if (filter.alleenActief) query = query.eq('actief', true)

  // Actieve projecten eerst, dan op naam: dit is een keuzelijst, en alfabetisch
  // is de enige volgorde waarin je iets terugvindt zonder na te denken.
  const { data, error } = await query
    .order('actief', { ascending: false })
    .order('naam', { ascending: true })

  if (error) return { ok: false, reden: vertaalFout(error) }
  return { ok: true, waarde: projectenVanRijen(Array.isArray(data) ? data : []) }
}

export async function maakProject(
  admin: SupabaseClient,
  userId: string,
  nieuw: NieuwProject,
): Promise<Uitkomst<Project>> {
  const { data, error } = await admin
    .from('projecten')
    .insert({ user_id: userId, naam: nieuw.naam, omschrijving: nieuw.omschrijving })
    .select(KOLOMMEN)
    .single()

  if (error) return { ok: false, reden: vertaalFout(error) }

  const project = projectVanRij(data)
  return project ? { ok: true, waarde: project } : { ok: false, reden: 'db' }
}

/** Wijzigt alleen de meegestuurde velden. */
export async function wijzigProject(
  admin: SupabaseClient,
  userId: string,
  id: string,
  wijziging: ProjectWijziging,
): Promise<Uitkomst<Project>> {
  const velden: Record<string, unknown> = {}
  if (wijziging.naam !== undefined) velden.naam = wijziging.naam
  if (wijziging.omschrijving !== undefined) velden.omschrijving = wijziging.omschrijving
  if (wijziging.actief !== undefined) velden.actief = wijziging.actief

  const { data, error } = await admin
    .from('projecten')
    .update(velden)
    .eq('id', id)
    .eq('user_id', userId)
    .select(KOLOMMEN)
    .maybeSingle()

  if (error) return { ok: false, reden: vertaalFout(error) }
  if (!data) return { ok: false, reden: 'niet_gevonden' }

  const project = projectVanRij(data)
  return project ? { ok: true, waarde: project } : { ok: false, reden: 'db' }
}

/**
 * Weg met het project. De taken blijven bestaan: `project_id` staat in migratie
 * 100 op `on delete set null`, dus ze vallen terug op "geen project" in plaats
 * van mee de afgrond in te gaan.
 *
 * Wil je de taken houden én de context bewaren, gebruik dan `actief: false` —
 * archiveren is bijna altijd wat je bedoelt.
 */
export async function verwijderProject(
  admin: SupabaseClient,
  userId: string,
  id: string,
): Promise<Uitkomst<null>> {
  const { data, error } = await admin
    .from('projecten')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
    .select('id')
    .maybeSingle()

  if (error) return { ok: false, reden: vertaalFout(error) }
  if (!data) return { ok: false, reden: 'niet_gevonden' }
  return { ok: true, waarde: null }
}
