// ─── LifeOS — Google Calendar (lezen + schrijven) ───────────────────────────
// SERVER-ONLY. Hier staan client_secret en tokens; dit bestand mag nooit in een
// client-component belanden.
//
// Geen `googleapis`-dependency: die sleept een halve SDK mee voor een handvol
// HTTP-calls. De REST-API is een paar fetches, en de README is expliciet over
// minimale deps. Het lezen staat hier; het schrijven (maken/wijzigen/verwijderen)
// staat in `schrijven.ts`, dat deze scope en de tokenvernieuwing hergebruikt.
//
// Geverifieerd tegen de officiële docs (juli 2026):
// - OAuth-endpoints + parameters:
//   https://developers.google.com/identity/protocols/oauth2/web-server
// - events.list + Event-resource:
//   https://developers.google.com/calendar/api/v3/reference/events/list
//   https://developers.google.com/calendar/api/v3/reference/events
//
// LEZEN + SCHRIJVEN. LifeOS maakt, wijzigt en verwijdert afspraken (functie 1),
// dus vragen we `calendar.events` — de scope die zowel events.list als
// events.insert/patch/delete dekt. `calendar.readonly` zou je kalenderlijst en
// instellingen erbij geven én kan niet schrijven; `calendar` (volledig beheer
// van álle agenda's) is juist te breed. `calendar.events` is precies genoeg.
//
// ⚠️  Deze scope is BREDER dan de vorige (`calendar.events.readonly`). Google
// verhoogt toestemming niet vanzelf: wie eerder read-only koppelde, moet één
// keer opnieuw koppelen voordat schrijven werkt.

import { leesDatumSleutel } from '@/lib/lifeos/datum/datum'

const AUTORISATIE_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth'
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token'
const EVENTS_ENDPOINT = 'https://www.googleapis.com/calendar/v3/calendars/primary/events'

export const GOOGLE_BEREIK: readonly string[] = Object.freeze([
  'https://www.googleapis.com/auth/calendar.events',
])

const FETCH_TIMEOUT_MS = 10_000
const MAX_PAGINAS = 10

export interface GoogleConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
}

/**
 * De config, of null als de koppeling niet is ingericht. Null is hier geen
 * fout: "geen GOOGLE_CLIENT_ID" betekent gewoon dat deze koppeling uit staat.
 */
export function googleConfig(): GoogleConfig | null {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  // APP_URL, niet de Host-header: die is door de client te zetten, en dan stuur
  // je de autorisatiecode naar de host van een aanvaller. Zie .env.example.
  // Val terug op NEXT_PUBLIC_APP_URL: dat is óók een env-tijd-waarde (geen
  // client-settable Host-header), dus even veilig, en scheelt een dubbele var.
  const appUrl = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL
  if (!clientId || !clientSecret || !appUrl) return null

  return {
    clientId,
    clientSecret,
    redirectUri: `${appUrl.replace(/\/+$/, '')}/api/lifeos/agenda/callback`,
  }
}

/**
 * De URL waar de gebruiker heen gestuurd wordt.
 *
 * - `access_type=offline` + `prompt=consent`: zonder deze twee krijg je bij een
 *   tweede koppeling géén refresh_token terug, en dan is de koppeling na een uur
 *   stil dood.
 * - `state`: HMAC-getekend, zie de callback. Dit is de CSRF-bescherming.
 */
export function autorisatieUrl(config: GoogleConfig, state: string): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: GOOGLE_BEREIK.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    state,
  })
  return `${AUTORISATIE_ENDPOINT}?${params.toString()}`
}

export interface TokenSet {
  toegangstoken: string
  /** Alleen bij de eerste toestemming. Bij een refresh geeft Google 'm niet mee. */
  verversingstoken: string | null
  verlooptOp: Date
  bereik: string[]
}

export type TokenUitkomst =
  | { staat: 'ok'; tokens: TokenSet }
  /** Google wijst de refresh af (`invalid_grant`): toestemming is ingetrokken. */
  | { staat: 'ingetrokken' }
  | { staat: 'fout'; reden: string }

async function vraagToken(body: URLSearchParams): Promise<TokenUitkomst> {
  let antwoord: Response
  try {
    antwoord = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })
  } catch {
    // Netwerkfout is nadrukkelijk GEEN "niet gekoppeld".
    return { staat: 'fout', reden: 'netwerk' }
  }

  const ruw: unknown = await antwoord.json().catch(() => null)

  if (!antwoord.ok) {
    const fout = isObject(ruw) && typeof ruw.error === 'string' ? ruw.error : `http_${antwoord.status}`
    if (fout === 'invalid_grant') return { staat: 'ingetrokken' }
    return { staat: 'fout', reden: fout }
  }

  const tokens = leesTokenAntwoord(ruw)
  if (!tokens) return { staat: 'fout', reden: 'onbegrijpelijk_antwoord' }
  return { staat: 'ok', tokens }
}

/** Autorisatiecode → tokens. */
export function wisselCodeIn(config: GoogleConfig, code: string): Promise<TokenUitkomst> {
  return vraagToken(
    new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      grant_type: 'authorization_code',
    }),
  )
}

