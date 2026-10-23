// ─── Club, health: OAuth 2.0 met PKCE en een ondertekende state (PUUR, node) ─
// Koppelen gaat zo:
//   1. /api/club/lid/health/koppelen/<bron>: maakt een nonce (en bij PKCE een
//      code_verifier), zet die in een kort HttpOnly-cookie en stuurt het lid naar
//      de leverancier met een state die met HMAC is ondertekend.
//   2. De leverancier stuurt het lid terug naar /api/club/lid/health/callback/<bron>
//      met code en state. We controleren de handtekening, de vervaltijd, de bron,
//      de sportschool en het lid (uit de sessie) en of de nonce gelijk is aan die
//      in het cookie. Pas dan wisselen we de code in voor tokens.
// Zonder het geheim kan niemand een geldige state maken; zonder het cookie werkt
// een gestolen state niet in een andere browser (geen login-CSRF).
// De HMAC-sleutel komt met HKDF uit CLUB_HEALTH_SLEUTEL (eigen doel 'state').

import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { leidSleutelAf } from './versleutelen'
import { isBronId, type BronId } from './typen'

export const STATE_TTL_MS = 30 * 60_000
export const KOPPEL_COOKIE = 'ayg-health-koppel'
export const KOPPEL_COOKIE_PAD = '/api/club/lid/health'

export interface StateInhoud {
  bron: BronId
  userId: string
  lidId: string
  nonce: string
  /** Vervalt op (ms sinds 1970). */
  verloopt: number
}

/** Een code_verifier volgens RFC 7636 (43 tekens base64url). */
export function maakCodeVerifier(bytes: Uint8Array = randomBytes(32)): string {
  return Buffer.from(bytes).toString('base64url')
}

/** De S256-uitdaging bij een verifier. */
export function codeChallenge(verifier: string): string {
  return createHash('sha256').update(verifier, 'ascii').digest('base64url')
}

export function maakNonce(bytes: Uint8Array = randomBytes(18)): string {
  return Buffer.from(bytes).toString('base64url')
}

function handtekening(data: string, hoofdsleutel: Uint8Array): Buffer {
  return createHmac('sha256', leidSleutelAf(hoofdsleutel, 'state')).update(data, 'utf8').digest()
}

export function maakState(inhoud: StateInhoud, hoofdsleutel: Uint8Array): string {
  const data = Buffer.from(JSON.stringify({ b: inhoud.bron, u: inhoud.userId, l: inhoud.lidId, n: inhoud.nonce, e: inhoud.verloopt }), 'utf8').toString('base64url')
  return `${data}.${handtekening(data, hoofdsleutel).toString('base64url')}`
}

export type StateFout = 'ongeldig' | 'verlopen' | 'andere_bron' | 'ander_lid' | 'geen_cookie'

/** De inhoud van een state, of waarom hij niet klopt. Vergelijkt in constante tijd. */
export function leesState(state: string | null, hoofdsleutel: Uint8Array, nu: Date): { ok: true; inhoud: StateInhoud } | { ok: false; fout: StateFout } {
  if (!state || state.length > 1000) return { ok: false, fout: 'ongeldig' }
  const [data, sig, rest] = state.split('.')
  if (!data || !sig || rest !== undefined) return { ok: false, fout: 'ongeldig' }
  const verwacht = handtekening(data, hoofdsleutel)
  const gegeven = Buffer.from(sig, 'base64url')
  if (gegeven.length !== verwacht.length || !timingSafeEqual(gegeven, verwacht)) return { ok: false, fout: 'ongeldig' }
  let ruw: unknown
  try {
    ruw = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'))
  } catch {
    return { ok: false, fout: 'ongeldig' }
  }
  const r = typeof ruw === 'object' && ruw !== null ? (ruw as Record<string, unknown>) : {}
  if (!isBronId(r.b) || typeof r.u !== 'string' || typeof r.l !== 'string' || typeof r.n !== 'string' || typeof r.e !== 'number') return { ok: false, fout: 'ongeldig' }
  if (r.e < nu.getTime()) return { ok: false, fout: 'verlopen' }
  return { ok: true, inhoud: { bron: r.b, userId: r.u, lidId: r.l, nonce: r.n, verloopt: r.e } }
}

/** Het cookie: nonce en (bij PKCE) de verifier. */
export function koppelCookieWaarde(nonce: string, verifier: string | null): string {
  return verifier ? `${nonce}.${verifier}` : nonce
}

export function leesKoppelCookie(waarde: string | undefined): { nonce: string; verifier: string | null } | null {
  if (!waarde || waarde.length > 300) return null
  const [nonce, verifier] = waarde.split('.')
  return nonce ? { nonce, verifier: verifier || null } : null
}

function gelijk(a: string, b: string): boolean {
  const x = Buffer.from(a)
  const y = Buffer.from(b)
  return x.length === y.length && timingSafeEqual(x, y)
}

/**
 * De volledige controle in de callback: state, bron uit de route, lid uit de
 * sessie en de nonce uit het cookie. Geeft de verifier terug (of null zonder PKCE).
 */
export function controleerCallback(p: {
  state: string | null
  cookie: string | undefined
  bron: BronId
  userId: string
  lidId: string
  hoofdsleutel: Uint8Array
  nu: Date
}): { ok: true; verifier: string | null } | { ok: false; fout: StateFout } {
  const gelezen = leesState(p.state, p.hoofdsleutel, p.nu)
  if (!gelezen.ok) return gelezen
  const s = gelezen.inhoud
  if (s.bron !== p.bron) return { ok: false, fout: 'andere_bron' }
  if (s.userId !== p.userId || s.lidId !== p.lidId) return { ok: false, fout: 'ander_lid' }
  const cookie = leesKoppelCookie(p.cookie)
  if (!cookie || !gelijk(cookie.nonce, s.nonce)) return { ok: false, fout: 'geen_cookie' }
  return { ok: true, verifier: cookie.verifier }
}

/** Het vaste terugkeeradres per bron (zo registreren bij de leverancier). */
export function redirectUri(basis: string, bron: BronId): string {
  return `${basis}/api/club/lid/health/callback/${bron}`
}
