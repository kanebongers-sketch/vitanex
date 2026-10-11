import { SITE } from "@rv/config/site";
import { createSignedToken, verifySignedToken } from "./signed-token";

/** Bevestigingslinks zijn 7 dagen geldig. */
const CONFIRM_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Geheim voor de bevestigingslinks (env RELEASEV_NEWSLETTER_SIGNING_SECRET, min. 32 tekens). */
export function getSigningSecret(): string | null {
  const secret = process.env.RELEASEV_NEWSLETTER_SIGNING_SECRET?.trim() ?? "";
  return secret.length >= 32 ? secret : null;
}

export function buildConfirmUrl(email: string, secret: string, nowMs = Date.now()): string {
  const token = createSignedToken(email, nowMs + CONFIRM_TTL_MS, secret);
  return `${SITE.url}/api/newsletter/bevestig?token=${encodeURIComponent(token)}`;
}

export function readConfirmToken(token: string | null, secret: string): string | null {
  return token ? verifySignedToken(token, secret) : null;
}
