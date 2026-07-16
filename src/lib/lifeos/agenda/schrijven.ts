// ─── LifeOS — Google Calendar schrijven (functie 1) ─────────────────────────
// SERVER-ONLY. Maakt, wijzigt en verwijdert afspraken in je Google-agenda, en
// houdt de lokale cache (`agenda_events`) idempotent bij.
//
// Geen `googleapis`-dependency: net als `google.ts` zijn dit gewone fetches naar
// de REST-API. De scope (`calendar.events`) en de tokenvernieuwing komen uit
// google.ts / koppeling.ts — dit bestand voegt alleen de schrijf-calls toe.
//
// De service-role client komt als PARAMETER binnen, niet uit een import. LifeOS
// leeft in een EIGEN Supabase-project (zie `@/lib/lifeos/admin`): de route haalt
// die client achter de founder-gate op met `vereisLifeosToegang` en reikt 'm
// hier aan. Zo praat deze module gegarandeerd met de LifeOS-database.
//
// FOUT ≠ GELUKT. Elke functie hier geeft óf het afgesproken resultaat terug, óf
// gooit `AgendaSchrijfFout`. Er is geen tak die bij een Google-fout een leeg of
// "half" resultaat teruggeeft dat op succes lijkt — een mislukte insert mag nooit
// als "afspraak aangemaakt" eindigen. De routes vertalen de fout naar HTTP.
//
// Geverifieerd tegen de officiële docs (juli 2026):
//   events.insert  https://developers.google.com/calendar/api/v3/reference/events/insert
//   events.patch   https://developers.google.com/calendar/api/v3/reference/events/patch
//   events.delete  https://developers.google.com/calendar/api/v3/reference/events/delete

import type { SupabaseClient } from '@supabase/supabase-js'
import { GOOGLE_CALENDAR } from './agenda'
import { geldigToken } from './koppeling'

// Eigen endpoint-constante i.p.v. importeren uit google.ts: die exporteert 'm
// bewust niet (hij hoort bij de read-flow). Dezelfde string, één keer hier.
const EVENTS_ENDPOINT = 'https://www.googleapis.com/calendar/v3/calendars/primary/events'
const FETCH_TIMEOUT_MS = 10_000

export const MAX_TITEL_LENGTE = 1024
export const MAX_LOCATIE_LENGTE = 1024
export const MAX_BESCHRIJVING_LENGTE = 8192

// ─── De vorm over de draad ──────────────────────────────────────────────────

/** Een afspraak zoals `schrijven.ts` 'm teruggeeft. `externId` = Google's event.id. */
export interface AgendaEvent {
  externId: string
  titel: string | null
  /** ISO-moment (UTC). */
  startOp: string
  /** ISO-moment (UTC), of null als Google geen eind gaf. */
  eindOp: string | null
  heleDag: boolean
  locatie: string | null
}

/** Wat `maakAgendaEvent` nodig heeft. `eindOp` is verplicht: een afspraak zonder eind is een gok. */
export interface NieuwAgendaEvent {
  titel: string
  startOp: string
  eindOp: string
  locatie?: string
  beschrijving?: string
}

/**
 * Een deelwijziging. Alleen aanwezige velden veranderen — zo verzet je een
 * afspraak zonder de titel mee te sturen. `null` op locatie/beschrijving wist het
 * veld (Google: leeg-string), `undefined` laat het staan.
 */
export interface EventPatch {
  titel?: string
  startOp?: string
  eindOp?: string
  locatie?: string | null
  beschrijving?: string | null
}

// ─── Fouten ─────────────────────────────────────────────────────────────────

export type SchrijfFoutSoort =
  /** Invoer klopt niet (lege titel, ongeldige ISO, eind vóór start). */
  | 'ongeldig'
  /** Geen (geldige) koppeling meer — opnieuw koppelen is de enige weg terug. */
  | 'niet_gekoppeld'
  /** Token mist de write-scope (403): read-only gekoppeld vóór functie 1. */
  | 'geen_schrijfrecht'
  /** De afspraak bestaat niet (meer) bij Google (404). */
  | 'niet_gevonden'
  /** Google onbereikbaar of een andere onverwachte status. */
  | 'google'

