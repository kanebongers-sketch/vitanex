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

const KOLOMMEN =
  'id, titel, notitie, klaar, klaar_op, datum, top3_positie, impact, inspanning_minuten, energie, deadline, project_id, aangemaakt_op'

/** Postgres: unieke index geschonden. */
const UNIEK_GESCHONDEN = '23505'
/** Postgres: check-constraint geschonden. */
const CHECK_GESCHONDEN = '23514'
/** Postgres: foreign key geschonden — bv. een project dat niet (meer) bestaat. */
const FK_GESCHONDEN = '23503'
/** Postgres: tekst die geen geldig type is — bv. 'abc' als uuid. */
const ONLEESBAAR = '22P02'

export type Reden = 'db' | 'bezet' | 'ongeldig' | 'niet_gevonden'
export type Uitkomst<T> = { ok: true; waarde: T } | { ok: false; reden: Reden }

function foutCode(error: unknown): string | null {
  if (typeof error !== 'object' || error === null || !('code' in error)) return null
  const code = (error as { code: unknown }).code
  return typeof code === 'string' ? code : null
}

/**
 * Postgres-fout → onze reden. Alles wat de gebruiker fout deed wordt 'ongeldig'
 * (→ 400); alleen een echte storing blijft 'db' (→ 502).
 *
 * De FK- en uuid-gevallen staan hier omdat een niet-bestaand project een fout
 * van de invoer is, geen storing. Zonder deze twee regels kreeg je een 502 op
 * je eigen typfout, en dat is een melding die de schuld op de verkeerde plek
 * legt.
 */
function vertaalFout(error: unknown): Reden {
  const code = foutCode(error)
  if (code === UNIEK_GESCHONDEN) return 'bezet'
  if (code === CHECK_GESCHONDEN) return 'ongeldig'
  if (code === FK_GESCHONDEN) return 'ongeldig'
  if (code === ONLEESBAAR) return 'ongeldig'
  return 'db'
}

export interface TakenFilter {
  /** Dagsleutel, of `'ooit'` voor de taken zonder dag. Weglaten = alles. */
  datum?: string
  /** Alleen de taken die in de top-3 staan. */
  alleenTop3?: boolean
  /** Eén project, of `'geen'` voor de taken zonder project. Weglaten = alles. */
  projectId?: string
  /** Alleen taken met een deadline op of vóór deze dagsleutel. */
  deadlineTot?: string
  /** Alleen wat nog open staat. */
  alleenOpen?: boolean
}

export async function haalTaken(
  admin: SupabaseClient,
  userId: string,
  filter: TakenFilter = {},
): Promise<Uitkomst<Taak[]>> {
  // `let` + hertoewijzing: elke filtermethode geeft dezelfde builder terug, dus
  // dit blijft één query. Het type komt uit de initialisatie — geen annotatie,
  // want de generieke typen van PostgREST zijn niet met de hand na te maken.
  let query = admin.from('taken').select(KOLOMMEN).eq('user_id', userId)

  if (filter.datum !== undefined) {
    query = filter.datum === 'ooit' ? query.is('datum', null) : query.eq('datum', filter.datum)
  }
  if (filter.alleenTop3) query = query.not('top3_positie', 'is', null)
  if (filter.projectId !== undefined) {
    query =
      filter.projectId === 'geen'
        ? query.is('project_id', null)
        : query.eq('project_id', filter.projectId)
  }
  // Taken zonder deadline vallen hier bewust buiten: je vroeg om wat er vóór een
  // datum moet, en van een taak zonder deadline weten we dat niet.
  if (filter.deadlineTot !== undefined) query = query.lte('deadline', filter.deadlineTot)
  if (filter.alleenOpen) query = query.eq('klaar', false)

  const { data, error } = await query
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
      // `?? null` en niet weglaten: de vier feiten zijn optioneel bij het
      // aanmaken, en een taak zonder oordeel schrijft expliciet "geen oordeel"
      // weg. Dat is hetzelfde als de default, maar het staat er nu zwart op wit.
      impact: nieuw.impact ?? null,
      inspanning_minuten: nieuw.inspanningMinuten ?? null,
      energie: nieuw.energie ?? null,
      deadline: nieuw.deadline ?? null,
      project_id: nieuw.projectId ?? null,
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
  if (wijziging.impact !== undefined) velden.impact = wijziging.impact
  if (wijziging.inspanningMinuten !== undefined) {
    velden.inspanning_minuten = wijziging.inspanningMinuten
  }
  if (wijziging.energie !== undefined) velden.energie = wijziging.energie
  if (wijziging.deadline !== undefined) velden.deadline = wijziging.deadline
  if (wijziging.projectId !== undefined) velden.project_id = wijziging.projectId
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
