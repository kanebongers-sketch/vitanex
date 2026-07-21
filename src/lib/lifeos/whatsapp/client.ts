// ─── LifeOS — dunne WhatsApp Cloud API-laag ─────────────────────────────────
// Precies twee dingen die de webhook nodig heeft: een spraakmemo ophalen en een
// tekstantwoord terugsturen. Geen templates, geen state — Meta pusht naar onze
// webhook, wij antwoorden. Dit spiegelt bewust `telegram/bot.ts`, zodat de
// intentie-pijplijn met beide messengers op dezelfde manier praat.
//
// SERVER-ONLY. Dit bestand leest de bot-token en praat met Meta; het mag NOOIT
// in een client-component belanden (dan lekt de token naar de browser).
//
// INJECTEERBAAR via de `WhatsAppClient`-interface: de webhook-tests schuiven er
// een nep-client in en raken nooit het echte netwerk. `maakWhatsAppClient()`
// levert de echte.
//
// ─── GEHEIMHOUDING ──────────────────────────────────────────────────────────
// Twee dingen zijn geheim en worden NOOIT gelogd of in een foutmelding gezet:
//   1. de bot-token (staat in élke Authorization-header), en
//   2. de media-download-URL van stap 2 — die bevat een ondertekend token in de
//      query-string. Foutmeldingen dragen daarom alleen een HTTP-status en Meta's
//      eigen fouttekst, nooit een URL.

import type { AudioBestand } from '@/lib/lifeos/telegram/transcribe'

// Meta Graph API. Versie vastgepind: Meta rouleert versies, een losse major kan
// het antwoordformaat wijzigen — expliciet pinnen voorkomt stille breuk.
const API_BASIS = 'https://graph.facebook.com/v21.0'

// Eén time-out voor élke fetch: een hangende socket mag de webhook-afhandeling
// (die Meta binnen seconden verwacht) niet gijzelen.
const FETCH_TIMEOUT_MS = 10_000

/** De twee operaties die de webhook van WhatsApp nodig heeft. */
export interface WhatsAppClient {
  /** Stuurt een tekstantwoord naar een WhatsApp-nummer (E.164 zonder +, bv "31612345678"). */
  stuurBericht(naar: string, tekst: string): Promise<void>
  /** Haalt een media-bestand (spraakmemo) op via de Media API en downloadt de bytes. */
  haalMedia(mediaId: string): Promise<AudioBestand>
}

/** De ontlede media-metadata: alleen wat stap 2 (de download) nodig heeft. */
interface MediaMeta {
  /** Ondertekende, tijdelijke download-URL — geheim, nooit loggen. */
  url: string
  /** Meta's mime_type, al teruggevallen op een veilige standaard als het leeg was. */
  mimeType: string
}

/**
 * Narrowt het media-metadata-antwoord op de systeemgrens. `url` is verplicht: zonder
 * geldige URL valt er niets te downloaden, dus dan → null (de aanroeper gooit). We
 * casten bewust NIET de hele body naar een type, maar plukken en controleren elk veld.
 * `mime_type` mag ontbreken: WhatsApp-spraak is Ogg/Opus, dus 'audio/ogg' is de juiste
 * terugval en de transcriber accepteert dat.
 */
function leesMediaMeta(body: unknown): MediaMeta | null {
  if (typeof body !== 'object' || body === null) return null
  const url = (body as { url?: unknown }).url
  if (typeof url !== 'string' || url.length === 0) return null
  const mime = (body as { mime_type?: unknown }).mime_type
  const mimeType = typeof mime === 'string' && mime.length > 0 ? mime : 'audio/ogg'
  return { url, mimeType }
}

/** De uit de omgeving gelezen configuratie die elke Meta-call nodig heeft. */
interface WhatsAppConfig {
  token: string
  phoneNumberId: string
}

/**
 * Leest de omgeving PAS bij de aanroep (niet bij module-import): zo sloopt een
 * ontbrekende variabele geen import maar geeft hij een duidelijke fout op het
 * moment dat je 'm echt nodig hebt — precies het patroon van `maakTelegramBot`.
 */