/**
 * De enige fout die dit bestand gooit. Draagt een machine-leesbare `soort` zodat
 * de routes 'm naar de juiste HTTP-status vertalen zonder op tekst te matchen.
 */
export class AgendaSchrijfFout extends Error {
  readonly soort: SchrijfFoutSoort

  constructor(soort: SchrijfFoutSoort, boodschap?: string) {
    super(boodschap ?? soort)
    this.name = 'AgendaSchrijfFout'
    this.soort = soort
  }
}

/**
 * Vertaalt een fout naar HTTP, of null als het geen `AgendaSchrijfFout` is (dan
 * hoort de route 'm door te gooien naar een 500). Puur: geeft data terug, geen
 * `Response` — de route maakt daar het antwoord van.
 */
export function schrijfFoutHttp(fout: unknown): { status: number; bericht: string } | null {
  if (!(fout instanceof AgendaSchrijfFout)) return null

  switch (fout.soort) {
    case 'ongeldig':
      return { status: 400, bericht: fout.message }
    case 'niet_gekoppeld':
      return { status: 409, bericht: 'Je agenda is niet gekoppeld. Koppel opnieuw.' }
    case 'geen_schrijfrecht':
      return {
        status: 403,
        bericht: 'LifeOS heeft nog geen schrijfrechten voor je agenda. Koppel opnieuw.',
      }
    case 'niet_gevonden':
      return { status: 404, bericht: 'Die afspraak bestaat niet (meer).' }
    case 'google':
      return { status: 502, bericht: 'Google is niet bereikbaar.' }
    default: {
      const _uitputtend: never = fout.soort
      return _uitputtend
    }
  }
}

// ─── Publieke API ───────────────────────────────────────────────────────────

/**
 * Maakt een afspraak aan in je primaire Google-agenda en cachet 'm lokaal.
 *
 * De Telegram-agent gebruikt deze functie: `admin` en `userId` komen van de
 * aanroeper, de rest is de afspraak. Gooit `AgendaSchrijfFout` bij elke
 * mislukking — een Google-fout komt dus nooit als een leeg event terug.
 *
 * De lokale cache-upsert is best-effort: lukt Google maar faalt de cache, dan
 * bestáát de afspraak (hij staat in je agenda) en geven we 'm terug; de volgende
 * sync trekt de cache alsnog recht. Dat is dezelfde afweging als in `geldigToken`.
 */
export async function maakAgendaEvent(
  admin: SupabaseClient,
  userId: string,
  invoer: NieuwAgendaEvent,
): Promise<AgendaEvent> {
  const geldig = leesNieuwEvent(invoer)
  if (!geldig.ok) throw new AgendaSchrijfFout('ongeldig', geldig.fout)

  const token = await geldigTokenOfFout(admin, userId)
  const antwoord = await googleFetch('POST', EVENTS_ENDPOINT, token, naarGoogleAanmaakBody(geldig.waarde))
  const event = await leesSchrijfAntwoord(antwoord)

  await bewaarInCache(admin, userId, event)
  return event
}

/** Wijzigt een bestaande afspraak (partieel) en werkt de cache bij. */
export async function wijzigAgendaEvent(
  admin: SupabaseClient,
  userId: string,
  externId: string,
  patch: EventPatch,
): Promise<AgendaEvent> {
  const geldig = leesEventPatch(patch)
  if (!geldig.ok) throw new AgendaSchrijfFout('ongeldig', geldig.fout)

  const token = await geldigTokenOfFout(admin, userId)
  const url = `${EVENTS_ENDPOINT}/${encodeURIComponent(externId)}`
  const antwoord = await googleFetch('PATCH', url, token, naarGooglePatchBody(geldig.waarde))
  const event = await leesSchrijfAntwoord(antwoord)

  await bewaarInCache(admin, userId, event)
  return event
}

