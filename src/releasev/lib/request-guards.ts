/**
 * Basisbescherming voor JSON-endpoints:
 * - alleen requests vanaf dezelfde origin (CSRF)
 * - alleen application/json
 */
/**
 * x-forwarded-host wordt bewust genegeerd: die header is door de client te
 * zetten en mag de CSRF-check niet beïnvloeden. Vergelijk met de Host-header
 * of met de canonieke host(s) uit SITE.url (`allowedHosts`).
 */
export function isSameOrigin(headers: Headers, allowedHosts: readonly string[] = []): boolean {
  const origin = headers.get("origin");
  if (!origin) return false;
  try {
    const originHost = new URL(origin).host;
    const trusted = [headers.get("host"), ...allowedHosts];
    return trusted.some((host) => Boolean(host) && host === originHost);
  } catch {
    return false;
  }
}

export function isJsonRequest(headers: Headers): boolean {
  return (headers.get("content-type") ?? "").toLowerCase().startsWith("application/json");
}
