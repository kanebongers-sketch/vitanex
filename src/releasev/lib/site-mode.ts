/**
 * SITE-MODUS
 *
 * Zolang RELEASEV_SITE_MODE niet op "live" staat, is de site verborgen:
 * - elke pagina krijgt `X-Robots-Tag: noindex, nofollow` (Google indexeert niets);
 * - robots.txt noemt geen sitemap en de sitemap is leeg;
 * - als RELEASEV_PREVIEW_PASSWORD is ingesteld, vraagt de browser om een wachtwoord.
 *
 * Open zetten voor Google: RELEASEV_SITE_MODE=live in Render en opnieuw deployen.
 *
 * Let op: we blokkeren bewust NIET met "Disallow: /" in robots.txt. Dan kan
 * Google de noindex niet zien en kan een URL alsnog (zonder inhoud) in de
 * zoekresultaten verschijnen.
 */
type Env = Readonly<Record<string, string | undefined>>;

export function isSiteHidden(env: Env = process.env): boolean {
  return env.RELEASEV_SITE_MODE?.trim().toLowerCase() !== "live";
}

export const NOINDEX_HEADER = { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" } as const;

export interface PreviewCredentials {
  user: string;
  password: string;
}

/** Wachtwoordbeveiliging alleen als de site verborgen is én er een wachtwoord (min. 8 tekens) is ingesteld. */
export function getPreviewCredentials(env: Env = process.env): PreviewCredentials | null {
  if (!isSiteHidden(env)) return null;
  const password = env.RELEASEV_PREVIEW_PASSWORD?.trim() ?? "";
  if (password.length < 8) return null;
  return { user: env.RELEASEV_PREVIEW_USER?.trim() || "release", password };
}

/** Vergelijkt twee strings in constante tijd (geen lek via responstijd). */
export function safeEqual(a: string, b: string): boolean {
  const length = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < length; i += 1) {
    diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }
  return diff === 0;
}

/** Controleert een `Authorization: Basic ...`-header. */
export function isAuthorized(header: string | null, credentials: PreviewCredentials): boolean {
  if (!header?.startsWith("Basic ")) return false;
  let decoded = "";
  try {
    decoded = atob(header.slice(6).trim());
  } catch {
    return false;
  }
  const separator = decoded.indexOf(":");
  if (separator < 0) return false;
  const user = decoded.slice(0, separator);
  const password = decoded.slice(separator + 1);
  // Beide altijd vergelijken, zodat de responstijd niets verraadt
  const isUserOk = safeEqual(user, credentials.user);
  const isPasswordOk = safeEqual(password, credentials.password);
  return isUserOk && isPasswordOk;
}