/**
 * Verwijdert een afspraak bij Google én uit de cache.
 *
 * 410 (Gone) telt als succes: de gewenste eindstaat is "weg", en die is bereikt.
 * 404 gooit wél — een onbekend id is een echte vergissing van de aanroeper.
 */
export async function verwijderAgendaEvent(
  admin: SupabaseClient,
  userId: string,
  externId: string,
): Promise<void> {
  const token = await geldigTokenOfFout(admin, userId)
  const url = `${EVENTS_ENDPOINT}/${encodeURIComponent(externId)}`
  const antwoord = await googleFetch('DELETE', url, token)

  if (!antwoord.ok && antwoord.status !== 410) keurStatus(antwoord.status)

  await verwijderUitCache(admin, userId, externId)
}

// ─── Google-payload mapping (puur, getest) ──────────────────────────────────

/** ISO-moment → Google's tijdstip-object. Genormaliseerd naar UTC. */
function tijdstipBody(iso: string): { dateTime: string } {
  return { dateTime: new Date(iso).toISOString() }
}

export function naarGoogleAanmaakBody(invoer: NieuwAgendaEvent): Record<string, unknown> {
  const body: Record<string, unknown> = {
    summary: invoer.titel,
    start: tijdstipBody(invoer.startOp),
    end: tijdstipBody(invoer.eindOp),
  }
  if (invoer.locatie) body.location = invoer.locatie
  if (invoer.beschrijving) body.description = invoer.beschrijving
  return body
}

export function naarGooglePatchBody(patch: EventPatch): Record<string, unknown> {
  const body: Record<string, unknown> = {}
  if (patch.titel !== undefined) body.summary = patch.titel
  if (patch.startOp !== undefined) body.start = tijdstipBody(patch.startOp)
  if (patch.eindOp !== undefined) body.end = tijdstipBody(patch.eindOp)
  // null = wissen. Google patch laat een weggelaten veld staan; een lege string
  // maakt het leeg. Zo kun je een locatie bewust weghalen.
  if (patch.locatie !== undefined) body.location = patch.locatie ?? ''
  if (patch.beschrijving !== undefined) body.description = patch.beschrijving ?? ''
  return body
}

// ─── Validatie (systeemgrens, puur, getest) ─────────────────────────────────

export type Validatie<T> = { ok: true; waarde: T } | { ok: false; fout: string }

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function leesTitel(v: unknown): Validatie<string> {
  if (typeof v !== 'string') return { ok: false, fout: 'Titel ontbreekt.' }
  const titel = v.trim()
  if (titel.length === 0) return { ok: false, fout: 'Een afspraak zonder titel is geen afspraak.' }
  if (titel.length > MAX_TITEL_LENGTE) {
    return { ok: false, fout: `Titel mag maximaal ${MAX_TITEL_LENGTE} tekens zijn.` }
  }
  return { ok: true, waarde: titel }
}

/** Een ISO-moment → genormaliseerde UTC-ISO, of een nette fout. */
function leesMoment(v: unknown, veld: string): Validatie<string> {
  if (typeof v !== 'string' || v.trim().length === 0) {
    return { ok: false, fout: `${veld} ontbreekt.` }
  }
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return { ok: false, fout: `${veld} is geen geldige datum/tijd.` }
  return { ok: true, waarde: d.toISOString() }
}

/** Optionele tekst (locatie/beschrijving): leeg → weglaten, te lang → fout. */
function leesTekstOptioneel(v: unknown, veld: string, max: number): Validatie<string | undefined> {
  if (v === null || v === undefined) return { ok: true, waarde: undefined }
  if (typeof v !== 'string') return { ok: false, fout: `${veld} moet tekst zijn.` }
  const tekst = v.trim()
  if (tekst.length === 0) return { ok: true, waarde: undefined }
  if (tekst.length > max) return { ok: false, fout: `${veld} mag maximaal ${max} tekens zijn.` }
  return { ok: true, waarde: tekst }
}

