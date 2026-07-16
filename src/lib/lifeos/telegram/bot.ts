// ─── LifeOS — dunne Telegram Bot-API-laag ───────────────────────────────────
// Precies twee dingen die de webhook nodig heeft: een spraakbestand ophalen en
// een tekstbericht terugsturen. Geen polling, geen commando's, geen state —
// Telegram pusht naar onze webhook, wij antwoorden.
//
// INJECTEERBAAR via de `TelegramBot`-interface: de webhook-tests schuiven er een
// nep-bot in en raken nooit het echte netwerk. `maakTelegramBot()` levert de echte.
//
// ─── GEHEIMHOUDING ──────────────────────────────────────────────────────────
// De bot-token zit in élke Telegram-URL (ook de download-URL). Die URL's worden
// daarom NOOIT gelogd. De foutmeldingen hieronder bevatten bewust alleen een
// HTTP-status en Telegram's eigen fouttekst, nooit een URL of de token.

import type { AudioBestand } from './transcribe'

const API_BASIS = 'https://api.telegram.org'

/** De twee operaties die de webhook van Telegram nodig heeft. */
export interface TelegramBot {
  /** Haalt een bestand (spraakmemo) op via getFile + download van de .oga. */
  haalBestand(fileId: string): Promise<AudioBestand>
  /** Stuurt een gewoon tekstantwoord naar een chat. */
  stuurBericht(chatId: number, tekst: string): Promise<void>
}

/** MIME per extensie. Telegram-spraak is altijd ogg/opus (.oga). */
function mimeVoor(bestandspad: string): string {
  const ext = bestandspad.toLowerCase().split('.').pop()
  if (ext === 'oga' || ext === 'ogg') return 'audio/ogg'
  if (ext === 'mp3' || ext === 'mpga') return 'audio/mpeg'
  if (ext === 'm4a') return 'audio/mp4'
  if (ext === 'wav') return 'audio/wav'
  if (ext === 'webm') return 'audio/webm'
  return 'application/octet-stream'
}

/** 'voice/file_123.oga' → 'file_123.oga'. Whisper wil een naam met extensie. */
function basisnaam(bestandspad: string): string {
  const laatste = bestandspad.split('/').pop()
  return laatste && laatste.length > 0 ? laatste : 'spraak.oga'
}

/** Narrowt het getFile-antwoord tot het bestandspad. */
function leesBestandspad(body: unknown): string | null {
  if (typeof body !== 'object' || body === null) return null
  const resultaat = (body as { result?: unknown }).result
  if (typeof resultaat !== 'object' || resultaat === null) return null
  const pad = (resultaat as { file_path?: unknown }).file_path
  return typeof pad === 'string' && pad.length > 0 ? pad : null
}

/**
 * De echte bot. De token wordt bij het bouwen gelezen zodat een ontbrekende token
 * meteen een duidelijke fout geeft — de webhook vangt die en logt server-side.
 */
export function maakTelegramBot(): TelegramBot {
  const token = process.env.LIFEOS_TELEGRAM_BOT_TOKEN
  if (!token) {
    throw new Error('LIFEOS_TELEGRAM_BOT_TOKEN ontbreekt — de bot kan niet met Telegram praten.')
  }

  return {
    async haalBestand(fileId: string): Promise<AudioBestand> {
      // 1. getFile → het (tijdelijke) bestandspad.
      const meta = await fetch(`${API_BASIS}/bot${token}/getFile?file_id=${encodeURIComponent(fileId)}`)
      if (!meta.ok) {
        throw new Error(`getFile mislukte (HTTP ${meta.status}).`)
      }
      const metaBody: unknown = await meta.json().catch(() => null)
      const bestandspad = leesBestandspad(metaBody)
      if (!bestandspad) {
        throw new Error('Telegram gaf geen bestandspad terug voor de spraakmemo.')
      }

      // 2. Download de bytes van de download-host (andere URL-vorm dan de API).
      const bestand = await fetch(`${API_BASIS}/file/bot${token}/${bestandspad}`)
      if (!bestand.ok) {
        throw new Error(`Spraakbestand downloaden mislukte (HTTP ${bestand.status}).`)
      }
      const data = await bestand.arrayBuffer()

      return { data, bestandsnaam: basisnaam(bestandspad), mimeType: mimeVoor(bestandspad) }
    },

    async stuurBericht(chatId: number, tekst: string): Promise<void> {
      const antwoord = await fetch(`${API_BASIS}/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: tekst }),
      })
      if (!antwoord.ok) {
        const detail = await antwoord.text().catch(() => '')
        throw new Error(`sendMessage mislukte (HTTP ${antwoord.status}): ${detail.slice(0, 200)}`)
      }
    },
  }
}
