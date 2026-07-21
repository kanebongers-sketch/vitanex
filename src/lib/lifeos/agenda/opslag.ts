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
    .select('id, titel, start_op, eind_op, hele_dag, locatie, kleur')
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
 * Zet de opgehaalde afspraken (uit ALLE zichtbare agenda's, al gemerged en
 * gekleurd) in de cache en ruim op wat er niet meer hoort.
 *
 * Idempotent: dezelfde sync twee keer draaien levert exact dezelfde rijen op —
 * de unieke index (user_id, bron, extern_id) doet het werk, niet een
 * read-then-write in deze functie. Elk event draagt nu ook zijn `kalender_id` en
 * `kleur`, zodat de weergave weet uit welke agenda het komt en welke kleur het krijgt.
 *
 * `zichtbareIds` = de agenda's die aan staan; `gesyncteIds` = die waarvan de fetch
 * deze ronde ook echt slaagde. Dat onderscheid stuurt de opruiming (zie
 * `ruimVerdwenenOp`): een agenda die je uitzette wordt geleegd, maar een agenda
 * waarvan Google net even niet antwoordde blijft staan — een hik mag je dag niet wissen.
 */
export async function bewaarEvents(
  admin: SupabaseClient,
  userId: string,
  alleEvents: readonly GoogleAfspraak[],
  zichtbareIds: readonly string[],
  gesyncteIds: readonly string[],
  van: Date,
  tot: Date,
): Promise<Uitkomst<number>> {
  // Een event dat eindigt vóór het begint schendt de check-constraint, en dan
  // faalt de HELE upsert — één kapotte afspraak zou je hele sync slopen. Liever
  // die ene overslaan dan de dag verliezen.
  const geldig = alleEvents.filter((e) => !e.eindOp || e.eindOp.getTime() >= e.startOp.getTime())

  // Dedup op extern_id: dezelfde afspraak kan op twee zichtbare agenda's staan (een
  // uitnodiging op je werk- én je privé-agenda). De unieke index laat één rij toe,
  // en Postgres weigert een upsert die diezelfde rij twee keer in één batch raakt.
  // We houden de laatst gemergede versie — dus de kleur van de laatst gesyncte agenda.
  const events = laatstePerExternId(geldig)

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
      kalender_id: e.kalenderId ?? null,
      kleur: e.kleur ?? null,
    }))

    const { error } = await admin
      .from('agenda_events')
      .upsert(rijen, { onConflict: 'user_id,bron,extern_id' })

    if (error) return { ok: false, reden: 'db' }
  }

  const opgeruimd = await ruimVerdwenenOp(admin, userId, events, zichtbareIds, gesyncteIds, van, tot)
  if (!opgeruimd.ok) return opgeruimd

  return { ok: true, waarde: events.length }
}

/**
 * PUUR: dedupliceer events op `externId`, de LAATSTE wint.
 *
 * Zo landt een afspraak die op twee agenda's staat (een uitnodiging) één keer in
 * de cache, met de kleur van de laatst gesyncte agenda — en voorkomen we dat de
 * batch-upsert dezelfde rij twee keer raakt, wat Postgres zou weigeren. Behoudt de
 * volgorde van eerste verschijning niet expliciet; de upsert is orde-onafhankelijk.
 */
export function laatstePerExternId(events: readonly GoogleAfspraak[]): GoogleAfspraak[] {
  const perId = new Map<string, GoogleAfspraak>()
  for (const e of events) perId.set(e.externId, e)
  return [...perId.values()]
}

/** Een cache-rij, beperkt tot wat de opruiming nodig heeft. */
export interface CacheRijRef {
  externId: string
  kalenderId: string | null
  /**
   * Wanneer de rij voor het laatst is bijgewerkt (epoch ms), of null als onbekend.
   * Alleen nodig voor de grace op schrijf-flow-events (kalender_id nog null).
   */
  bijgewerktOp: number | null
}

/**
 * Hoe lang een net via de schrijf-flow aangemaakte afspraak (nog zonder
 * `kalender_id`) blijft staan voordat de sync 'm mag reconcileren.
 *
 * Ruim genoeg voor Google-propagatie + één sync-ronde die 'm alsnog van een echte
 * kalender-id voorziet; kort genoeg dat een in Google verwíjderde afspraak snel uit
 * je dashboard verdwijnt in plaats van eeuwig te blijven hangen.
 */
export const SCHRIJF_GRACE_MS = 2 * 60_000

