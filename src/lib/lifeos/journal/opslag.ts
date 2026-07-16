// ─── LifeOS — journal in de database ────────────────────────────────────────
// SERVER-ONLY. Bouwt op `notities` (migratie 050) met `soort = 'journal'`.
//
// WAAROM HIER GEEN `.upsert()` STAAT:
//
// De uniciteit "één journal per dag" komt uit een PARTIËLE index
// (`where soort = 'journal'`). Postgres kan een conflict alleen tegen zo'n index
// afleiden als je het predicaat meegeeft: `on conflict (user_id, datum) where
// soort = 'journal'`. PostgREST's `upsert({ onConflict })` kent alleen
// kolomnamen, geen predicaat — die zou dus stranden op "no unique or exclusion
// constraint matching the ON CONFLICT specification".
//
// Vandaar de volgorde hieronder: UPDATE eerst, INSERT als er nog niets stond.
// Dat is geen omweg maar precies goed voor auto-save: je schrijft één keer per
// dag een nieuwe rij en werkt hem daarna tientallen keren bij. De gewone weg is
// dus één query.

import type { SupabaseClient } from '@supabase/supabase-js'
import {
  notitiesVanRijen,
  notitieVanRij,
  type Notitie,
} from '@/lib/lifeos/notities/notities'
import { KOLOMMEN, vertaalFout, type Uitkomst } from '@/lib/lifeos/notities/opslag'

export type { Uitkomst, Reden } from '@/lib/lifeos/notities/opslag'

const SOORT = 'journal' as const

/**
 * De journals van een aantal dagen, in één query.
 *
 * Eén query, geen twee: de kaart wil "vandaag" én "schreef ik gisteren?", en dat
 * zijn geen twee round-trips waard (README §Lessen).
 */
export async function haalJournals(
  admin: SupabaseClient,
  userId: string,
  datums: readonly string[],
): Promise<Uitkomst<Notitie[]>> {
  if (datums.length === 0) return { ok: true, waarde: [] }

  const { data, error } = await admin
    .from('notities')
    .select(KOLOMMEN)
    .eq('user_id', userId)
    .eq('soort', SOORT)
    .in('datum', [...datums])

  if (error) return { ok: false, reden: vertaalFout(error) }
  return { ok: true, waarde: notitiesVanRijen(Array.isArray(data) ? data : []) }
}

async function updateJournal(
  admin: SupabaseClient,
  userId: string,
  datum: string,
  tekst: string,
): Promise<Uitkomst<Notitie>> {
  const { data, error } = await admin
    .from('notities')
    .update({ tekst })
    .eq('user_id', userId)
    .eq('soort', SOORT)
    .eq('datum', datum)
    .select(KOLOMMEN)
    .maybeSingle()

  if (error) return { ok: false, reden: vertaalFout(error) }
  if (!data) return { ok: false, reden: 'niet_gevonden' }

  const notitie = notitieVanRij(data)
  return notitie ? { ok: true, waarde: notitie } : { ok: false, reden: 'db' }
}

async function insertJournal(
  admin: SupabaseClient,
  userId: string,
  datum: string,
  tekst: string,
): Promise<Uitkomst<Notitie>> {
  const { data, error } = await admin
    .from('notities')
    .insert({ user_id: userId, soort: SOORT, datum, tekst })
    .select(KOLOMMEN)
    .single()

  if (error) return { ok: false, reden: vertaalFout(error) }

  const notitie = notitieVanRij(data)
  return notitie ? { ok: true, waarde: notitie } : { ok: false, reden: 'db' }
}

/**
 * Schrijft de journal van een dag. Maakt hem aan als hij er nog niet is.
 *
 * De race: twee tabbladen die tegelijk de eerste versie van vandaag opslaan.
 * Allebei zien ze `niet_gevonden` op de update en gaan ze inserten; de partiële
 * unieke index uit 050 laat er precies één door en geeft de ander 23505
 * ('bezet'). Die doet dan alsnog de update — en dat is het juiste antwoord, want
 * de rij bestaat inmiddels. Geen van beide verliest tekst.
 */
export async function schrijfJournal(
  admin: SupabaseClient,
  userId: string,
  datum: string,
  tekst: string,
): Promise<Uitkomst<Notitie>> {
  const bestaand = await updateJournal(admin, userId, datum, tekst)
  if (bestaand.ok || bestaand.reden !== 'niet_gevonden') return bestaand

  const nieuw = await insertJournal(admin, userId, datum, tekst)
  if (nieuw.ok || nieuw.reden !== 'bezet') return nieuw

  // Ingehaald door een ander tabblad: de rij bestaat nu wél.
  return updateJournal(admin, userId, datum, tekst)
}

/**
 * Wist de journal van een dag.
 *
 * `niet_gevonden` is hier GEEN fout: je hele reflectie weghalen terwijl er nog
 * niets opgeslagen was, is een geldige uitkomst — er staat daarna niets, en dat
 * was de bedoeling. Een 404 teruggeven zou de indicator op "mislukt" zetten
 * terwijl alles klopt.
 */
export async function wisJournal(
  admin: SupabaseClient,
  userId: string,
  datum: string,
): Promise<Uitkomst<null>> {
  const { error } = await admin
    .from('notities')
    .delete()
    .eq('user_id', userId)
    .eq('soort', SOORT)
    .eq('datum', datum)

  if (error) return { ok: false, reden: vertaalFout(error) }
  return { ok: true, waarde: null }
}
