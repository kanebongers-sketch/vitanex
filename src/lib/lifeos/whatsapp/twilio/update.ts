// ─── LifeOS — Twilio-WhatsApp-webhook parsen ────────────────────────────────
// Twilio levert een inkomend WhatsApp-bericht als een platte
// `application/x-www-form-urlencoded` POST (dus URLSearchParams), niet als de
// diep-geneste JSON van de Meta Cloud API (zie ../update.ts). De velden zijn
// vlak: `From`, `Body`, `NumMedia`, `MediaUrl0`, `MediaContentType0`, ...
//
// Dit is externe input op een systeemgrens: we lezen alleen via `params.get(...)`
// en narrowen zelf — geen casts, geen `any`. We pluizen er precies uit wat we
// nodig hebben (wie stuurde het, en is het spraak of tekst) en negeren de rest.
//
// Puur: geen fetch, geen Twilio-SDK, geen secrets. De webhook-route voedt de
// geparste body hierin en handelt daarna op het resultaat; zo is deze laag
// testbaar zonder Twilio en mag ze desnoods in een client draaien.

export type TwilioBericht =
  | { soort: 'tekst'; from: string; tekst: string }
  | { soort: 'spraak'; from: string; mediaUrl: string; mediaType: string }
  | { soort: 'genegeerd'; from: string }

/**
 * Geeft de getrimde waarde terug als het een niet-lege string is, anders null.
 * `params.get` levert `string | null`; dit dekt beide af in één narrow. Voor
 * `From` blijft de "whatsapp:"-prefix bewust staan (de ruwe waarde) — we halen
 * enkel omringende witruimte weg.
 */
function nietLeeg(v: string | null): string | null {
  return typeof v === 'string' && v.trim().length > 0 ? v.trim() : null
}

/**
 * Leest een Twilio-WhatsApp-webhookpayload. Geeft null als er geen bruikbaar
 * bericht in zit — geen afzender, of geen body én geen media om te verwerken.
 *
 * Volgorde is bewust: spraak wint van tekst. WhatsApp-spraakmemo's komen bij
 * Twilio binnen als een audio-media (bv. `audio/ogg`); als er zowel een
 * audio-content-type als een echte media-URL is, verwerken we dat als spraak —
 * ook wanneer er daarnaast een `Body` staat.
 */
export function leesTwilioBericht(params: URLSearchParams): TwilioBericht | null {
  const from = nietLeeg(params.get('From'))
  if (!from) return null

  const mediaType = nietLeeg(params.get('MediaContentType0'))
  const mediaUrl = nietLeeg(params.get('MediaUrl0'))

  // Spraak: audio-content-type + ophaalbare URL. Zonder URL valt er niets op te
  // halen, dus dan is het (nog) geen spraakbericht en vallen we door.
  if (mediaType && mediaUrl && mediaType.startsWith('audio')) {
    return { soort: 'spraak', from, mediaUrl, mediaType }
  }

  // Geen (bruikbare) spraak → tekstbericht. Lege/witruimte-body telt niet mee.
  const tekst = nietLeeg(params.get('Body'))
  if (tekst) return { soort: 'tekst', from, tekst }

  // Andere media (image/video/document): afzender kennen we, de inhoud
  // verwerken we niet. 'genegeerd' i.p.v. null zodat de route kan antwoorden
  // dat we het niet begrepen.
  if (mediaType) return { soort: 'genegeerd', from }

  // Geen body, geen media → niets zinnigs te doen.
  return null
}
