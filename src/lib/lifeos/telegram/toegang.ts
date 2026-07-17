// ─── LifeOS — wie mag de Telegram-bot bedienen? ─────────────────────────────
// Puur: env-waarde erin, besluit eruit. Geen `process.env` binnenin, zodat dit
// zonder env-gerommel te testen is — dezelfde regel als `vrije-blokken.ts` en
// `intentie.ts`, waar de tijd en het model ook naar binnen komen.
//
// ─── WAAROM DIT FAIL-CLOSED IS (en eerst niet was) ──────────────────────────
// Het secret bewijst "dit komt van Telegram", niet "dit komt van Kane". Wie de
// bot-naam kent kan hem aanschrijven; wie het secret heeft, kan hem namens
// iedereen aanschrijven. De vorige versie liet bij een lege allowlist álles
// door ("het secret is dan de gate"), met een eerlijke reden: je chat-id ken je
// pas ná je eerste bericht — een kip-ei.
//
// Die redenering klopte, maar woog de verkeerde kant op. Wat er achter deze
// deur ligt is niet "een taak in een lijst": `uitvoeren.ts` schrijft AUTONOOM
// afspraken in Kane's échte Google-agenda, zonder menselijke klik, met alleen
// een vertrouwensdrempel (0.55) als rem. Eén lek secret + een lege allowlist =
// een vreemde die in zijn agenda schrijft. Een kip-ei-ongemak van één minuut
// weegt daar niet tegenop.
//
// Dus: geen allowlist → niets komt binnen. Het kip-ei lossen we op met een
// EXPLICIETE, BEWUST GEKOZEN escape in plaats van met een stille default.
//
// ─── DE EERLIJKE PRIJS ──────────────────────────────────────────────────────
// Wie na deze wijziging deployt zonder `LIFEOS_TELEGRAM_ALLOWED_CHAT_ID` te
// zetten, heeft een bot die stil niets doet. Dat is met opzet — een dichte deur
// hoort niet vanzelf open te gaan — maar het is wél een gedragsverandering die
// je merkt. `leer-modus` is de weg terug, en die staat in `.env.example`.

/**
 * De bewuste escape uit het kip-ei. Zet `LIFEOS_TELEGRAM_ALLOWED_CHAT_ID=leer-modus`,
 * stuur de bot één bericht, en hij meldt je chat-id terug. Verder voert hij NIETS
 * uit: geen taak, geen notitie, geen afspraak, geen model- of Whisper-aanroep.
 *
 * Dat "verder niets" is het hele punt. Een leer-modus die ondertussen gewoon
 * werkt, is de fail-open die we net dichttimmerden — met een vriendelijkere naam.
 */
export const LEER_MODUS = 'leer-modus'

export type Toegangsbesluit =
  /** Deze chat staat op de allowlist: normaal verwerken. */
  | { soort: 'toegestaan' }
  /** Leer-modus: meld het chat-id terug en voer verder niets uit. */
  | { soort: 'leer_modus' }
  /** Onbekende chat, of geen allowlist geconfigureerd: stil negeren. */
  | { soort: 'geweigerd' }

/** Komma-gescheiden env-waarde → losse, opgeschoonde items. */
function leesItems(ruw: string | undefined): string[] {
  return (ruw ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

/**
 * Mag deze chat de bot bedienen?
 *
 * De volgorde is bewust: een expliciet vermeld chat-id wint altijd van
 * `leer-modus`. Zo kun je tijdens het leren je eigen id alvast toevoegen
 * (`leer-modus,42`) — jij werkt dan normaal, en elke andere chat krijgt alleen
 * zijn id terug. Als je klaar bent haal je `leer-modus` weg en is de deur dicht.
 *
 * Geen allowlist → `geweigerd`. Niet `toegestaan`: zie de kop van dit bestand.
 */
export function beoordeelChatId(chatId: number, ruweAllowlist: string | undefined): Toegangsbesluit {
  const items = leesItems(ruweAllowlist)
  if (items.length === 0) return { soort: 'geweigerd' }
  if (items.includes(String(chatId))) return { soort: 'toegestaan' }
  if (items.some((i) => i.toLowerCase() === LEER_MODUS)) return { soort: 'leer_modus' }
  return { soort: 'geweigerd' }
}

/**
 * Wat de bot in leer-modus terugstuurt. Bevat alleen het chat-id — dat is precies
 * het gegeven dat de ontvanger zelf al heeft, dus het lekt niets nieuws, ook niet
 * als een vreemde de bot in deze stand aanschrijft.
 */
export function leerModusAntwoord(chatId: number): string {
  return [
    `Je chat-id is: ${chatId}`,
    '',
    'LifeOS staat in leer-modus en voert nog niets uit. Zet dit id in',
    'LIFEOS_TELEGRAM_ALLOWED_CHAT_ID (en haal "leer-modus" weg) om de bot te activeren.',
  ].join('\n')
}
