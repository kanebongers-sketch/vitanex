// ─── LifeOS — Twilio-webhook handtekeningverificatie ────────────────────────
// SERVER-ONLY. Twilio ondertekent elke webhook-POST met de header
// `X-Twilio-Signature`. Dat is de ENIGE manier om te bewijzen dat een request
// echt van Twilio komt (het endpoint is publiek). Klopt de handtekening niet, dan
// komt het request niet voorbij deze functie.
//
// Het schema van Twilio (geverifieerd tegen de officiële docs, "Validating
// Signatures from Twilio", juli 2026):
//   1. Neem de EXACTE URL die Twilio aanriep (zoals in de console geconfigureerd).
//   2. Sorteer de POST-parameters alfabetisch op sleutel en plak per parameter de
//      sleutel direct gevolgd door de waarde achter de URL (geen scheidingsteken).
//   3. Bereken HMAC-SHA1 van die string met de Auth Token als sleutel.
//   4. Base64-encodeer de digest en vergelijk 'm in CONSTANTE TIJD met de header.
//
// De Auth Token is een geheim en wordt NOOIT gelogd; alleen het ja/nee-oordeel
// verlaat deze functie.

import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Is de `X-Twilio-Signature` geldig voor deze URL + parameters?
 *
 * FAIL-CLOSED: ontbrekende Auth Token, ontbrekende header, of een mismatch → false.
 * Alleen een exacte, in constante tijd geverifieerde handtekening → true.
 *
 * `url` moet exact de bij Twilio geconfigureerde webhook-URL zijn (bv.
 * `https://mentaforce.nl/api/lifeos/whatsapp/twilio/webhook`) — Twilio ondertekent
 * die string, niet de interne URL achter een proxy. De aanroeper bouwt 'm uit
 * `APP_URL`, niet uit `req.url`.
 */
export function handtekeningGeldig(
  url: string,
  params: URLSearchParams,
  handtekeningHeader: string | null,
  authToken: string | undefined,
): boolean {
  if (!authToken || !handtekeningHeader) return false

  // Sleutels alfabetisch; per sleutel elke waarde (getAll dekt een veld dat
  // uitzonderlijk meerdere keren voorkomt — Twilio plakt ze in volgorde).
  const sleutels = [...new Set(params.keys())].sort()
  let data = url
  for (const sleutel of sleutels) {
    for (const waarde of params.getAll(sleutel)) data += sleutel + waarde
  }

  const verwacht = createHmac('sha1', authToken).update(data, 'utf8').digest('base64')
  return constanteTijdGelijk(verwacht, handtekeningHeader)
}

/** Constante-tijd string-vergelijking; een lengteverschil is meteen ongelijk. */
function constanteTijdGelijk(a: string, b: string): boolean {
  const ba = Buffer.from(a, 'utf8')
  const bb = Buffer.from(b, 'utf8')
  if (ba.length !== bb.length) return false
  return timingSafeEqual(ba, bb)
}
