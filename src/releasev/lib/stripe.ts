import Stripe from "stripe-rv";

/**
 * Server-only Stripe-client. Wordt lazy aangemaakt zodat de site ook zonder
 * Stripe-keys draait (afrekenen geeft dan een nette "nog niet geconfigureerd").
 * Importeer dit bestand nooit in een client component.
 */
const PLACEHOLDER_MARKER = "VERVANG";

let cachedClient: Stripe | null = null;
let cachedKey: string | null = null;

/** true als een env-waarde ontbreekt of nog de placeholder uit .env.example bevat. */
export function isMissingOrPlaceholder(value: string | undefined): boolean {
  const trimmed = value?.trim() ?? "";
  return trimmed === "" || trimmed.toUpperCase().includes(PLACEHOLDER_MARKER);
}

export function isStripeConfigured(): boolean {
  return !isMissingOrPlaceholder(process.env.RELEASEV_STRIPE_SECRET_KEY);
}

export function getStripe(): Stripe | null {
  const key = process.env.RELEASEV_STRIPE_SECRET_KEY;
  if (isMissingOrPlaceholder(key) || !key) return null;
  if (cachedClient && cachedKey === key) return cachedClient;
  cachedClient = new Stripe(key.trim(), { maxNetworkRetries: 2, typescript: true });
  cachedKey = key;
  return cachedClient;
}

export function getWebhookSecret(): string | null {
  const secret = process.env.RELEASEV_STRIPE_WEBHOOK_SECRET;
  return isMissingOrPlaceholder(secret) || !secret ? null : secret.trim();
}