/**
 * PUUR: welke extern_ids moeten uit het venster weg na een multi-agenda-sync?
 *
 * De gevallen, in volgorde:
 *  1. Nog steeds gezien (deze sync teruggekregen) → HOUDEN.
 *  2. Geen `kalender_id` (via de schrijf-flow gemaakt, nog niet door een sync van
 *     een echte kalender-id voorzien):
 *       - vers (binnen `SCHRIJF_GRACE_MS`) → HOUDEN. Een net gemaakte afspraak mag
 *         niet meteen weggevaagd worden door een sync die Google net voor is.
 *       - voorbij de grace én er is minstens één agenda succesvol gesynct → WEG.
 *         Niet-teruggezien betekent dan: in Google verwijderd of verplaatst. Dit is
 *         de fix voor "via het dashboard gepland, in Google verwijderd, bleef
 *         hangen": zonder deze reconciliatie bleef zo'n rij eeuwig staan.
 *  3. Agenda staat uit / bestaat niet meer (niet in `zichtbareIds`) → WEG. Zo
 *     verdwijnen events van een uitgevinkte agenda uit je dag.
 *  4. Agenda staat aan én is deze ronde succesvol gesynct, maar dit event kwam
 *     niet terug → WEG (afgezegd of verplaatst).
 * Rest: agenda staat aan maar de fetch faalde → HOUDEN. Een Google-hik mag geen
 * events wissen.
 *
 * `nu` (epoch ms) komt van de aanroeper zodat dit deterministisch te testen is —
 * dezelfde afspraak als bij de klok in `intentie.ts`/`vrije-blokken.ts`.
 *
 * Getest zonder database — dit is de riskantste beslissing van de sync.
 */
export function teVerwijderenExternIds(
  rijen: readonly CacheRijRef[],
  geziene: ReadonlySet<string>,
  zichtbareIds: ReadonlySet<string>,
  gesyncteIds: ReadonlySet<string>,
  nu: number,
): string[] {
  const weg: string[] = []
  for (const rij of rijen) {
    if (geziene.has(rij.externId)) continue

    if (rij.kalenderId === null) {
      const vers = rij.bijgewerktOp !== null && nu - rij.bijgewerktOp < SCHRIJF_GRACE_MS
      // Vers houden; en bij een totaal gefaalde sync (niets gesynct) niets wissen.
      if (vers || gesyncteIds.size === 0) continue
      weg.push(rij.externId)
      continue
    }

    if (!zichtbareIds.has(rij.kalenderId)) {
      weg.push(rij.externId)
      continue
    }
    if (gesyncteIds.has(rij.kalenderId)) weg.push(rij.externId)
  }
  return weg
}

/**
 * Weg met wat er niet meer hoort in dit venster: events van uitgevinkte agenda's,
 * en events uit succesvol gesyncte agenda's die niet terugkwamen (afgezegd/verplaatst).
 *
 * Alleen binnen [van, tot) — buiten het gesyncte venster weten we niets, en dan
 * is weggooien een gok.
 *
 * Eerst lezen, dan het verschil verwijderen. Niet "delete waar extern_id NOT IN
 * (alle 200 ids)": die filter reist als querystring naar PostgREST en loopt bij
 * een volle week tegen de URL-limiet aan. In het normale geval is er niets weg te
 * gooien en doen we hier dus helemaal geen delete.
 */
async function ruimVerdwenenOp(
  admin: SupabaseClient,
  userId: string,
  events: readonly GoogleAfspraak[],
  zichtbareIds: readonly string[],
  gesyncteIds: readonly string[],
  van: Date,
  tot: Date,
): Promise<Uitkomst<null>> {
  const { data, error: leesFout } = await admin
    .from('agenda_events')
    .select('extern_id, kalender_id, bijgewerkt_op')
    .eq('user_id', userId)
    .eq('bron', GOOGLE_CALENDAR)
    .gte('start_op', van.toISOString())
    .lt('start_op', tot.toISOString())

  if (leesFout) return { ok: false, reden: 'db' }

  const rijen = (Array.isArray(data) ? data : [])
    .map(cacheRijRefUitRij)
    .filter((r): r is CacheRijRef => r !== null)

  const geziene = new Set(events.map((e) => e.externId))
  const weg = teVerwijderenExternIds(
    rijen,
    geziene,
    new Set(zichtbareIds),
    new Set(gesyncteIds),
    Date.now(),
  )

  if (weg.length === 0) return { ok: true, waarde: null }

  const { error } = await admin
    .from('agenda_events')
    .delete()
    .eq('user_id', userId)
    .eq('bron', GOOGLE_CALENDAR)
    .in('extern_id', weg)

  if (error) return { ok: false, reden: 'db' }
  return { ok: true, waarde: null }
}

/** Systeemgrens: één cache-rij → {externId, kalenderId, bijgewerktOp}, of null als onbruikbaar. */
function cacheRijRefUitRij(rij: unknown): CacheRijRef | null {
  if (typeof rij !== 'object' || rij === null) return null
  const externId = (rij as { extern_id?: unknown }).extern_id
  if (typeof externId !== 'string' || externId.length === 0) return null
  const kalenderId = (rij as { kalender_id?: unknown }).kalender_id
  const bijgewerktRuw = (rij as { bijgewerkt_op?: unknown }).bijgewerkt_op
  const bijgewerktMs = typeof bijgewerktRuw === 'string' ? Date.parse(bijgewerktRuw) : Number.NaN
  return {
    externId,
    kalenderId: typeof kalenderId === 'string' && kalenderId.length > 0 ? kalenderId : null,
    bijgewerktOp: Number.isFinite(bijgewerktMs) ? bijgewerktMs : null,
  }
}
