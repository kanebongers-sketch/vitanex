// ─── AI Your Gym: tweestapsverificatie met TOTP (PUUR, node:crypto) ─────────
// RFC 4226 (HOTP) en RFC 6238 (TOTP): HMAC-SHA1, stappen van 30 seconden, 6
// cijfers. Werkt met elke gangbare app (Google Authenticator, 1Password,
// Microsoft Authenticator, Bitwarden). Geen bibliotheek en geen betaalde dienst:
// alleen node:crypto. Getest met de testvectoren uit beide RFC's.
//
// Herstelcodes: 10 stuks, elk 10 tekens uit een alfabet zonder verwarrende
// tekens (50 bits). In de database staat alleen de sha256 van de genormaliseerde
// code; de codes zelf ziet Kane een keer.

import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto'

export const TOTP_STAP_SECONDEN = 30
export const TOTP_CIJFERS = 6
/** Een stap ervoor en erna telt ook (klok van de telefoon iets voor of achter). */
export const TOTP_VENSTER = 1
/** 160 bits, zoals RFC 4226 aanraadt. */
export const GEHEIM_BYTES = 20
export const AANTAL_HERSTELCODES = 10

const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

/** Base32 (RFC 4648) zonder opvulling, zoals authenticator-apps hem lezen. */
export function base32Codeer(data: Uint8Array): string {
  let uit = ''
  let bits = 0
  let waarde = 0
  for (const byte of data) {
    waarde = (waarde << 8) | byte
    bits += 8
    while (bits >= 5) {
      uit += BASE32[(waarde >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  if (bits > 0) uit += BASE32[(waarde << (5 - bits)) & 31]
  return uit
}

/** Base32 terug naar bytes (spaties, streepjes en opvulling genegeerd), of null bij een vreemd teken. */
export function base32Decodeer(tekst: string): Buffer | null {
  const schoon = tekst.toUpperCase().replace(/[\s=-]/g, '')
  const bytes: number[] = []
  let bits = 0
  let waarde = 0
  for (const teken of schoon) {
    const i = BASE32.indexOf(teken)
    if (i < 0) return null
    waarde = (waarde << 5) | i
    bits += 5
    if (bits >= 8) {
      bytes.push((waarde >>> (bits - 8)) & 255)
      bits -= 8
    }
  }
  return Buffer.from(bytes)
}

/** Een nieuw geheim van GEHEIM_BYTES willekeurige bytes. */
export function nieuwGeheim(): Buffer {
  return randomBytes(GEHEIM_BYTES)
}

/** HOTP (RFC 4226) voor een teller, als tekst met voorloopnullen. */
export function hotp(geheim: Uint8Array, teller: number, cijfers: number = TOTP_CIJFERS): string {
  const blok = Buffer.alloc(8)
  blok.writeUInt32BE(Math.floor(teller / 2 ** 32), 0)
  blok.writeUInt32BE(teller >>> 0, 4)
  const mac = createHmac('sha1', geheim).update(blok).digest()
  const start = mac[mac.length - 1] & 0x0f
  const getal = mac.readUInt32BE(start) & 0x7fffffff
  return String(getal % 10 ** cijfers).padStart(cijfers, '0')
}

/** De stap (teller) voor een moment in milliseconden. */
export function totpStap(tijdMs: number, stapSeconden: number = TOTP_STAP_SECONDEN): number {
  return Math.floor(tijdMs / 1000 / stapSeconden)
}

/** TOTP (RFC 6238) voor een moment. */
export function totp(geheim: Uint8Array, tijdMs: number, cijfers: number = TOTP_CIJFERS): string {
  return hotp(geheim, totpStap(tijdMs), cijfers)
}

/** Alleen de cijfers van wat iemand intikt ("123 456" wordt "123456"), of null. */
export function leesTotpCode(invoer: unknown): string | null {
  if (typeof invoer !== 'string' || invoer.length > 20) return null
  const cijfers = invoer.replace(/[\s-]/g, '')
  return new RegExp(`^\\d{${TOTP_CIJFERS}}$`).test(cijfers) ? cijfers : null
}

function gelijk(a: string, b: string): boolean {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

/**
 * Klopt de code voor dit moment (een stap ervoor of erna mag ook)? Geeft de stap
 * die klopte, of null. Een stap die al eens gebruikt is (laatsteStap of eerder)
 * telt nooit: zo werkt een afgeluisterde code geen tweede keer.
 */
export function controleerTotp(geheim: Uint8Array, code: string, tijdMs: number, laatsteStap: number | null = null): number | null {
  if (!/^\d+$/.test(code) || code.length !== TOTP_CIJFERS) return null
  const nu = totpStap(tijdMs)
  let gevonden: number | null = null
  for (let d = -TOTP_VENSTER; d <= TOTP_VENSTER; d++) {
    const stap = nu + d
    // Alle stappen doorrekenen (geen vroege return): gelijke rekentijd.
    if (gelijk(hotp(geheim, stap), code) && (laatsteStap === null || stap > laatsteStap) && gevonden === null) gevonden = stap
  }
  return gevonden
}

/** De otpauth-link voor de QR-code (Key Uri Format van Google Authenticator). */
export function otpauthUrl(geheimBase32: string, account: string, uitgever: string): string {
  const label = `${encodeURIComponent(uitgever)}:${encodeURIComponent(account)}`
  const q = new URLSearchParams({ secret: geheimBase32, issuer: uitgever, algorithm: 'SHA1', digits: String(TOTP_CIJFERS), period: String(TOTP_STAP_SECONDEN) })
  return `otpauth://totp/${label}?${q.toString()}`
}

/** Het geheim in groepjes van 4, makkelijker over te tikken. */
export function geheimInGroepjes(geheimBase32: string): string {
  return geheimBase32.replace(/(.{4})/g, '$1 ').trim()
}

// ─── Herstelcodes ───────────────────────────────────────────────────────────

/** Zonder 0, 1, i, l en o: niet te verwarren bij overtikken. */
const HERSTEL_ALFABET = 'abcdefghjkmnpqrstuvwxyz23456789'
const HERSTEL_LENGTE = 10

/** Een herstelcode als "abcde-fghjk". */
export function nieuweHerstelcode(): string {
  let code = ''
  for (let i = 0; i < HERSTEL_LENGTE; i++) code += HERSTEL_ALFABET[randomInt(HERSTEL_ALFABET.length)]
  return `${code.slice(0, 5)}-${code.slice(5)}`
}

export function nieuweHerstelcodes(aantal: number = AANTAL_HERSTELCODES): string[] {
  const uit = new Set<string>()
  while (uit.size < aantal) uit.add(nieuweHerstelcode())
  return [...uit]
}

/** Wat iemand intikt als herstelcode, zonder streepjes en spaties, of null. */
export function leesHerstelcode(invoer: unknown): string | null {
  if (typeof invoer !== 'string' || invoer.length > 40) return null
  const schoon = invoer.toLowerCase().replace(/[\s-]/g, '')
  return schoon.length === HERSTEL_LENGTE && [...schoon].every((t) => HERSTEL_ALFABET.includes(t)) ? schoon : null
}

/** sha256 (64 hextekens) van een herstelcode, met of zonder streepje. */
export function herstelHash(code: string): string {
  return createHash('sha256').update(`ayg-herstel|${code.toLowerCase().replace(/[\s-]/g, '')}`).digest('hex')
}
