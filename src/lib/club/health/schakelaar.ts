// ─── Club, health: schakelaar en sleutel (PUUR, leest alleen de omgeving) ───
// CLUB_HEALTH_ACTIEF=1 zet koppelingen met apps en apparaten aan. Standaard UIT:
// dan bestaan de pagina, de API en de webhooks niet (404) en toont de ledenkaart
// niets. CLUB_HEALTH_SLEUTEL (32 bytes, base64 of hex) versleutelt de tokens en
// ondertekent de state; zonder geldige sleutel is niets te koppelen.

export type Omgeving = Readonly<Record<string, string | undefined>>

export function healthActief(omgeving: Omgeving = process.env): boolean {
  return omgeving.CLUB_HEALTH_ACTIEF?.trim() === '1'
}

/** De hoofdsleutel als 32 bytes, of null als hij ontbreekt of niet klopt. */
export function healthHoofdsleutel(omgeving: Omgeving = process.env): Buffer | null {
  const ruw = omgeving.CLUB_HEALTH_SLEUTEL?.trim()
  if (!ruw) return null
  const hex = /^[0-9a-f]{64}$/i.test(ruw) ? Buffer.from(ruw, 'hex') : null
  if (hex) return hex
  const b64 = Buffer.from(ruw.replace(/-/g, '+').replace(/_/g, '/'), 'base64')
  return b64.length === 32 ? b64 : null
}

/** Aan en met een bruikbare sleutel: pas dan kan er iets gekoppeld worden. */
export function healthKlaar(omgeving: Omgeving = process.env): boolean {
  return healthActief(omgeving) && healthHoofdsleutel(omgeving) !== null
}

/** Waar de leverancier het lid na het inloggen naartoe stuurt (moet exact zo bij de leverancier geregistreerd staan). */
export function healthRedirectBasis(omgeving: Omgeving = process.env): string {
  const eigen = omgeving.CLUB_HEALTH_REDIRECT_BASIS?.trim()
  return eigen && /^https:\/\/[a-z0-9.-]+(:\d+)?$/i.test(eigen) ? eigen : 'https://aiyourgym.com'
}
