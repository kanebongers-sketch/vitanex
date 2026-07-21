// ─── LifeOS — WhatsApp Cloud API-webhook parsen ─────────────────────────────
// Een inkomende WhatsApp-webhook is externe input op een systeemgrens: we
// narrowen, casten nooit. De payload is diep genest (entry → changes → value →
// messages) en WhatsApp stuurt óók status-callbacks (bezorgd/gelezen) langs
// dezelfde route. We pluizen er precies uit wat we nodig hebben — wie stuurde
// het, en is het tekst of een spraakmemo — en negeren al het andere.
//
// Puur: geen fetch, geen Graph API, geen secrets. De webhook-route voedt de ruwe
// payload hierin en handelt daarna op het resultaat. Zo is deze laag testbaar
// zonder WhatsApp, en mag ze desnoods in een client draaien.

export type WhatsAppBericht =
  | { soort: 'tekst'; from: string; tekst: string }
  | { soort: 'spraak'; from: string; mediaId: string }
  | { soort: 'genegeerd'; from: string }

function isObject(v: unknown): Record<string, unknown> | null {
  return typeof v === 'object' && v !== null ? (v as Record<string, unknown>) : null
}

function tekst(v: unknown): string | null {
  return typeof v === 'string' && v.trim().length > 0 ? v.trim() : null
}

/** Pakt het eerste element van een array-veld, of null als het geen (gevulde) array is. */
function eerste(v: unknown): unknown {
  return Array.isArray(v) && v.length > 0 ? v[0] : null
}

/**
 * Leest een WhatsApp Cloud API-webhookpayload. Geeft null als er geen bruikbaar
 * bericht in zit — bijvoorbeeld een STATUS-callback (`value.statuses`:
 * bezorgd/gelezen-bevestigingen die we volledig negeren), een lege payload, of
 * een bericht zonder afzender.
 *
 * We kijken bewust alleen naar `entry[0].changes[0].value.messages[0]`: één
 * ingang, smal gehouden. WhatsApp batcht theoretisch meerdere entries/messages,
 * maar de webhook levert er in de praktijk één per event en meer oppervlak =
 * meer verrassingen.
 */
export function leesWhatsAppBericht(payload: unknown): WhatsAppBericht | null {
  const root = isObject(payload)
  if (!root) return null

  const entry = isObject(eerste(root.entry))
  if (!entry) return null

  const change = isObject(eerste(entry.changes))
  if (!change) return null

  const value = isObject(change.value)
  if (!value) return null

  // Geen `messages` (bv. een status-callback met alleen `statuses`) → niets te
  // verwerken. We negeren bezorgd/gelezen-bevestigingen volledig.
  const bericht = isObject(eerste(value.messages))
  if (!bericht) return null

  const from = tekst(bericht.from)
  if (!from) return null

  const type = tekst(bericht.type)

  // Spraakmemo's komen binnen als `type: "audio"`. We hebben alleen het media-id
  // nodig om de audio later op te halen; zonder id valt er niets te verwerken.
  if (type === 'audio') {
    const audio = isObject(bericht.audio)
    const mediaId = tekst(audio?.id)
    return mediaId ? { soort: 'spraak', from, mediaId } : null
  }

  // Tekstbericht: de inhoud zit in `text.body`. Lege/ontbrekende body → null,
  // er is dan niets zinnigs te doen.
  if (type === 'text') {
    const body = tekst(isObject(bericht.text)?.body)
    return body ? { soort: 'tekst', from, tekst: body } : null
  }

  // Image, document, sticker, location, button, interactive… — we verwerken het
  // niet, maar we kennen wél de afzender en willen kunnen antwoorden dat we het
  // niet begrepen. Vandaar 'genegeerd' i.p.v. null.
  return { soort: 'genegeerd', from }
}
