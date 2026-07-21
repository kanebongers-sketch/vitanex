// ─── LifeOS — dunne Twilio-media-laag (WhatsApp via Twilio) ─────────────────
// Precies één ding dat de webhook nodig heeft: een WhatsApp-spraakmemo downloaden.
// Twilio levert in de webhook-payload een `MediaUrl` per bijlage; die URL wijst naar
// Twilio's media-endpoint en redirect naar de echte opslag. Wij halen de bytes op en
// geven ze als `AudioBestand` door aan de transcriber — precies het contract dat de
// Meta-variant (`../client.ts`) ook levert, zodat de intentie-pijplijn niet weet welke
// WhatsApp-route eronder zit.
//
// SERVER-ONLY. Dit bestand leest de Twilio-credentials (Account SID + Auth Token) en
// praat met Twilio; het mag NOOIT in een client-component belanden (dan lekken de
// credentials naar de browser).
//
// INJECTEERBAAR via de `TwilioClient`-interface: de webhook-tests schuiven er een
// nep-client in en raken nooit het echte netwerk. `maakTwilioClient()` levert de echte.
//
// ─── GEHEIMHOUDING ──────────────────────────────────────────────────────────
// Twee dingen zijn geheim en worden NOOIT gelogd of in een foutmelding gezet:
//   1. de credentials (Account SID + Auth Token, samen de Basic-auth-header), en
//   2. de media-URL zelf — die is per bericht ondertekend/tijdelijk en identificeert
//      de gebruiker. Foutmeldingen dragen daarom alleen een HTTP-status of een korte
//      NL-reden, nooit de URL of de credentials.

import type { AudioBestand } from '@/lib/lifeos/telegram/transcribe'

// Eén time-out voor de download: een hangende socket mag de webhook-afhandeling
// (die Twilio binnen seconden verwacht) niet gijzelen. Media mag iets groter zijn dan
// een tekst-call, vandaar ruimer dan de Meta-variant.
const FETCH_TIMEOUT_MS = 15_000

// Terugval-mimeType als Twilio geen (of een leeg) Content-Type meestuurt. WhatsApp-spraak
// is Ogg/Opus, dus 'audio/ogg' is de juiste standaard en de transcriber accepteert die.
const STANDAARD_MIME = 'audio/ogg'

/** De enige operatie die de webhook van Twilio nodig heeft. */
export interface TwilioClient {
  /** Downloadt een Twilio-media-bestand (spraakmemo) via zijn volledige MediaUrl. */
  haalMedia(mediaUrl: string): Promise<AudioBestand>
}

/** De uit de omgeving gelezen credentials die de Basic-auth-header vormen. */
interface TwilioConfig {
  sid: string
  token: string
}

/**
 * Leest de omgeving PAS bij de aanroep (niet bij module-import): zo sloopt een
 * ontbrekende variabele geen import maar geeft hij een duidelijke fout op het moment
 * dat je 'm echt nodig hebt — precies het patroon van `maakWhatsAppClient` /
 * `maakTelegramBot`. Elke variabele apart gecontroleerd, met een eigen NL-melding.
 */
function leesConfig(): TwilioConfig {
  const sid = process.env.TWILIO_ACCOUNT_SID
  if (!sid) {
    throw new Error('TWILIO_ACCOUNT_SID ontbreekt — de Twilio-client kan geen media downloaden.')
  }
  const token = process.env.TWILIO_AUTH_TOKEN
  if (!token) {
    throw new Error('TWILIO_AUTH_TOKEN ontbreekt — de Twilio-client kan zich niet authenticeren.')
  }
  return { sid, token }
}

/**
 * Twilio's HTTP Basic auth: `Authorization: Basic base64("SID:TOKEN")`. Dezelfde
 * credentials gelden ook na de redirect naar de opslag-host, dus fetch stuurt de header
 * mee zolang de redirect binnen Twilio blijft. De header zelf is geheim: nooit loggen.
 */
function basicAuthHeader(cfg: TwilioConfig): string {
  const base64 = Buffer.from(`${cfg.sid}:${cfg.token}`).toString('base64')
  return `Basic ${base64}`
}

/** Content-Type kan ontbreken of leeg zijn; dan de veilige standaard (Ogg/Opus). */
function leesMimeType(header: string | null): string {
  return header !== null && header.length > 0 ? header : STANDAARD_MIME
}

/**
 * Leidt de bestandsextensie af uit het mimeType. De transcriber herkent het formaat
 * aan de extensie, dus die moet kloppen. Alleen het basistype telt: parameters als
 * `; codecs=opus` of `; charset=...` knippen we eraf. Onbekend → `.ogg` (veilige
 * terugval die overal wordt geaccepteerd).
 */
function extensieVoorMime(mimeType: string): string {
  const basis = mimeType.split(';')[0].trim().toLowerCase()
  switch (basis) {
    case 'audio/ogg':
      return '.ogg'
    case 'audio/mpeg':
      return '.mp3'
    case 'audio/mp4':
    case 'audio/m4a':
      return '.m4a'
    case 'audio/amr':
      return '.amr'
    default:
      return '.ogg'
  }
}

/**
 * Downloadt de spraakmemo in één GET met Basic-auth + time-out. Twilio's media-URL
 * redirect naar de echte opslag; fetch volgt de redirect standaard (`redirect: 'follow'`),
 * dus dat laten we bewust op de standaard staan.
 *   - Netwerkfout/time-out → schone NL-fout ZONDER de URL of credentials.
 *   - `!ok` → fout met alleen de HTTP-status (de body kan Twilio-ruis zijn en de URL geheim).
 */
async function downloadMedia(cfg: TwilioConfig, mediaUrl: string): Promise<AudioBestand> {
  let antwoord: Response
  try {
    antwoord = await fetch(mediaUrl, {
      headers: { Authorization: basicAuthHeader(cfg) },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })
  } catch {
    throw new Error('Twilio media downloaden mislukte (netwerkfout of time-out).')
  }

  if (!antwoord.ok) {
    throw new Error(`Twilio media downloaden mislukte (HTTP ${antwoord.status}).`)
  }

  const data = await antwoord.arrayBuffer()
  const mimeType = leesMimeType(antwoord.headers.get('Content-Type'))
  // Vaste naam met de juiste extensie: de transcriber leidt het formaat uit de extensie af.
  const bestandsnaam = `spraak${extensieVoorMime(mimeType)}`
  return { data, bestandsnaam, mimeType }
}

/**
 * De echte client. De configuratie wordt hier (bij het bouwen) gelezen zodat een
 * ontbrekende env meteen een duidelijke fout geeft — de webhook vangt die en logt
 * server-side. De methode sluit de config in via de closure.
 */
export function maakTwilioClient(): TwilioClient {
  const cfg = leesConfig()
  return {
    haalMedia: (mediaUrl: string): Promise<AudioBestand> => downloadMedia(cfg, mediaUrl),
  }
}
