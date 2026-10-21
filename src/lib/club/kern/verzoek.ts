// ─── AI Your Gym: kleine regels voor binnenkomende verzoeken (SERVER) ───────
// Zelfde oorsprong (CSRF, naast SameSite=Lax), het IP voor remmen, de pincode
// uit een body en de koppen tegen cachen. Voor alle API's van AI Your Gym.

import type { NextRequest } from 'next/server'

export const GEEN_CACHE = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } as const

/** De hosts waaronder de server dit verzoek ziet (achter Render ook X-Forwarded-Host). */
function hostsVan(headers: Headers): string[] {
  const kandidaten = [headers.get('x-forwarded-host')?.split(',')[0], headers.get('host')]
  return kandidaten.flatMap((h) => (h && h.trim() ? [h.trim().toLowerCase()] : []))
}

/**
 * Komt dit verzoek van onze eigen pagina? Browsers sturen Sec-Fetch-Site en/of
 * Origin; ontbreken beide (geen browser), dan weigeren we ook.
 */
export function isZelfdeOorsprong(headers: Headers): boolean {
  const site = headers.get('sec-fetch-site')
  if (site) return site === 'same-origin'
  const origin = headers.get('origin')
  const hosts = hostsVan(headers)
  if (!origin || hosts.length === 0) return false
  try {
    return hosts.includes(new URL(origin).host.toLowerCase())
  } catch {
    return false
  }
}

/** Het IP van de bezoeker (alleen voor remmen); achter een proxy de eerste uit X-Forwarded-For. */
export function ipVan(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip')?.trim() || 'onbekend'
}

/** De `pin` uit de body, als die 6 cijfers is. */
export function leesPin(body: unknown): string | null {
  const pin = typeof body === 'object' && body !== null ? (body as Record<string, unknown>).pin : null
  return typeof pin === 'string' && /^\d{6}$/.test(pin) ? pin : null
}
