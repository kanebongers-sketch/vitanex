// ─── Club, push: de inhoud versleutelen volgens RFC 8291 (PUUR, node) ───────
// Message Encryption for Web Push, met content-coding aes128gcm (RFC 8188):
//   ecdh_secret = ECDH(eigen tijdelijke sleutel, publieke sleutel toestel)
//   IKM   = HKDF(salt = auth_secret, ikm = ecdh_secret,
//                info = "WebPush: info" 0x00 ua_public as_public, 32)
//   CEK   = HKDF(salt, IKM, "Content-Encoding: aes128gcm" 0x00, 16)
//   NONCE = HKDF(salt, IKM, "Content-Encoding: nonce" 0x00, 12)
//   body  = salt(16) rs(4) idlen(1) as_public(65) AES-128-GCM(tekst 0x02) tag
// Een enkel record (de tekst is kort), dus de afsluiter is 0x02 zonder opvulling.
// Alleen node:crypto. Elke melding krijgt een nieuwe tijdelijke sleutel en salt;
// de test zet ze vast om tegen de testvector uit RFC 8291 bijlage A te toetsen.

import { createCipheriv, createECDH, hkdfSync, randomBytes } from 'node:crypto'

export const RECORD_GROOTTE = 4096
/** Wat er hooguit aan tekst in een push past (4096 min kop, afsluiter en tag, met marge). */
export const MAX_TEKST_BYTES = 3000

const CURVE = 'prime256v1'
const TAG_BYTES = 16

export interface Ontvanger {
  /** De publieke sleutel van het toestel (p256dh), 65 bytes ongecomprimeerd. */
  p256dh: Uint8Array
  /** Het auth-geheim van het toestel, 16 bytes. */
  auth: Uint8Array
}

export interface Vast {
  /** Tijdelijke privesleutel van de server (32 bytes); alleen voor tests. */
  privesleutel?: Uint8Array
  /** De salt (16 bytes); alleen voor tests. */
  salt?: Uint8Array
}

function info(tekst: string, ...extra: Uint8Array[]): Buffer {
  return Buffer.concat([Buffer.from(tekst, 'utf8'), Buffer.from([0]), ...extra])
}

function hkdf(ikm: Uint8Array, salt: Uint8Array, inf: Uint8Array, lengte: number): Buffer {
  return Buffer.from(hkdfSync('sha256', ikm, salt, inf, lengte))
}

/** De sleutels voor een bericht: CEK en NONCE uit het gedeelde geheim. Geexporteerd voor de test. */
export function leidSleutelsAf(ecdhGeheim: Uint8Array, ontvanger: Ontvanger, asPubliek: Uint8Array, salt: Uint8Array): { ikm: Buffer; cek: Buffer; nonce: Buffer } {
  const ikm = hkdf(ecdhGeheim, ontvanger.auth, info('WebPush: info', ontvanger.p256dh, asPubliek), 32)
  return {
    ikm,
    cek: hkdf(ikm, salt, info('Content-Encoding: aes128gcm'), 16),
    nonce: hkdf(ikm, salt, info('Content-Encoding: nonce'), 12),
  }
}

/** De kop van aes128gcm: salt, recordgrootte, lengte van de sleutel en de sleutel. */
export function kop(salt: Uint8Array, asPubliek: Uint8Array, rs = RECORD_GROOTTE): Buffer {
  const rsBytes = Buffer.alloc(4)
  rsBytes.writeUInt32BE(rs)
  return Buffer.concat([Buffer.from(salt), rsBytes, Buffer.from([asPubliek.length]), Buffer.from(asPubliek)])
}

export function isGeldigeOntvanger(o: Ontvanger): boolean {
  return o.p256dh.length === 65 && o.p256dh[0] === 0x04 && o.auth.length === 16
}

/**
 * Versleutel de tekst voor dit toestel. Gooit bij een ongeldige sleutel of een
 * te lange tekst (de aanroeper controleert dat vooraf).
 */
export function versleutel(tekst: Uint8Array, ontvanger: Ontvanger, vast: Vast = {}): Buffer {
  if (!isGeldigeOntvanger(ontvanger)) throw new Error('Ongeldige sleutel van het toestel')
  if (tekst.length > MAX_TEKST_BYTES) throw new Error('Tekst te lang voor een push')
  const ecdh = createECDH(CURVE)
  if (vast.privesleutel) ecdh.setPrivateKey(Buffer.from(vast.privesleutel))
  else ecdh.generateKeys()
  const asPubliek = ecdh.getPublicKey()
  const salt = vast.salt ? Buffer.from(vast.salt) : randomBytes(16)
  const geheim = ecdh.computeSecret(Buffer.from(ontvanger.p256dh))
  const { cek, nonce } = leidSleutelsAf(geheim, ontvanger, asPubliek, salt)
  const cipher = createCipheriv('aes-128-gcm', cek, nonce, { authTagLength: TAG_BYTES })
  const versleuteld = Buffer.concat([cipher.update(Buffer.concat([Buffer.from(tekst), Buffer.from([0x02])])), cipher.final(), cipher.getAuthTag()])
  return Buffer.concat([kop(salt, asPubliek), versleuteld])
}
