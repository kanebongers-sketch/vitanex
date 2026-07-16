// ─── LifeOS — Gmail (alleen lezen, alleen metadata) ─────────────────────────
// SERVER-ONLY. Hier staan client_secret en tokens; dit bestand mag nooit in een
// client-component belanden.
//
// Geverifieerd tegen de officiële docs (juli 2026):
// - Scopes + classificatie:  https://developers.google.com/gmail/api/auth/scopes
// - messages.list:           https://developers.google.com/gmail/api/reference/rest/v1/users.messages/list
// - messages.get + format:   https://developers.google.com/gmail/api/reference/rest/v1/users.messages/get
// - getProfile:              https://developers.google.com/gmail/api/reference/rest/v1/users/getProfile
// - Zoekoperatoren (is:unread, newer_than:1d, in:inbox):
//                            https://support.google.com/mail/answer/7190
//
// ─── DE TWEE GRENZEN ────────────────────────────────────────────────────────
//
// 1. ALLEEN LEZEN. We vragen `gmail.readonly` en niets meer. Geen send, geen
//    compose, geen modify. LifeOS verstuurt nooit een mail, markeert nooit iets
//    als gelezen en archiveert nooit iets. Dat is geen belofte in een comment
//    maar een gevolg: zonder die scopes kán het niet, ook niet per ongeluk.
//
// 2. NOOIT DE INHOUD. `gmail.readonly` mág de body lezen — wij vragen 'm alleen
//    nooit op: elke messages.get gaat met `format=METADATA` en een expliciete
//    lijst headers. Dat is code-discipline, en code-discipline erodeert. Wie hier
//    ooit `format=FULL` neerzet, haalt in één regel de hele inhoud van andermans
//    post je systeem in. Doe dat niet — lees eerst README §10.
//
//    De smallere `gmail.metadata`-scope zou dat op Google's niveau afdwingen in
//    plaats van op de onze, maar kan géén `q`-queryparameter gebruiken (zie de
//    scope-docs). Dan vervalt `is:unread newer_than:1d` en moeten we de hele
//    INBOX pagineren en lokaal filteren. Beide scopes zijn even "restricted",
//    dus het scheelt niets in verificatie. Afweging staat in het rapport; als
//    Kane 'm wil omzetten is dit de plek.

import { googleConfig, type GoogleConfig } from '@/lib/lifeos/agenda/google'
import { leesMailMeta, type Header } from './headers'
import type { MailMeta } from './classificeer'

const AUTORISATIE_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth'
const BERICHTEN_ENDPOINT = 'https://gmail.googleapis.com/gmail/v1/users/me/messages'
const PROFIEL_ENDPOINT = 'https://gmail.googleapis.com/gmail/v1/users/me/profile'

/**
 * ALLEEN LEZEN. Deze lijst groeit niet.
 *
 * Let op: Google rekent élke Gmail-scope tot de "restricted" categorie —
 * `gmail.metadata` net zo goed als `gmail.readonly`. Er is dus geen smallere
 * variant die de verificatie-eis ontloopt. Zie het rapport / .env.example.
 */
export const GMAIL_BEREIK: readonly string[] = Object.freeze([
  'https://www.googleapis.com/auth/gmail.readonly',
])

/**
 * Precies de headers die de classificatie nodig heeft, en geen enkele meer.
 *
 * Elke naam hier is te verantwoorden:
 *   From             — wie het stuurt (naam tonen, no-reply herkennen)
 *   To               — één ja/nee-vraag: stond ik in de aan? Daarna losgelaten.
 *   Subject          — de regel die je in de kaart ziet
 *   List-Unsubscribe — de nieuwsbrief-heuristiek
 *   Precedence       — de bulk-heuristiek
 *
 * Er staat geen `Cc` in: we vragen niet of je in de cc staat, alleen of je in de
 * `aan` staat. De cc-adressen van derden hoeven we dus niet eens op te halen.
 */
const METADATA_HEADERS: readonly string[] = Object.freeze([
  'From',
  'To',
  'Subject',
  'List-Unsubscribe',
  'Precedence',
])

const FETCH_TIMEOUT_MS = 10_000

