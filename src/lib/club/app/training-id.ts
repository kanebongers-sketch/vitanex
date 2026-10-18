// ─── Fit Factory Club, ledenapp: het vaste id van een training (PUUR) ───────
// Bij het starten krijgt elke training een eigen id. Dat id gaat mee bij het
// versturen; komt dezelfde training twee keer binnen (antwoord viel weg en de
// wachtrij probeerde opnieuw), dan slaat de server hem maar een keer op.

import { isUuid } from './invoer'

/** Het id uit een bewaarde training of een verzoek; ongeldig: null. Altijd kleine letters. */
export function leesTrainingId(v: unknown): string | null {
  return isUuid(v) ? v.toLowerCase() : null
}

/** Een nieuw id (uuid v4). Zonder crypto.randomUUID (oud toestel, geen https) met eigen willekeur. */
export function maakTrainingId(): string {
  const c = typeof globalThis.crypto === 'object' ? globalThis.crypto : undefined
  if (c && typeof c.randomUUID === 'function') return c.randomUUID()
  const b = new Uint8Array(16)
  if (c && typeof c.getRandomValues === 'function') c.getRandomValues(b)
  else for (let i = 0; i < b.length; i++) b[i] = Math.floor(Math.random() * 256)
  b[6] = (b[6] & 0x0f) | 0x40
  b[8] = (b[8] & 0x3f) | 0x80
  const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}
