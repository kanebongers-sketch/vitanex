// ─── Club, push: een abonnement uit de browser controleren (PUUR) ───────────
// Systeemgrens. De browser stuurt PushSubscription.toJSON(): endpoint en de
// sleutels p256dh en auth. Het endpoint mag alleen een https-adres van een
// bekende push-dienst zijn: de server stuurt er later zelf verzoeken heen, dus
// een willekeurig adres zou een SSRF-gat zijn.

import { naarB64u, uitB64u } from './base64url'

/** Exacte hosts van push-diensten (Chrome/Android, Firefox, Safari/iOS). */
const DIENSTEN = new Set(['fcm.googleapis.com', 'updates.push.services.mozilla.com', 'web.push.apple.com'])
/** Edge op Windows: wns2-xxx.notify.windows.com en dergelijke. */
const DIENST_ACHTERVOEGSEL = '.notify.windows.com'
const MAX_ENDPOINT = 1000

export interface PushAbonnement {
  endpoint: string
  /** base64url, 65 bytes. */
  p256dh: string
  /** base64url, 16 bytes. */
  auth: string
}

export type Invoer<T> = { ok: true; waarde: T } | { ok: false; fout: string }

/** Is dit een https-adres van een bekende push-dienst, zonder poort of inlog? */
export function isToegestaneDienst(endpoint: string): boolean {
  if (endpoint.length > MAX_ENDPOINT) return false
  let url: URL
  try {
    url = new URL(endpoint)
  } catch {
    return false
  }
  if (url.protocol !== 'https:' || url.port !== '' || url.username || url.password) return false
  const host = url.hostname.toLowerCase()
  if (DIENSTEN.has(host)) return true
  return host.endsWith(DIENST_ACHTERVOEGSEL) && /^[a-z0-9-]+\.notify\.windows\.com$/.test(host)
}

function sleutel(v: unknown, lengte: number): string | null {
  if (typeof v !== 'string' || v.length > 200) return null
  const bytes = uitB64u(v)
  if (!bytes || bytes.length !== lengte) return null
  if (lengte === 65 && bytes[0] !== 0x04) return null
  return naarB64u(bytes)
}

/** Het abonnement uit de body, streng gecontroleerd. */
export function leesAbonnement(body: unknown): Invoer<PushAbonnement> {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return { ok: false, fout: 'Onleesbare invoer.' }
  const b = body as Record<string, unknown>
  if (typeof b.endpoint !== 'string' || !isToegestaneDienst(b.endpoint)) return { ok: false, fout: 'Deze browser wordt niet ondersteund voor meldingen.' }
  const keys = typeof b.keys === 'object' && b.keys !== null ? (b.keys as Record<string, unknown>) : {}
  const p256dh = sleutel(keys.p256dh, 65)
  const auth = sleutel(keys.auth, 16)
  if (!p256dh || !auth) return { ok: false, fout: 'De sleutels van de browser kloppen niet.' }
  return { ok: true, waarde: { endpoint: b.endpoint, p256dh, auth } }
}

/** Alleen het endpoint (voor afmelden), gecontroleerd. */
export function leesEndpoint(body: unknown): string | null {
  if (typeof body !== 'object' || body === null) return null
  const e = (body as Record<string, unknown>).endpoint
  return typeof e === 'string' && isToegestaneDienst(e) ? e : null
}

/** "Chrome op Android", "Safari op iPhone": genoeg om een toestel te herkennen, niet meer. */
export function kortToestel(userAgent: string | null): string | null {
  if (!userAgent) return null
  const ua = userAgent.slice(0, 500)
  const browser = /Edg\//.test(ua) ? 'Edge' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'Browser'
  const systeem = /iPhone/.test(ua) ? 'iPhone' : /iPad/.test(ua) ? 'iPad' : /Android/.test(ua) ? 'Android' : /Windows/.test(ua) ? 'Windows' : /Mac OS X/.test(ua) ? 'Mac' : /Linux/.test(ua) ? 'Linux' : null
  return systeem ? `${browser} op ${systeem}` : browser
}