/**
 * Hoeveel mails we maximaal bekijken.
 *
 * Quota (geverifieerd, https://developers.google.com/gmail/api/reference/quota,
 * limieten van 1 mei 2026): 6.000 eenheden per minuut per gebruiker. getProfile
 * kost 1, messages.list 5, messages.get 20. Eén triage is dus
 * 1 + 5 + 40×20 = 806 eenheden — ruim binnen de minuutlimiet, ook als je de kaart
 * een paar keer per avond ververst.
 *
 * 40 is óók een inhoudelijke grens: liggen er meer dan 40 ongelezen mails van
 * vandaag, dan is "open Gmail" het juiste antwoord en niet een langere lijst.
 */
const MAX_BERICHTEN = 40

/**
 * Hoeveel messages.get-calls tegelijk.
 *
 * Het quotum is per minuut, niet per seconde, dus een blok van 8 (160 eenheden)
 * is geen probleem — dit is puur om niet 40 sockets tegelijk open te trekken.
 * Loopt het toch tegen een 429 aan, dan wordt dat bericht overgeslagen en geteld
 * als `nietGelezen`; de kaart zegt het dan, in plaats van 'm stil te laten vallen.
 */
const BLOKGROOTTE = 8

/**
 * Ongelezen, in de inbox, van ongeveer de laatste dag.
 *
 * Operatoren geverifieerd (https://support.google.com/mail/answer/7190), maar de
 * exacte grens van `newer_than:1d` documenteert Google niet: het kan "24 uur
 * geleden" of "sinds gisteren 00:00" betekenen. Bewust NIET dichtgetimmerd met
 * een eigen filter op `internalDate`: dan zou een mail van 25 uur oud die nog
 * ongelezen is en iets van je vraagt alsnog verdwijnen. Het venster mag ruim
 * uitvallen — te veel tonen kost een blik, te weinig tonen kost je een deadline.
 */
const ZOEKOPDRACHT = 'is:unread in:inbox newer_than:1d'

/**
 * De Gmail-config: dezelfde Google-client als de agenda, andere redirect.
 *
 * Hergebruikt `googleConfig()` zodat het lezen van GOOGLE_CLIENT_ID/SECRET/APP_URL
 * en de "niet ingericht = null"-afspraak op één plek staan. Alleen de redirect
 * wijkt af: die moet per route uniek zijn en exact matchen met wat er in de
 * Google Cloud Console geregistreerd staat.
 */
export function gmailConfig(): GoogleConfig | null {
  const basis = googleConfig()
  if (!basis) return null

  const appUrl = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL
  if (!appUrl) return null

  return { ...basis, redirectUri: `${appUrl.replace(/\/+$/, '')}/api/lifeos/inbox/callback` }
}

/**
 * De URL waar de gebruiker heen gestuurd wordt.
 *
 * Niet `agenda/google.ts#autorisatieUrl` hergebruikt: die heeft `GOOGLE_BEREIK`
 * (de agenda-scope) ingebakken en zou dus een agenda-toestemming vragen. De
 * scope hoort een parameter te zijn — dat is een refactor in `agenda/*`, en die
 * map is niet van deze functie. Wat wél gedeeld is, is het deel dat je niet wilt
 * dupliceren: `wisselCodeIn` en `vernieuwToken` (zie `koppeling.ts`).
 *
 * `access_type=offline` + `prompt=consent`: zonder die twee krijg je bij een
 * tweede koppeling geen refresh_token en is de koppeling na een uur stil dood.
 *
 * `include_granted_scopes` staat hier bewust NIET aan (anders dan bij de agenda):
 * dat zou de agenda-scope mee-incrementeren in het Gmail-token. Deze koppeling
 * hoort precies één ding te mogen.
 */
export function autorisatieUrl(config: GoogleConfig, state: string): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: GMAIL_BEREIK.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    state,
  })
  return `${AUTORISATIE_ENDPOINT}?${params.toString()}`
}

export type ProfielUitkomst =
  | { staat: 'ok'; adres: string }
  /** 401: het toegangstoken is niet (meer) geldig. */
  | { staat: 'verlopen' }
  | { staat: 'fout'; reden: string }

export type MailsUitkomst =
  | {
      staat: 'ok'
      mails: MailMeta[]
      /**
       * Berichten waarvan Gmail wél het id gaf, maar de metadata niet.
       *
       * Dit getal mag niet verdwijnen. Sterft het netwerk halverwege, dan faalt
       * elke volgende messages.get en zouden we hier vrolijk `ok` met drie mails
       * teruggeven — waarna de kaart "1 van de 3" zegt terwijl er 40 lagen. Dat
       * is precies het stille fout-negatief dat deze functie niet mag hebben, dus
       * telt de UI ze apart en zegt het eerlijk.
       */
      nietGelezen: number
    }
  | { staat: 'verlopen' }
  | { staat: 'fout'; reden: string }

