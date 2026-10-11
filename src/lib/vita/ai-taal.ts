// ─── Taal en schrijfstijl voor Vita's AI-antwoorden ──────────────────────────
// Elke route die het taalmodel tekst voor de gebruiker laat schrijven, geeft
// deze instructie mee: antwoord in de taal van de gebruiker, en zonder de
// typische AI-schrijftekens (lange streepjes en klemtoon-accenten). Die
// stijlregel geldt ook voor Nederlands (besluit van Kane).
//
// Puur: geen server- of browser-API's. De taal zelf komt uit huidigeTaal().

import { TALEN, type Taal } from '@/lib/i18n/talen'

/** De naam van de taal, zoals die in de taalkeuze staat (bv. 'Nederlands'). */
export function taalNaam(taal: Taal): string {
  return TALEN.find((t) => t.code === taal)?.naam ?? 'Nederlands'
}

/** Systeem-/promptinstructie: taal + stijlregel. */
export function aiTaalInstructie(taal: Taal): string {
  return [
    `Taal: antwoord altijd in deze taal: ${taalNaam(taal)} (taalcode "${taal}"), ook als de context of eerdere berichten in een andere taal staan.`,
    'Stijl: gebruik nooit lange gedachtestreepjes (— of –); gebruik een komma, een punt of "tot". Gebruik nooit klemtoon-accenten zoals in één, vóór, méér of écht; schrijf een, voor, meer, echt. Deze stijlregel geldt ook voor Nederlands.',
  ].join('\n')
}
