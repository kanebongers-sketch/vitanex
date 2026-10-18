// ─── Club, push: VAPID volgens RFC 8292 (PUUR, node) ────────────────────────
// Elke push gaat met een kort geldig JWT (ES256) waarmee de push-dienst ziet
// dat het van ons komt: aud = de oorsprong van het endpoint, exp = hooguit 24
// uur vooruit (wij nemen 12), sub = ons contactadres. De handtekening is
// r||s (ieee-p1363), zoals JWS vraagt. Alleen node:crypto.

import { createPrivateKey, createPublicKey, sign, type KeyObject } from 'node:crypto'
import { naarB64u } from './base64url'

export interface VapidSleutels {
  /** Publieke sleutel, 65 bytes ongecomprimeerd (0x04 x y). */
  publiek: Uint8Array
  /** Privesleutel, 32 bytes (d). */
  prive: Uint8Array
  /** mailto:... of https://... */
  subject: string
}

export const GELDIG_SEC = 12 * 3600

function jwkVan(publiek: Uint8Array): { kty: 'EC'; crv: 'P-256'; x: string; y: string } {
  return { kty: 'EC', crv: 'P-256', x: naarB64u(publiek.subarray(1, 33)), y: naarB64u(publiek.subarray(33, 65)) }
}

export function privesleutelObject(s: Pick<VapidSleutels, 'publiek' | 'prive'>): KeyObject {
  return createPrivateKey({ key: { ...jwkVan(s.publiek), d: naarB64u(s.prive) }, format: 'jwk' })
}

export function publiekeSleutelObject(publiek: Uint8Array): KeyObject {
  return createPublicKey({ key: jwkVan(publiek), format: 'jwk' })
}

function deel(waarde: unknown): string {
  return Buffer.from(JSON.stringify(waarde), 'utf8').toString('base64url')
}

/** Het JWT voor deze push-dienst. */
export function vapidJwt(endpoint: string, s: VapidSleutels, nu: Date): string {
  const claims = { aud: new URL(endpoint).origin, exp: Math.floor(nu.getTime() / 1000) + GELDIG_SEC, sub: s.subject }
  const ondertekend = `${deel({ typ: 'JWT', alg: 'ES256' })}.${deel(claims)}`
  const handtekening = sign('sha256', Buffer.from(ondertekend), { key: privesleutelObject(s), dsaEncoding: 'ieee-p1363' })
  return `${ondertekend}.${handtekening.toString('base64url')}`
}

/** De Authorization-kop: "vapid t=<jwt>, k=<publieke sleutel>". */
export function vapidKop(endpoint: string, s: VapidSleutels, nu: Date): string {
  return `vapid t=${vapidJwt(endpoint, s, nu)}, k=${naarB64u(s.publiek)}`
}
