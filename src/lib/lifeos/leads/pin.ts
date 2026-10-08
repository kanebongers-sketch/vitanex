// ─── LifeOS — lead tracker: pincode + sessie (SERVER-ONLY) ──────────────────
// De pincode staat nooit leesbaar opgeslagen: scrypt met een eigen salt per pin.
// Na een goede pin krijgt het toestel een willekeurig sessietoken in een
// httpOnly-cookie; in de database staat alleen de sha256 daarvan.

import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

const SLEUTEL_LENGTE = 32

/** "salt:hash" (hex). */
export function hashPin(pin: string): string {
  const salt = randomBytes(16)
  return `${salt.toString('hex')}:${scryptSync(pin, salt, SLEUTEL_LENGTE).toString('hex')}`
}

export function pinKlopt(pin: string, opgeslagen: string | null): boolean {
  if (!opgeslagen) return false
  const [saltHex, hashHex] = opgeslagen.split(':')
  if (!saltHex || !hashHex) return false
  const verwacht = Buffer.from(hashHex, 'hex')
  const echt = scryptSync(pin, Buffer.from(saltHex, 'hex'), SLEUTEL_LENGTE)
  return verwacht.length === echt.length && timingSafeEqual(verwacht, echt)
}

export function nieuwSessieToken(): string {
  return randomBytes(32).toString('base64url')
}

export function tokenHash(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

/** Cookie per link, zodat Kane meerdere lead-pagina's naast elkaar kan testen. */
export function sessieCookieNaam(code: string): string {
  return `mf_lead_${code.replace(/-/g, '_')}`
}

export const SESSIE_DAGEN = 90