/** Nieuwe afspraak uit onbekende invoer. Faalt met een leesbare melding. */
export function leesNieuwEvent(body: unknown): Validatie<NieuwAgendaEvent> {
  if (!isObject(body)) return { ok: false, fout: 'Ongeldige invoer.' }

  const titel = leesTitel(body.titel)
  if (!titel.ok) return titel
  const startOp = leesMoment(body.startOp, 'Begintijd')
  if (!startOp.ok) return startOp
  const eindOp = leesMoment(body.eindOp, 'Eindtijd')
  if (!eindOp.ok) return eindOp
  if (new Date(eindOp.waarde).getTime() < new Date(startOp.waarde).getTime()) {
    return { ok: false, fout: 'De eindtijd ligt vóór de begintijd.' }
  }
  const locatie = leesTekstOptioneel(body.locatie, 'Locatie', MAX_LOCATIE_LENGTE)
  if (!locatie.ok) return locatie
  const beschrijving = leesTekstOptioneel(body.beschrijving, 'Beschrijving', MAX_BESCHRIJVING_LENGTE)
  if (!beschrijving.ok) return beschrijving

  return {
    ok: true,
    waarde: {
      titel: titel.waarde,
      startOp: startOp.waarde,
      eindOp: eindOp.waarde,
      ...(locatie.waarde !== undefined ? { locatie: locatie.waarde } : {}),
      ...(beschrijving.waarde !== undefined ? { beschrijving: beschrijving.waarde } : {}),
    },
  }
}

/** Deelwijziging uit onbekende invoer. Minstens één veld, en eind ≥ start als beide er zijn. */
export function leesEventPatch(body: unknown): Validatie<EventPatch> {
  if (!isObject(body)) return { ok: false, fout: 'Ongeldige invoer.' }

  const patch: EventPatch = {}

  if ('titel' in body) {
    const titel = leesTitel(body.titel)
    if (!titel.ok) return titel
    patch.titel = titel.waarde
  }
  if ('startOp' in body) {
    const startOp = leesMoment(body.startOp, 'Begintijd')
    if (!startOp.ok) return startOp
    patch.startOp = startOp.waarde
  }
  if ('eindOp' in body) {
    const eindOp = leesMoment(body.eindOp, 'Eindtijd')
    if (!eindOp.ok) return eindOp
    patch.eindOp = eindOp.waarde
  }
  if (patch.startOp !== undefined && patch.eindOp !== undefined) {
    if (new Date(patch.eindOp).getTime() < new Date(patch.startOp).getTime()) {
      return { ok: false, fout: 'De eindtijd ligt vóór de begintijd.' }
    }
  }
  if ('locatie' in body) {
    const locatie = leesTekstOptioneel(body.locatie, 'Locatie', MAX_LOCATIE_LENGTE)
    if (!locatie.ok) return locatie
    // Expliciet null in de body = wissen; een lege/afwezige string ook.
    patch.locatie = locatie.waarde ?? null
  }
  if ('beschrijving' in body) {
    const beschrijving = leesTekstOptioneel(body.beschrijving, 'Beschrijving', MAX_BESCHRIJVING_LENGTE)
    if (!beschrijving.ok) return beschrijving
    patch.beschrijving = beschrijving.waarde ?? null
  }

  if (Object.keys(patch).length === 0) return { ok: false, fout: 'Niets om te wijzigen.' }

  return { ok: true, waarde: patch }
}

// ─── Google-respons narrowen (systeemgrens) ─────────────────────────────────
// Ook de afspraak die we net zelf aanmaakten is een grens: Google beslist over
// het id en normaliseert de tijden. We narrowen 'm dus in plaats van te casten.

function tekst(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const s = v.trim()
  return s.length > 0 ? s : null
}

function leesTijdstip(ruw: unknown): { op: Date; heleDag: boolean } | null {
  if (!isObject(ruw)) return null

  const dateTime = tekst(ruw.dateTime)
  if (dateTime) {
    const op = new Date(dateTime)
    return Number.isNaN(op.getTime()) ? null : { op, heleDag: false }
  }
  const date = tekst(ruw.date)
  if (date) {
    const op = new Date(`${date}T00:00:00`)
    return Number.isNaN(op.getTime()) ? null : { op, heleDag: true }
  }
  return null
}

