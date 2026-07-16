// ─── LifeOS — Telegram-update parsen ────────────────────────────────────────
// Een inkomende Telegram-webhook is externe input op een systeemgrens: we
// narrowen, casten nooit. We halen er precies uit wat we nodig hebben — wie
// stuurde het, en is het tekst of een spraakmemo — en negeren de rest.
//
// Puur: geen fetch, geen bot-API. De webhook-route voedt de ruwe payload hierin
// en handelt daarna op het resultaat. Zo is deze laag testbaar zonder Telegram.

export type BerichtSoort = 'tekst' | 'spraak' | 'genegeerd'

export interface TelegramBericht {
  /** Chat waarnaar we het antwoord terugsturen. */
  chatId: number
  soort: BerichtSoort
  /** Bij 'tekst': de inhoud. */
  tekst: string | null
  /** Bij 'spraak': het Telegram file_id om de audio mee op te halen. */
  voiceFileId: string | null
  /** Duur van de spraakmemo in seconden (voor een grens tegen uren audio). */
  voiceSeconden: number | null
}

function getObj(v: unknown): Record<string, unknown> | null {
  return typeof v === 'object' && v !== null ? (v as Record<string, unknown>) : null
}

function getGetal(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null
}

function getTekst(v: unknown): string | null {
  return typeof v === 'string' && v.trim().length > 0 ? v.trim() : null
}

/**
 * Leest een Telegram-update. Geeft null als er geen bruikbaar bericht in zit
 * (bv. een edit, een status-update, of een berichttype dat we niet verwerken).
 *
 * We kijken alleen naar `message` — geen callback_query, geen channel_post. Eén
 * ingang, bewust smal: minder oppervlak, minder verrassingen.
 */
export function leesTelegramBericht(update: unknown): TelegramBericht | null {
  const root = getObj(update)
  if (!root) return null

  const message = getObj(root.message)
  if (!message) return null

  const chat = getObj(message.chat)
  const chatId = getGetal(chat?.id)
  if (chatId === null) return null

  // Spraakmemo (`voice`) heeft voorrang: dat is de hoofd-usecase onderweg.
  const voice = getObj(message.voice)
  if (voice) {
    const fileId = getTekst(voice.file_id)
    if (fileId) {
      return {
        chatId,
        soort: 'spraak',
        tekst: null,
        voiceFileId: fileId,
        voiceSeconden: getGetal(voice.duration),
      }
    }
  }

  const tekst = getTekst(message.text)
  if (tekst) {
    return { chatId, soort: 'tekst', tekst, voiceFileId: null, voiceSeconden: null }
  }

  // Foto, sticker, locatie… — we verwerken het niet, maar we willen wél kunnen
  // antwoorden dat we het niet begrepen. Vandaar 'genegeerd' i.p.v. null.
  return { chatId, soort: 'genegeerd', tekst: null, voiceFileId: null, voiceSeconden: null }
}

/** Bovengrens op een spraakmemo. Langer = waarschijnlijk niet bedoeld als commando. */
export const MAX_SPRAAK_SECONDEN = 300

/** Is deze spraakmemo te lang om zinnig als één intentie te behandelen? */
export function spraakTeLang(bericht: TelegramBericht): boolean {
  return bericht.voiceSeconden !== null && bericht.voiceSeconden > MAX_SPRAAK_SECONDEN
}
