// ─── LifeOS — hetzelfde bericht nooit twee keer verwerken ───────────────────
// Telegram, Meta en Twilio sturen een webhook opnieuw als ons antwoord te lang
// duurt. Wij verwerken synchroon (Whisper + Claude + opslaan) vóór de 200, dus
// een trage run kon hetzelfde bericht twee keer als taak of afspraak opslaan.
//
// Dit bestand onthoudt per proces welke bericht-id's al binnenkwamen. Retries
// komen binnen minuten, dus een venster van een uur is ruim. Geheugen per
// proces is genoeg: LifeOS draait op één instantie, en valt die om, dan is een
// zeldzame dubbele taak goedkoper dan een extra tabel op elk bericht.

/** Hoe lang een id als "al gezien" telt. */
export const VENSTER_MS = 60 * 60 * 1000
/** Bovengrens; daarboven ruimen we verlopen id's op. */
const MAX_IDS = 2_000

export class BerichtDedup {
  private readonly gezien = new Map<string, number>()

  /**
   * `true` als dit id voor het eerst binnenkomt (verwerken), `false` bij een
   * herhaling (overslaan). Zonder id kunnen we niets vergelijken: verwerken.
   */
  eerste(id: string | null, nu: number = Date.now()): boolean {
    if (id === null) return true
    const eerder = this.gezien.get(id)
    if (eerder !== undefined && nu - eerder < VENSTER_MS) return false
    if (this.gezien.size >= MAX_IDS) this.ruimOp(nu)
    this.gezien.set(id, nu)
    return true
  }

  private ruimOp(nu: number): void {
    for (const [id, op] of this.gezien) {
      if (nu - op >= VENSTER_MS) this.gezien.delete(id)
    }
    if (this.gezien.size >= MAX_IDS) this.gezien.clear()
  }
}

/** Eén gedeelde instantie voor alle kanalen; de id's krijgen een kanaal-voorvoegsel. */
export const berichtDedup = new BerichtDedup()

function obj(v: unknown): Record<string, unknown> | null {
  return typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

function eerste(v: unknown): unknown {
  return Array.isArray(v) && v.length > 0 ? v[0] : null
}

/** Telegram: chat + message_id is uniek. */
export function telegramBerichtId(update: unknown): string | null {
  const message = obj(obj(update)?.message)
  const chatId = obj(message?.chat)?.id
  const berichtId = message?.message_id
  if (typeof chatId !== 'number' || typeof berichtId !== 'number') return null
  return `telegram:${chatId}:${berichtId}`
}

/** WhatsApp Cloud API: het `wamid` van het eerste bericht. */
export function whatsAppBerichtId(payload: unknown): string | null {
  const value = obj(obj(eerste(obj(eerste(obj(payload)?.entry))?.changes))?.value)
  const id = obj(eerste(value?.messages))?.id
  return typeof id === 'string' && id.length > 0 ? `whatsapp:${id}` : null
}

/** Twilio: de MessageSid. */
export function twilioBerichtId(params: URLSearchParams): string | null {
  const sid = params.get('MessageSid')?.trim()
  return sid ? `twilio:${sid}` : null
}
