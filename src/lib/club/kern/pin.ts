// ─── AI Your Gym: pincodes en sessietokens (SERVER-ONLY) ────────────────────
// Voor alle inlogs van AI Your Gym: platform-eigenaar, beheerders, medewerkers
// en leden. De pincode staat nooit leesbaar opgeslagen: scrypt met een eigen
// salt per pin. Na een goede pin krijgt het toestel een willekeurig token in een
// httpOnly-cookie; in de database staat alleen de sha256 daarvan.
// Dezelfde opslagvorm als voorheen, dus bestaande pincodes blijven werken.

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

/**
 * Controlecode van 4 cijfers bij een gekozen (nog niet goedgekeurde) pincode.
 * Afgeleid van de opgeslagen hash (met eigen salt): uniek per keuze, en zegt
 * niets over de pin zelf.
 */
export function controleCode(pinHash: string): string {
  const getal = createHash('sha256').update(`controle:${pinHash}`).digest().readUInt32BE(0) % 10_000
  return String(getal).padStart(4, '0')
}

export function nieuwSessieToken(): string {
  return randomBytes(32).toString('base64url')
}

/** sha256 als 64 hextekens: voor sessietokens en het geheime deel van een link. */
export function tokenHash(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

/** Zoveel foute pogingen achter elkaar sluiten de link een tijd. */
export const MAX_POGINGEN = 5
/** Na zoveel blokkades gaat de link dicht tot er een nieuwe pincode komt. */
export const MAX_BLOKKADES = 6
const BLOKKADE_MIN = 15

/**
 * Hoe lang de n-de blokkade duurt (n vanaf 1): 15, 30, 60, 120, 240, 480 min.
 * Met MAX_POGINGEN = 5 en MAX_BLOKKADES = 6 kan een aanvaller hooguit 30 pins
 * proberen voor de link dichtgaat.
 */
export function blokkadeDuurMin(blokkade: number): number {
  return BLOKKADE_MIN * 2 ** Math.max(0, Math.min(blokkade, MAX_BLOKKADES) - 1)
}

/**
 * Constant-tijd vergelijking van twee geheimen (cron-sleutel). Leeg verwacht
 * geheim = dicht. Eerst hashen, zodat ook de lengte niet lekt.
 */
export function geheimGelijk(verwacht: string, gegeven: string | null): boolean {
  if (verwacht.length === 0 || !gegeven) return false
  const a = createHash('sha256').update(verwacht).digest()
  const b = createHash('sha256').update(gegeven).digest()
  return timingSafeEqual(a, b)
}
