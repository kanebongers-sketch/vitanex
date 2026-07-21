// ─── LifeOS — Twilio-antwoord (TwiML) bouwen ────────────────────────────────
// Twilio verwacht als webhook-response TwiML: een klein stukje XML. Een gewoon
// tekstantwoord op WhatsApp is `<Response><Message>...</Message></Response>`.
//
// De berichttekst is niet-vertrouwde inhoud (komt uit een AI-antwoord of uit
// gebruikersinvoer): daarom escapen we hem altijd, zodat een `<`, `&` of quote
// in de tekst de XML nooit kan breken of injecteren.
//
// Puur: geen deps, geen I/O. Alleen string in → XML-string uit.

/**
 * Escapet de vijf XML-tekens die de structuur kunnen breken. `&` MOET als
 * eerste, anders dubbel-escapen we de `&` die we zelf in de andere entiteiten
 * introduceren (bv. `<` → `&lt;` zou anders `&amp;lt;` worden).
 */
function escapeXml(tekst: string): string {
  return tekst
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

/**
 * Bouwt een TwiML-antwoord dat `bericht` als één WhatsApp-bericht terugstuurt.
 * De tekst wordt XML-ge-escapet, zodat geen enkele berichtinhoud de XML breekt.
 */
export function bouwTwimlAntwoord(bericht: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(bericht)}</Message></Response>`
}

/**
 * Bouwt een leeg TwiML-antwoord (geen `<Message>`): Twilio stuurt dan niets
 * terug naar de gebruiker. Gebruik dit na een genegeerd of afgewezen bericht.
 */
export function bouwLeegTwiml(): string {
  return '<?xml version="1.0" encoding="UTF-8"?><Response></Response>'
}
