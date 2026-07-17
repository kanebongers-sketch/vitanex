// ─── LifeOS — Gmail schrijven (functie 2: acties op je post) ────────────────
// SERVER-ONLY. De drie dingen die LifeOS met je mailbox mag doen, en geen vierde:
//
//   maakConcept      — een concept in je Concepten. NOOIT verzonden.
//   wijzigLabels     — labels erop/eraf (archiveer + markeerGelezen zijn hiervan
//                      de twee benoemde gevallen).
//   haalLabels       — de labellijst, om een naam naar een id te vertalen.
//
// ─── WAT HIER NIET STAAT, EN NOOIT MAG KOMEN ────────────────────────────────
// `messages.send` en `drafts.send`. Zoek ze op vóór je iets toevoegt — vind je
// ze, dan is er iets misgegaan. Sinds de scope `gmail.modify` is, houdt Google
// ons niet meer tegen (die scope mág versturen; er bestaat geen scope die drafts
// toestaat en send verbiedt). De grens is dus code-discipline geworden. Zie de
// kop van `gmail.ts` — dat is de eerlijke stand van zaken, geen belofte.
//
// ─── FOUT ≠ GELUKT ──────────────────────────────────────────────────────────
// Elke functie geeft óf het afgesproken resultaat, óf gooit `InboxActieFout`. Er
// is geen tak die bij een Google-fout iets teruggeeft dat op succes lijkt. Exact
// hetzelfde contract als `agenda/schrijven.ts` — met opzet: twee schrijf-lagen
// die anders falen, zijn twee lagen die je apart moet onthouden.
//
// Geverifieerd tegen de officiële docs (juli 2026):
//   drafts.create   https://developers.google.com/gmail/api/reference/rest/v1/users.drafts/create
//   messages.modify https://developers.google.com/gmail/api/reference/rest/v1/users.messages/modify
//   labels.list     https://developers.google.com/gmail/api/reference/rest/v1/users.labels/list

import type { SupabaseClient } from '@supabase/supabase-js'
import { forceerVernieuwing, geldigToken, leesBereik } from './koppeling'
import { beoordeelBereik } from './bereik'
import { GMAIL_SCHRIJF_BEREIK } from './gmail'
import { bouwConceptBericht, type ConceptInvoer } from './concept-bericht'

const DRAFTS_ENDPOINT = 'https://gmail.googleapis.com/gmail/v1/users/me/drafts'
const BERICHTEN_ENDPOINT = 'https://gmail.googleapis.com/gmail/v1/users/me/messages'
const LABELS_ENDPOINT = 'https://gmail.googleapis.com/gmail/v1/users/me/labels'
const FETCH_TIMEOUT_MS = 10_000

/** Gmail's systeemlabels. Stabiele id's — die verzinnen we niet, die zijn zo. */
export const LABEL_INBOX = 'INBOX'
export const LABEL_UNREAD = 'UNREAD'

// ─── Fouten ─────────────────────────────────────────────────────────────────

export type ActieFoutSoort =
  /** Invoer klopt niet. */
  | 'ongeldig'
  /** Geen (geldige) koppeling meer — opnieuw koppelen is de enige weg terug. */
  | 'niet_gekoppeld'
  /** Het token mist de schrijf-scope: read-only gekoppeld vóór deze functie bestond. */
  | 'geen_schrijfrecht'
  /** Het bericht bestaat niet (meer). */
  | 'niet_gevonden'
  /** Gmail onbereikbaar of een andere onverwachte status. */
  | 'google'

/** De enige fout die dit bestand gooit. Draagt een machine-leesbare `soort`. */
export class InboxActieFout extends Error {
  readonly soort: ActieFoutSoort

  constructor(soort: ActieFoutSoort, boodschap?: string) {
    super(boodschap ?? soort)
    this.name = 'InboxActieFout'
    this.soort = soort
  }
}

/** Vertaalt een fout naar HTTP, of null als het geen `InboxActieFout` is (→ 500). */
export function actieFoutHttp(fout: unknown): { status: number; bericht: string } | null {
  if (!(fout instanceof InboxActieFout)) return null

  switch (fout.soort) {
    case 'ongeldig':
      return { status: 400, bericht: fout.message }
    case 'niet_gekoppeld':
      return { status: 409, bericht: 'Gmail is niet gekoppeld. Koppel opnieuw.' }
    case 'geen_schrijfrecht':
      return {
        status: 403,
        bericht:
          'LifeOS mag nog niet in je mailbox schrijven. Koppel Gmail opnieuw — je gaf eerder alleen leesrechten.',
      }
    case 'niet_gevonden':
      return { status: 404, bericht: 'Die mail bestaat niet (meer).' }
    case 'google':
      return { status: 502, bericht: 'Gmail is niet bereikbaar.' }
    default: {
      const _uitputtend: never = fout.soort
      return _uitputtend
    }
  }
}

// ─── Pre-flight: mogen we hier überhaupt schrijven? ─────────────────────────

