// ─── LifeOS — taken in de database ──────────────────────────────────────────
// SERVER-ONLY. Alle databasetoegang voor taken staat hier; de routes doen auth,
// validatie en het antwoord.
//
// De top-3-race is hier het interessante geval. Twee requests die tegelijk
// positie 1 claimen mogen niet allebei slagen. Dat lossen we NIET op met
// "eerst kijken of positie 1 vrij is en dan schrijven" — daar zit precies de
// race in. De unieke partial index uit migratie 020 wijst de tweede af met
// 23505, en dat vertalen we hier naar één begrijpelijke uitkomst: 'bezet'.

// De service-role client komt als PARAMETER binnen, niet uit een import. LifeOS
// leeft in een EIGEN Supabase-project (zie `@/lib/lifeos/admin`): de route haalt
// die client achter de founder-gate op met `vereisLifeosToegang` en reikt 'm
// hier aan. Zo praat deze module gegarandeerd met de LifeOS-database.
import type { SupabaseClient } from '@supabase/supabase-js'
import { takenVanRijen, taakVanRij, type NieuweTaak, type Taak, type TaakWijziging } from './taken'

const KOLOMMEN = 'id, titel, notitie, klaar, klaar_op, datum, top3_positie, aangemaakt_op'

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

function vertaalFout(error: unknown): Reden {
  const code = foutCode(error)
  if (code === UNIEK_GESCHONDEN) return 'bezet'
  if (code === CHECK_GESCHONDEN) return 'ongeldig'
  return 'db'
}

export interface TakenFilter {
  /** Dagsleutel, of `'ooit'` voor de taken zonder dag. Weglaten = alles. */
  datum?: string
  /** Alleen de taken die in de top-3 staan. */
  alleenTop3?: boolean
}

export async function haalTaken(
  admin: SupabaseClient,
  userId: string,
  filter: TakenFilter = {},
): Promise<Uitkomst<Taak[]>> {
  const basis = admin.from('taken').select(KOLOMMEN).eq('user_id', userId)
  const opDatum =
    filter.datum === undefined
      ? basis
      : filter.datum === 'ooit'
        ? basis.is('datum', null)
        : basis.eq('datum', filter.datum)
  const opTop3 = filter.alleenTop3 ? opDatum.not('top3_positie', 'is', null) : opDatum

  const { data, error } = await opTop3
    .order('top3_positie', { ascending: true, nullsFirst: false })
    .order('aangemaakt_op', { ascending: true })

  if (error) return { ok: false, reden: vertaalFout(error) }
  return { ok: true, waarde: takenVanRijen(Array.isArray(data) ? data : []) }
}

export async function maakTaak(
  admin: SupabaseClient,
  userId: string,
  nieuw: NieuweTaak,
): Promise<Uitkomst<Taak>> {
  const { data, error } = await admin
    .from('taken')
    .insert({
      user_id: userId,
      titel: nieuw.titel,
      notitie: nieuw.notitie,
      datum: nieuw.datum,
      top3_positie: nieuw.top3Positie,
    })
    .select(KOLOMMEN)
    .single()

  if (error) return { ok: false, reden: vertaalFout(error) }

  const taak = taakVanRij(data)
  return taak ? { ok: true, waarde: taak } : { ok: false, reden: 'db' }
}

/**
 * Wijzigt alleen de meegestuurde velden.
 *
 * `klaar` en `klaar_op` gaan samen: afvinken zet het moment, uitvinken haalt het
 * weg. Ze uit elkaar laten lopen mag niet van de database (check-constraint), en
 * terecht — anders is "wat heb ik dinsdag afgerond?" een gok.
 */
export async function wijzigTaak(
  admin: SupabaseClient,
  userId: string,
  id: string,
  wijziging: TaakWijziging,
): Promise<Uitkomst<Taak>> {
  const velden: Record<string, unknown> = {}
  if (wijziging.titel !== undefined) velden.titel = wijziging.titel
  if (wijziging.notitie !== undefined) velden.notitie = wijziging.notitie
  if (wijziging.datum !== undefined) velden.datum = wijziging.datum
  if (wijziging.top3Positie !== undefined) velden.top3_positie = wijziging.top3Positie
  if (wijziging.klaar !== undefined) {
    velden.klaar = wijziging.klaar
    velden.klaar_op = wijziging.klaar ? new Date().toISOString() : null
  }

  const { data, error } = await admin
    .from('taken')
    .update(velden)
    .eq('id', id)
    .eq('user_id', userId)
    .select(KOLOMMEN)
    .maybeSingle()

  if (error) return { ok: false, reden: vertaalFout(error) }
  if (!data) return { ok: false, reden: 'niet_gevonden' }

  const taak = taakVanRij(data)
  return taak ? { ok: true, waarde: taak } : { ok: false, reden: 'db' }
}

export async function verwijderTaak(
  admin: SupabaseClient,
  userId: string,
  id: string,
): Promise<Uitkomst<null>> {
  const { data, error } = await admin
    .from('taken')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
    .select('id')
    .maybeSingle()

  if (error) return { ok: false, reden: vertaalFout(error) }
  if (!data) return { ok: false, reden: 'niet_gevonden' }
  return { ok: true, waarde: null }
}