function leesConfig(): WhatsAppConfig {
  const token = process.env.LIFEOS_WHATSAPP_TOKEN
  if (!token) {
    throw new Error('LIFEOS_WHATSAPP_TOKEN ontbreekt — de WhatsApp-client kan niet met Meta praten.')
  }
  const phoneNumberId = process.env.LIFEOS_WHATSAPP_PHONE_NUMBER_ID
  if (!phoneNumberId) {
    throw new Error(
      'LIFEOS_WHATSAPP_PHONE_NUMBER_ID ontbreekt — de WhatsApp-client weet niet welk nummer verzendt.',
    )
  }
  return { token, phoneNumberId }
}

/**
 * Eén GET met Bearer + time-out. Bij een netwerkfout/time-out gooien we een
 * schone NL-fout ZONDER de URL — die kan een ondertekend token bevatten (`wat`
 * beschrijft de stap, niet de URL).
 */
async function haalMetBearer(url: string, token: string, wat: string): Promise<Response> {
  try {
    return await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })
  } catch {
    throw new Error(`WhatsApp ${wat} mislukte (netwerkfout of time-out).`)
  }
}

/**
 * Stuurt een tekstbericht. Meta wil een vaste envelop: `messaging_product`,
 * `recipient_type` en het `text.body`-object. Bij een niet-ok antwoord dragen we
 * Meta's fouttekst (max ~200 tekens) mee — dat is de bruikbare uitleg (bv. een
 * ongeldig nummer of een verlopen token), geen geheim.
 */
async function verzendTekst(cfg: WhatsAppConfig, naar: string, tekst: string): Promise<void> {
  let antwoord: Response
  try {
    antwoord = await fetch(`${API_BASIS}/${cfg.phoneNumberId}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${cfg.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: naar,
        type: 'text',
        text: { body: tekst },
      }),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })
  } catch {
    throw new Error('WhatsApp-bericht versturen mislukte (netwerkfout of time-out).')
  }
  if (!antwoord.ok) {
    const detail = await antwoord.text().catch(() => '')
    throw new Error(`WhatsApp sendMessage mislukte (HTTP ${antwoord.status}): ${detail.slice(0, 200)}`)
  }
}

/**
 * Haalt een spraakmemo op in twee stappen (zo werkt de Media API):
 *   1. GET {basis}/{mediaId} → JSON met een tijdelijke, ondertekende download-URL.
 *   2. GET die URL (óók met Bearer — Meta eist dat op de download-host) → de bytes.
 * De download-URL zelf blijft binnen deze functie en gaat nooit een fout of log in.
 */
async function downloadMedia(cfg: WhatsAppConfig, mediaId: string): Promise<AudioBestand> {
  const meta = await haalMetBearer(`${API_BASIS}/${encodeURIComponent(mediaId)}`, cfg.token, 'media-metadata ophalen')
  if (!meta.ok) {
    const detail = await meta.text().catch(() => '')
    throw new Error(`WhatsApp media-metadata mislukte (HTTP ${meta.status}): ${detail.slice(0, 200)}`)
  }
  const metaBody: unknown = await meta.json().catch(() => null)
  const info = leesMediaMeta(metaBody)
  if (!info) {
    throw new Error('WhatsApp gaf geen bruikbare media-URL terug voor de spraakmemo.')
  }

  // Bewust alleen de HTTP-status in de fout: de body van een mislukte binaire
  // download is Meta's ruis (soms HTML), geen bruikbare uitleg, en de URL is geheim.
  const bestand = await haalMetBearer(info.url, cfg.token, 'spraakbestand downloaden')
  if (!bestand.ok) {
    throw new Error(`WhatsApp spraakbestand downloaden mislukte (HTTP ${bestand.status}).`)
  }
  const data = await bestand.arrayBuffer()

  // WhatsApp-spraak is ogg/opus; `.ogg` wordt door de transcriber geaccepteerd.
  return { data, bestandsnaam: `${mediaId}.ogg`, mimeType: info.mimeType }
}

/**
 * De echte client. De configuratie wordt hier (bij het bouwen) gelezen zodat een
 * ontbrekende env meteen een duidelijke fout geeft — de webhook vangt die en logt
 * server-side. De methoden sluiten de config in via de closure.
 */
export function maakWhatsAppClient(): WhatsAppClient {
  const cfg = leesConfig()
  return {
    stuurBericht: (naar: string, tekst: string): Promise<void> => verzendTekst(cfg, naar, tekst),
    haalMedia: (mediaId: string): Promise<AudioBestand> => downloadMedia(cfg, mediaId),
  }
}