/**
 * Kijkt vóór de Google-call of deze koppeling schrijfrecht heeft.
 *
 * De winst is een nette melding in plaats van een 403 met
 * "insufficientPermissions". Kane's bestaande koppeling heeft `gmail.readonly` —
 * zonder deze check klikt hij op "concept maken" en krijgt hij een Google-fout
 * waar geen aanwijzing in zit.
 *
 * Bij 'onbekend' (geen bereik opgeslagen) doen we NIETS en laten we Google
 * beslissen: een leeg veld bewijst geen afwezige rechten, en Kane wegsturen voor
 * een koppeling die werkt is de duurdere fout. Zijn 403 komt dan alsnog als
 * `geen_schrijfrecht` terug met exact dezelfde melding — we hebben dan één
 * round-trip gebruikt om iets te weten te komen dat we niet wisten. Zie `bereik.ts`.
 */
async function eisSchrijfrecht(admin: SupabaseClient, userId: string): Promise<void> {
  const bereik = await leesBereik(admin, userId)
  if (bereik.staat === 'niet_gekoppeld') throw new InboxActieFout('niet_gekoppeld')
  if (bereik.staat === 'fout') throw new InboxActieFout('google', bereik.reden)

  const oordeel = beoordeelBereik(bereik.bereik, GMAIL_SCHRIJF_BEREIK)
  if (oordeel.soort === 'te_weinig') throw new InboxActieFout('geen_schrijfrecht')
}

// ─── Google-calls ───────────────────────────────────────────────────────────

/** Vertaalt een niet-ok Gmail-status naar een `InboxActieFout`. Gooit altijd. */
function keurStatus(status: number): never {
  if (status === 401) throw new InboxActieFout('niet_gekoppeld')
  if (status === 403) throw new InboxActieFout('geen_schrijfrecht')
  if (status === 404) throw new InboxActieFout('niet_gevonden')
  throw new InboxActieFout('google', `http_${status}`)
}

async function gmailFetch(
  method: 'GET' | 'POST',
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
    throw new InboxActieFout('google', 'netwerk')
  }
}

/** Een bruikbaar token, of een `InboxActieFout`. Spiegelt `geldigTokenOfFout` in agenda/schrijven.ts. */
async function tokenOfFout(admin: SupabaseClient, userId: string): Promise<string> {
  const token = await geldigToken(admin, userId)
  if (token.staat === 'niet_gekoppeld') throw new InboxActieFout('niet_gekoppeld')
  if (token.staat === 'fout') throw new InboxActieFout('google', token.reden)
  return token.toegangstoken
}

/** Een vers ververst token, of een `InboxActieFout`. Netwerkfout blijft `google`, geen `niet_gekoppeld`. */
async function versTokenOfFout(admin: SupabaseClient, userId: string): Promise<string> {
  const vers = await forceerVernieuwing(admin, userId)
  if (vers.staat === 'niet_gekoppeld') throw new InboxActieFout('niet_gekoppeld')
  if (vers.staat === 'fout') throw new InboxActieFout('google', vers.reden)
  return vers.toegangstoken
}

/**
 * Eén Gmail-call, met precies één tweede kans bij een 401 mid-flight.
 *
 * `geldigToken` ververst PROACTIEF (2 minuten marge). Dat dekt het normale geval
 * en niet het echte: een token dat volgens onze administratie nog 40 minuten
 * goed is, maar dat Gmail weigert omdat de toestemming is ingetrokken, het
 * wachtwoord is gewijzigd, of het consent-scherm in "Testing" staat (dan verloopt
 * het refresh-token na 7 dagen). Zonder deze retry kreeg Kane dan "koppel
 * opnieuw" terwijl één refresh het had opgelost.
 *
 * Precies één keer, geen lus: is het token ná een verse refresh nóg steeds niet
 * goed genoeg, dan is de toestemming echt weg en is opnieuw koppelen het juiste
 * antwoord. Een tweede poging zou alleen de latency verdubbelen.
 *
 * De discipline blijft: `forceerVernieuwing` geeft `fout` bij netwerkproblemen en
 * alleen `niet_gekoppeld` bij een echte intrekking. Een hik bij Google mag nooit
 * als "niet gekoppeld" eindigen.
 */
async function metVersToken(
  admin: SupabaseClient,
  userId: string,
  doe: (token: string) => Promise<Response>,
): Promise<Response> {
  const eerste = await doe(await tokenOfFout(admin, userId))
  if (eerste.status !== 401) return eerste

  return doe(await versTokenOfFout(admin, userId))
}

// ─── Systeemgrens: Gmail's antwoorden narrowen ──────────────────────────────

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function tekst(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const s = v.trim()
  return s.length > 0 ? s : null
}

// ─── Publieke API ───────────────────────────────────────────────────────────

/** Een aangemaakt concept. `id` is Gmail's draft-id, niet het message-id. */
export interface Concept {
  id: string
  /** Handig voor een deeplink naar het concept; null als Gmail 'm niet gaf. */
  berichtId: string | null
}