function leesGoogleEvent(ruw: unknown): AgendaEvent | null {
  if (!isObject(ruw)) return null

  const externId = tekst(ruw.id)
  if (!externId) return null

  const start = leesTijdstip(ruw.start)
  if (!start) return null
  const eind = leesTijdstip(ruw.end)

  return {
    externId,
    titel: tekst(ruw.summary),
    startOp: start.op.toISOString(),
    eindOp: eind ? eind.op.toISOString() : null,
    heleDag: start.heleDag,
    locatie: tekst(ruw.location),
  }
}

// ─── Google-calls ───────────────────────────────────────────────────────────

async function geldigTokenOfFout(admin: SupabaseClient, userId: string): Promise<string> {
  const token = await geldigToken(admin, userId)
  if (token.staat === 'niet_gekoppeld') throw new AgendaSchrijfFout('niet_gekoppeld')
  if (token.staat === 'fout') throw new AgendaSchrijfFout('google', token.reden)
  return token.toegangstoken
}

async function googleFetch(
  method: 'POST' | 'PATCH' | 'DELETE',
  url: string,
  token: string,
  body?: Record<string, unknown>,
): Promise<Response> {
  try {
    return await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })
  } catch {
    // Netwerkfout, timeout, afgebroken — geen "gelukt", en geen "niet gekoppeld".
    throw new AgendaSchrijfFout('google', 'netwerk')
  }
}

/** Vertaalt een niet-ok Google-status naar een `AgendaSchrijfFout`. Gooit altijd. */
function keurStatus(status: number): never {
  if (status === 401) throw new AgendaSchrijfFout('niet_gekoppeld')
  if (status === 403) throw new AgendaSchrijfFout('geen_schrijfrecht')
  if (status === 404) throw new AgendaSchrijfFout('niet_gevonden')
  throw new AgendaSchrijfFout('google', `http_${status}`)
}

/** Gemeenschappelijk voor insert/patch: status keuren, respons narrowen. */
async function leesSchrijfAntwoord(antwoord: Response): Promise<AgendaEvent> {
  if (!antwoord.ok) keurStatus(antwoord.status)

  const ruw: unknown = await antwoord.json().catch(() => null)
  const event = leesGoogleEvent(ruw)
  if (!event) throw new AgendaSchrijfFout('google', 'onbegrijpelijk_antwoord')
  return event
}

// ─── Lokale cache (best-effort) ─────────────────────────────────────────────
// De unieke index (user_id, bron, extern_id) uit migratie 020 maakt dit
// idempotent: dezelfde afspraak twee keer schrijven = één rij, geen dubbele.

async function bewaarInCache(admin: SupabaseClient, userId: string, event: AgendaEvent): Promise<void> {
  const { error } = await admin.from('agenda_events').upsert(
    {
      user_id: userId,
      extern_id: event.externId,
      bron: GOOGLE_CALENDAR,
      titel: event.titel,
      start_op: event.startOp,
      eind_op: event.eindOp,
      hele_dag: event.heleDag,
      locatie: event.locatie,
    },
    { onConflict: 'user_id,bron,extern_id' },
  )

  // De afspraak staat al bij Google; de cache is secundair. Niet gooien — de
  // volgende sync trekt 'm recht. Wél luid loggen, want stil is erger.
  if (error) console.error('[agenda] cache-upsert na schrijven mislukt:', error.message)
}

async function verwijderUitCache(admin: SupabaseClient, userId: string, externId: string): Promise<void> {
  const { error } = await admin
    .from('agenda_events')
    .delete()
    .eq('user_id', userId)
    .eq('bron', GOOGLE_CALENDAR)
    .eq('extern_id', externId)

  if (error) console.error('[agenda] cache-delete na verwijderen mislukt:', error.message)
}