/** `verlopen` en `fout` zijn overal hetzelfde; alleen de geslaagde tak verschilt. */
type Mislukt = { staat: 'verlopen' } | { staat: 'fout'; reden: string }

type IdsUitkomst = { staat: 'ok'; ids: string[] } | Mislukt
type BerichtUitkomst = { staat: 'ok'; mail: MailMeta } | Mislukt

// ─── Systeemgrens: narrowing van Gmail's JSON ───────────────────────────────
// Alles hieronder gaat uit van `unknown`. Google mag morgen een veld hernoemen;
// dan slaan we een bericht over in plaats van een Invalid Date door te geven.

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function tekst(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const s = v.trim()
  return s.length > 0 ? s : null
}

type Antwoord = { staat: 'ok'; ruw: unknown } | { staat: 'verlopen' } | { staat: 'fout'; reden: string }

/** Eén GET met Bearer-token. Fout, verlopen en ok zijn hier al uit elkaar. */
async function haal(url: string, toegangstoken: string): Promise<Antwoord> {
  let antwoord: Response
  try {
    antwoord = await fetch(url, {
      headers: { Authorization: `Bearer ${toegangstoken}` },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })
  } catch {
    // Netwerkfout is nadrukkelijk GEEN "geen mail".
    return { staat: 'fout', reden: 'netwerk' }
  }

  if (antwoord.status === 401) return { staat: 'verlopen' }
  // 403 met reden `insufficientPermissions` betekent meestal: de gebruiker heeft
  // het vinkje voor de Gmail-scope weggehaald. Dat is een fout, geen lege inbox.
  if (!antwoord.ok) return { staat: 'fout', reden: `http_${antwoord.status}` }

  const ruw: unknown = await antwoord.json().catch(() => null)
  return { staat: 'ok', ruw }
}

/**
 * Welk adres is dit postvak?
 *
 * Nodig voor de `aanMij`-vraag: zonder je eigen adres kun je "aan mij" niet van
 * "in de cc" onderscheiden, en dan valt de halve triage om. Dit is jouw eigen
 * adres — het enige adres dat LifeOS bewust vasthoudt, en alleen voor de duur
 * van dit request.
 */
export async function haalProfiel(toegangstoken: string): Promise<ProfielUitkomst> {
  const antwoord = await haal(PROFIEL_ENDPOINT, toegangstoken)
  if (antwoord.staat !== 'ok') return antwoord

  if (!isObject(antwoord.ruw)) return { staat: 'fout', reden: 'onbegrijpelijk_antwoord' }
  const adres = tekst(antwoord.ruw.emailAddress)
  if (!adres) return { staat: 'fout', reden: 'geen_adres' }

  return { staat: 'ok', adres }
}

/** De id's van ongelezen mail van vandaag. Eén pagina: `MAX_BERICHTEN` is de grens. */
async function haalIds(toegangstoken: string): Promise<IdsUitkomst> {
  const params = new URLSearchParams({
    q: ZOEKOPDRACHT,
    maxResults: String(MAX_BERICHTEN),
  })

  const antwoord = await haal(`${BERICHTEN_ENDPOINT}?${params.toString()}`, toegangstoken)
  if (antwoord.staat !== 'ok') return antwoord

  if (!isObject(antwoord.ruw)) return { staat: 'fout', reden: 'onbegrijpelijk_antwoord' }

  // Geen `messages`-veld = geen resultaten. Gmail laat het veld dan weg; dat is
  // een lege inbox en geen kapot antwoord.
  if (antwoord.ruw.messages === undefined) return { staat: 'ok', ids: [] }
  if (!Array.isArray(antwoord.ruw.messages)) return { staat: 'fout', reden: 'onbegrijpelijk_antwoord' }

  const ids = antwoord.ruw.messages
    .map((m: unknown) => (isObject(m) ? tekst(m.id) : null))
    .filter((id): id is string => id !== null)

  return { staat: 'ok', ids }
}