/** Refresh-token → nieuw toegangstoken. */
export function vernieuwToken(config: GoogleConfig, verversingstoken: string): Promise<TokenUitkomst> {
  return vraagToken(
    new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: verversingstoken,
      grant_type: 'refresh_token',
    }),
  )
}

// ─── Events ─────────────────────────────────────────────────────────────────

/** Eén afspraak zoals Google 'm geeft, al genormaliseerd naar onze vorm. */
export interface GoogleAfspraak {
  externId: string
  titel: string | null
  startOp: Date
  eindOp: Date | null
  heleDag: boolean
  locatie: string | null
}

export type EventsUitkomst =
  | { staat: 'ok'; events: GoogleAfspraak[] }
  /** 401: het toegangstoken is niet (meer) geldig. */
  | { staat: 'verlopen' }
  | { staat: 'fout'; reden: string }

/**
 * De afspraken tussen `van` en `tot` uit de primaire agenda.
 *
 * `singleEvents=true` klapt herhalende afspraken uit naar losse instanties —
 * zonder dat krijg je de regel ("elke maandag") in plaats van de afspraak, en
 * daar kun je geen vrij blok mee berekenen.
 *
 * `timeMin` is bij Google een ondergrens op de EINDtijd. Een meeting van
 * 07:00-09:00 komt dus gewoon mee in een venster dat om 08:00 begint. Dat is
 * precies wat we willen: hij bezet je ochtend.
 */
export async function haalEvents(toegangstoken: string, van: Date, tot: Date): Promise<EventsUitkomst> {
  const events: GoogleAfspraak[] = []
  let paginaToken: string | null = null

  for (let pagina = 0; pagina < MAX_PAGINAS; pagina++) {
    const params = new URLSearchParams({
      timeMin: van.toISOString(),
      timeMax: tot.toISOString(),
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '250',
      showDeleted: 'false',
    })
    if (paginaToken) params.set('pageToken', paginaToken)

    let antwoord: Response
    try {
      antwoord = await fetch(`${EVENTS_ENDPOINT}?${params.toString()}`, {
        headers: { Authorization: `Bearer ${toegangstoken}` },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      })
    } catch {
      return { staat: 'fout', reden: 'netwerk' }
    }

    if (antwoord.status === 401) return { staat: 'verlopen' }
    if (!antwoord.ok) return { staat: 'fout', reden: `http_${antwoord.status}` }

    const ruw: unknown = await antwoord.json().catch(() => null)
    if (!isObject(ruw)) return { staat: 'fout', reden: 'onbegrijpelijk_antwoord' }

    const items = Array.isArray(ruw.items) ? ruw.items : []
    for (const item of items) {
      const afspraak = leesEvent(item)
      if (afspraak) events.push(afspraak)
    }

    paginaToken = typeof ruw.nextPageToken === 'string' ? ruw.nextPageToken : null
    if (!paginaToken) break
  }

  return { staat: 'ok', events }
}

// ─── Systeemgrens: narrowing van Google's JSON ──────────────────────────────
// Alles hieronder gaat uit van `unknown`. Google mag morgen een veld hernoemen;
// dan slaan we een event over in plaats van een Invalid Date op te slaan.

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function tekst(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const s = v.trim()
  return s.length > 0 ? s : null
}

function leesTokenAntwoord(ruw: unknown): TokenSet | null {
  if (!isObject(ruw)) return null

  const toegangstoken = tekst(ruw.access_token)
  if (!toegangstoken) return null

  // Geen expires_in? Dan gaan we uit van het Google-standaarduur. Bewust
  // conservatief: liever een keer te vroeg verversen dan een dode call.
  const seconden = typeof ruw.expires_in === 'number' && Number.isFinite(ruw.expires_in)
    ? ruw.expires_in
    : 3600

  const bereik = typeof ruw.scope === 'string' ? ruw.scope.split(' ').filter(Boolean) : []

  return {
    toegangstoken,
    verversingstoken: tekst(ruw.refresh_token),
    verlooptOp: new Date(Date.now() + seconden * 1000),
    bereik,
  }
}

/**
 * Eén Event-resource → onze vorm.
 *
 * `start.dateTime` (RFC3339, met offset) = een afspraak met een tijd.
 * `start.date` (YYYY-MM-DD) = een hele-dag-event; dat lezen we als lokale
 * middernacht. Google's `end.date` is exclusief (een event op 15 juli eindigt
 * op de 16e) — dat laten we staan zoals het is: hele-dag-events bezetten toch
 * geen uren (zie `vrije-blokken.ts`).
 */
function leesEvent(ruw: unknown): GoogleAfspraak | null {
  if (!isObject(ruw)) return null
  if (ruw.status === 'cancelled') return null

  const externId = tekst(ruw.id)
  if (!externId) return null

  const start = leesTijdstip(ruw.start)
  if (!start) return null
  const eind = leesTijdstip(ruw.end)

  return {
    externId,
    titel: tekst(ruw.summary),
    startOp: start.op,
    eindOp: eind ? eind.op : null,
    heleDag: start.heleDag,
    locatie: tekst(ruw.location),
  }
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
    const op = leesDatumSleutel(date)
    return op ? { op, heleDag: true } : null
  }

  return null
}
