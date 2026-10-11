import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Ondertekende, verlopende tokens zonder database (bijv. voor de
 * bevestigingslink van de nieuwsbrief). Formaat: base64url(payload).base64url(hmac)
 */
const SEPARATOR = ".";

function sign(data: string, secret: string): string {
  return createHmac("sha256", secret).update(data).digest("base64url");
}

export function createSignedToken(value: string, expiresAtMs: number, secret: string): string {
  const payload = Buffer.from(JSON.stringify({ v: value, e: expiresAtMs })).toString("base64url");
  return `${payload}${SEPARATOR}${sign(payload, secret)}`;
}

/** Geeft de waarde terug als de handtekening klopt en het token niet verlopen is, anders null. */
export function verifySignedToken(token: string, secret: string, nowMs = Date.now()): string | null {
  const [payload, signature, ...rest] = token.split(SEPARATOR);
  if (!payload || !signature || rest.length > 0 || token.length > 2000) return null;

  const expected = Buffer.from(sign(payload, secret));
  const received = Buffer.from(signature);
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null;

  try {
    const data: unknown = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (typeof data !== "object" || data === null) return null;
    const { v, e } = data as { v?: unknown; e?: unknown };
    if (typeof v !== "string" || typeof e !== "number" || e < nowMs) return null;
    return v;
  } catch {
    return null;
  }
}
