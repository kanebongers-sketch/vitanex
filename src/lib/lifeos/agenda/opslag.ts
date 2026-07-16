// ─── LifeOS — agenda-cache (agenda_events) ──────────────────────────────────
// SERVER-ONLY. Alle databasetoegang voor de agenda staat hier, zodat de routes
// dun blijven: auth, wat vragen, antwoord vormgeven.
//
// `agenda_events` is een CACHE, geen bron. Google blijft de waarheid; wat hier
// staat mag altijd weggegooid en opnieuw opgehaald worden. Daarom mag de sync
// ook rijen verwijderen die Google niet meer teruggeeft: een afgezegde meeting
// hoort niet in je dag te blijven staan.

// De service-role client komt als PARAMETER binnen, niet uit een import. LifeOS
// leeft in een EIGEN Supabase-project (zie `@/lib/lifeos/admin`): de route haalt
// die client achter de founder-gate op met `vereisLifeosToegang` en reikt 'm
// hier aan. Zo praat deze module gegarandeerd met de LifeOS-database.
import type { SupabaseClient } from '@supabase/supabase-js'
import { afsprakenVanRijen, GOOGLE_CALENDAR } from './agenda'
import type { Afspraak } from './vrije-blokken'
import type { GoogleAfspraak } from './google'

export type Uitkomst<T> = { ok: true; waarde: T } | { ok: false; reden: string }

/**
 * De afspraken die het venster [van, tot) raken.
 *
 * Let op de `or`: een meeting van 07:00-09:00 begint vóór het venster maar loopt
 * erin door. Alleen op `start_op` filteren zou 'm laten vallen, en dan zegt
 * LifeOS dat je ochtend vrij is terwijl je in een meeting zit.
 */
export async function haalEventsUitCache(
  admin: SupabaseClient,
  userId: string,
  van: Date,
  tot: Date,
): Promise<Uitkomst<Afspraak[]>> {
  const { data, error } = await admin
    .from('agenda_events')
    .select('id, titel, start_op, eind_op, hele_dag, locatie')
    .eq('user_id', userId)
    .lt('start_op', tot.toISOString())
    .or(`eind_op.gte.${van.toISOString()},eind_op.is.null`)
    .order('start_op', { ascending: true })

  if (error) return { ok: false, reden: 'db' }
  return { ok: true, waarde: afsprakenVanRijen(Array.isArray(data) ? data : []) }
}

/**
 * Wanneer de cache voor het laatst gevuld is, of null als dat nooit gebeurde.
 *
 * Dit is het verschil tussen "je hebt vandaag niets" en "ik heb nog niet
 * gekeken". Zonder dit onderscheid zou een verse koppeling een lege dag tonen
 * die niemand heeft opgehaald.
 */
export async function laatsteSync(
  admin: SupabaseClient,
  userId: string,
): Promise<Uitkomst<string | null>> {
  const { data, error } = await admin
    .from('agenda_events')
    .select('bijgewerkt_op')
    .eq('user_id', userId)
    .order('bijgewerkt_op', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) return { ok: false, reden: 'db' }

  const rij: unknown = data
  const op =
    typeof rij === 'object' && rij !== null && 'bijgewerkt_op' in rij
      ? (rij as { bijgewerkt_op: unknown }).bijgewerkt_op
      : null

  return { ok: true, waarde: typeof op === 'string' ? op : null }
}

/**
 * Zet de opgehaalde afspraken in de cache en ruim op wat Google niet meer geeft.
 *
 * Idempotent: dezelfde sync twee keer draaien levert exact dezelfde rijen op —
 * de unieke index (user_id, bron, extern_id) doet het werk, niet een
 * read-then-write in deze functie.
 */
export async function bewaarEvents(
  admin: SupabaseClient,
  userId: string,
  alleEvents: readonly GoogleAfspraak[],
  van: Date,
  tot: Date,
): Promise<Uitkomst<number>> {
  // Een event dat eindigt vóór het begint schendt de check-constraint, en dan
  // faalt de HELE upsert — één kapotte afspraak zou je hele sync slopen. Liever
  // die ene overslaan dan de dag verliezen.
  const events = alleEvents.filter((e) => !e.eindOp || e.eindOp.getTime() >= e.startOp.getTime())

  if (events.length > 0) {
    const rijen = events.map((e) => ({
      user_id: userId,
      extern_id: e.externId,
      bron: GOOGLE_CALENDAR,
      titel: e.titel,
      start_op: e.startOp.toISOString(),
      eind_op: e.eindOp ? e.eindOp.toISOString() : null,
      hele_dag: e.heleDag,
      locatie: e.locatie,
    }))

    const { error } = await admin
      .from('agenda_events')
      .upsert(rijen, { onConflict: 'user_id,bron,extern_id' })

    if (error) return { ok: false, reden: 'db' }
  }

  const opgeruimd = await ruimVerdwenenOp(admin, userId, events, van, tot)
  if (!opgeruimd.ok) return opgeruimd

  return { ok: true, waarde: events.length }
}

/**
 * Weg met wat Google in dit venster niet meer teruggeeft: afgezegd of verplaatst.
 *
 * Alleen binnen [van, tot) — buiten het gesyncte venster weten we niets, en dan
 * is weggooien een gok.
 *
 * Eerst lezen, dan het verschil verwijderen. Niet "delete waar extern_id NOT IN
 * (alle 200 ids)": die filter reist als querystring naar PostgREST en loopt bij
 * een volle week tegen de URL-limiet aan. In het normale geval is er niets
 * afgezegd en doen we hier dus helemaal geen delete.
 */
async function ruimVerdwenenOp(
  admin: SupabaseClient,
  userId: string,
  events: readonly GoogleAfspraak[],
  van: Date,
  tot: Date,
): Promise<Uitkomst<null>> {
  const { data, error: leesFout } = await admin
    .from('agenda_events')
    .select('extern_id')
    .eq('user_id', userId)
    .eq('bron', GOOGLE_CALENDAR)
    .gte('start_op', van.toISOString())
    .lt('start_op', tot.toISOString())

  if (leesFout) return { ok: false, reden: 'db' }

  const gezien = new Set(events.map((e) => e.externId))
  const verdwenen = (Array.isArray(data) ? data : [])
    .map((rij: unknown) =>
      typeof rij === 'object' && rij !== null && 'extern_id' in rij
        ? (rij as { extern_id: unknown }).extern_id
        : null,
    )
    .filter((id): id is string => typeof id === 'string' && !gezien.has(id))

  if (verdwenen.length === 0) return { ok: true, waarde: null }

  const { error } = await admin
    .from('agenda_events')
    .delete()
    .eq('user_id', userId)
    .eq('bron', GOOGLE_CALENDAR)
    .in('extern_id', verdwenen)

  if (error) return { ok: false, reden: 'db' }
  return { ok: true, waarde: null }
}
