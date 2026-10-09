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

/**
 * Controlecode van 4 cijfers bij een gekozen (nog niet goedgekeurde) pincode.
 * Wie de pin kiest, ziet de code één keer; Kane ziet dezelfde code bij het
 * goedkeuren en vraagt hem na. Zo kan iemand die als eerste een pin zet op
 * andermans link (de namen zijn openbaar) niet ongemerkt goedgekeurd worden.
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

export function tokenHash(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

/** Cookie per link, zodat Kane meerdere lead-pagina's naast elkaar kan testen. */
export function sessieCookieNaam(code: string): string {
  return `mf_lead_${code.replace(/-/g, '_')}`
}

// ─── Sessiebeleid ─────────────────────────────────────────────────────────────

/** Een sessie leeft hooguit zo lang, ook als het toestel dagelijks gebruikt wordt. */
export const SESSIE_DAGEN = 90
/** Een toestel dat zo lang niet geopend is, moet opnieuw inloggen (gestolen/vergeten telefoon). */
export const SESSIE_INACTIEF_DAGEN = 30
/** Hoe vaak we "laatst gebruikt" hooguit bijwerken: één schrijfactie per uur per sessie. */
export const SESSIE_AANRAAK_MS = 60 * 60 * 1000
/**
 * De beheerdersessie (Kane, via zijn hoofdaccount) leeft maar zo lang: hij komt
 * vanzelf weer binnen zolang hij in MentaForce is ingelogd, en uitloggen daar
 * sluit zo ook binnen een halve dag de PT-app.
 */
export const BEHEER_SESSIE_UUR = 12
/** Meer toestellen dan dit per persoon: het oudste toestel wordt uitgelogd. */
export const MAX_SESSIES_PER_PERSOON = 8

/** Zoveel foute pogingen achter elkaar sluiten de link een tijd. */
export const MAX_POGINGEN = 5
/** Na zoveel blokkades gaat de link dicht tot Kane de pincode reset. */
export const MAX_BLOKKADES = 6
const BLOKKADE_MIN = 15

/**
 * Hoe lang de n-de blokkade duurt (n ≥ 1): 15 → 30 → 60 → 120 → 240 → 480 min.
 * Met MAX_POGINGEN = 5 en MAX_BLOKKADES = 6 kan een aanvaller hooguit 30 pins
 * proberen (0,003% van de 6-cijferige ruimte) voor de link dichtgaat.
 */
export function blokkadeDuurMin(blokkade: number): number {
  return BLOKKADE_MIN * 2 ** Math.max(0, Math.min(blokkade, MAX_BLOKKADES) - 1)
}