/** Eén bericht → metadata. Nooit de body: `format=METADATA` + een vaste headerlijst. */
async function haalBericht(
  toegangstoken: string,
  id: string,
  mijnAdres: string,
): Promise<BerichtUitkomst> {
  const params = new URLSearchParams({ format: 'METADATA' })
  for (const h of METADATA_HEADERS) params.append('metadataHeaders', h)

  const antwoord = await haal(
    `${BERICHTEN_ENDPOINT}/${encodeURIComponent(id)}?${params.toString()}`,
    toegangstoken,
  )
  if (antwoord.staat !== 'ok') return antwoord

  const ruw = antwoord.ruw
  if (!isObject(ruw)) return { staat: 'fout', reden: 'onbegrijpelijk_antwoord' }

  // `internalDate` is Gmail's eigen ontvangstmoment (epoch-ms als string), niet
  // de `Date`-header die de afzender zelf zet. Een verkeerd ingestelde klok aan
  // de andere kant mag ons venster niet verzieken.
  const internalDate = tekst(ruw.internalDate)
  const ms = internalDate === null ? Number.NaN : Number(internalDate)
  if (!Number.isFinite(ms)) return { staat: 'fout', reden: 'geen_datum' }

  const payload = isObject(ruw.payload) ? ruw.payload : null
  const ruweHeaders = payload && Array.isArray(payload.headers) ? payload.headers : []
  const headers: Header[] = ruweHeaders
    .map((h: unknown): Header | null => {
      if (!isObject(h)) return null
      const name = tekst(h.name)
      const value = typeof h.value === 'string' ? h.value : null
      return name !== null && value !== null ? { name, value } : null
    })
    .filter((h): h is Header => h !== null)

  const labels = Array.isArray(ruw.labelIds)
    ? ruw.labelIds.filter((l: unknown): l is string => typeof l === 'string')
    : []

  // Let op wat hier NIET gebeurt: `ruw.snippet` wordt niet gelezen. Gmail stuurt
  // bij format=METADATA een snippet mee — een stukje body-tekst. Wij lezen het
  // veld niet, dus het komt niet verder dan deze functie. Ga het niet alsnog
  // uitpakken "omdat het er toch al is".
  return { staat: 'ok', mail: leesMailMeta(id, headers, labels, new Date(ms), mijnAdres) }
}

/**
 * De ongelezen mail van vandaag, als metadata.
 *
 * messages.list geeft alleen id's, dus per bericht volgt een messages.get. Dat
 * is een N+1 en dat is hier de goede afweging: de batch-API van Gmail is
 * multipart/mixed dat je zelf moet samenstellen én parsen, voor maximaal 40
 * berichten. Blokken van 8 houden ons ruim onder het quotum.
 *
 * Drie manieren waarop dit misgaat, en alle drie krijgen een eigen antwoord:
 *   - `verlopen` op één bericht → alles stoppen. Het token is dood, dus élk
 *     volgend antwoord is onbetrouwbaar en "3 van de 40" zou een verzinsel zijn.
 *   - `fout` op één bericht → overslaan, maar TELLEN. Zie `nietGelezen`.
 *   - alles faalt (netwerk weg) → geen enkel bericht gelezen terwijl er wel
 *     id's waren. Dat is geen lege inbox maar een storing, en dus een `fout`.
 */
export async function haalTriageMails(toegangstoken: string): Promise<MailsUitkomst> {
  const profiel = await haalProfiel(toegangstoken)
  if (profiel.staat !== 'ok') return profiel

  const ids = await haalIds(toegangstoken)
  if (ids.staat !== 'ok') return ids

  const mails: MailMeta[] = []
  let nietGelezen = 0

  for (let i = 0; i < ids.ids.length; i += BLOKGROOTTE) {
    const blok = ids.ids.slice(i, i + BLOKGROOTTE)
    const uitkomsten = await Promise.all(
      blok.map((id) => haalBericht(toegangstoken, id, profiel.adres)),
    )

    for (const uitkomst of uitkomsten) {
      if (uitkomst.staat === 'verlopen') return { staat: 'verlopen' }
      if (uitkomst.staat === 'ok') mails.push(uitkomst.mail)
      else nietGelezen++
    }
  }

  // Gmail gaf id's, wij lazen er geen één. Dan is er iets structureel stuk (het
  // netwerk viel weg, Gmail geeft 500's) en is `ok` met een lege lijst een
  // leugen: er ligt post, we konden er alleen niet bij.
  if (ids.ids.length > 0 && mails.length === 0) {
    return { staat: 'fout', reden: 'geen_enkel_bericht_gelezen' }
  }

  return { staat: 'ok', mails, nietGelezen }
}