/**
 * Maakt een CONCEPT in je Gmail. Verstuurt niets.
 *
 * Er is bewust geen `verstuur`-variant en die hoort er nooit te komen: een mail
 * die namens Kane weggaat zonder dat hij 'm zag, kun je niet terugnemen. Het
 * concept staat in je Concepten; jij drukt op verzenden.
 */
export async function maakConcept(
  admin: SupabaseClient,
  userId: string,
  invoer: ConceptInvoer,
): Promise<Concept> {
  await eisSchrijfrecht(admin, userId)

  const body: Record<string, unknown> = {
    message: {
      raw: bouwConceptBericht(invoer),
      ...(invoer.threadId ? { threadId: invoer.threadId } : {}),
    },
  }

  const antwoord = await metVersToken(admin, userId, (token) =>
    gmailFetch('POST', DRAFTS_ENDPOINT, token, body),
  )
  if (!antwoord.ok) keurStatus(antwoord.status)

  const ruw: unknown = await antwoord.json().catch(() => null)
  if (!isObject(ruw)) throw new InboxActieFout('google', 'onbegrijpelijk_antwoord')

  const id = tekst(ruw.id)
  if (!id) throw new InboxActieFout('google', 'onbegrijpelijk_antwoord')

  const bericht = isObject(ruw.message) ? tekst(ruw.message.id) : null
  return { id, berichtId: bericht }
}

export interface LabelWijziging {
  toevoegen?: readonly string[]
  verwijderen?: readonly string[]
}

/**
 * Zet labels op een bericht of haalt ze eraf.
 *
 * De basis onder archiveren en gelezen-markeren: in Gmail zijn dat allebei geen
 * eigen operaties maar labelwijzigingen. Ook een eigen label zetten loopt hier
 * langs — geef dan het label-ID mee (zie `haalLabels`).
 */
export async function wijzigLabels(
  admin: SupabaseClient,
  userId: string,
  berichtId: string,
  wijziging: LabelWijziging,
): Promise<void> {
  const toevoegen = wijziging.toevoegen ?? []
  const verwijderen = wijziging.verwijderen ?? []
  if (toevoegen.length === 0 && verwijderen.length === 0) {
    throw new InboxActieFout('ongeldig', 'Niets om te wijzigen.')
  }

  await eisSchrijfrecht(admin, userId)

  const url = `${BERICHTEN_ENDPOINT}/${encodeURIComponent(berichtId)}/modify`
  const antwoord = await metVersToken(admin, userId, (token) =>
    gmailFetch('POST', url, token, {
      ...(toevoegen.length > 0 ? { addLabelIds: [...toevoegen] } : {}),
      ...(verwijderen.length > 0 ? { removeLabelIds: [...verwijderen] } : {}),
    }),
  )

  if (!antwoord.ok) keurStatus(antwoord.status)
}

/**
 * Archiveert een mail: het INBOX-label eraf.
 *
 * Archiveren is in Gmail geen verwijderen — de mail blijft bestaan en is met
 * zoeken terug te vinden. Dat is precies waarom dit mag en verwijderen niet:
 * `gmail.modify` kan überhaupt niet permanent verwijderen, en dat is hier een
 * kenmerk en geen beperking.
 */
export function archiveer(admin: SupabaseClient, userId: string, berichtId: string): Promise<void> {
  return wijzigLabels(admin, userId, berichtId, { verwijderen: [LABEL_INBOX] })
}

/** Markeert een mail als gelezen: het UNREAD-label eraf. */
export function markeerGelezen(
  admin: SupabaseClient,
  userId: string,
  berichtId: string,
): Promise<void> {
  return wijzigLabels(admin, userId, berichtId, { verwijderen: [LABEL_UNREAD] })
}

export interface GmailLabel {
  id: string
  naam: string
}

/**
 * De labels van je mailbox, om een naam naar een id te vertalen.
 *
 * `messages.modify` wil id's, geen namen. Dit endpoint is de enige manier om
 * "Facturen" naar `Label_42` te krijgen — Gmail's id's zijn niet af te leiden uit
 * de naam. Alleen lezen; het maakt zelf geen labels aan.
 */
export async function haalLabels(admin: SupabaseClient, userId: string): Promise<GmailLabel[]> {
  const antwoord = await metVersToken(admin, userId, (token) =>
    gmailFetch('GET', LABELS_ENDPOINT, token),
  )
  if (!antwoord.ok) keurStatus(antwoord.status)

  const ruw: unknown = await antwoord.json().catch(() => null)
  if (!isObject(ruw)) throw new InboxActieFout('google', 'onbegrijpelijk_antwoord')

  const items = Array.isArray(ruw.labels) ? ruw.labels : []
  return items
    .map((l: unknown): GmailLabel | null => {
      if (!isObject(l)) return null
      const id = tekst(l.id)
      const naam = tekst(l.name)
      return id !== null && naam !== null ? { id, naam } : null
    })
    .filter((l): l is GmailLabel => l !== null)
}
