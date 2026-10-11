import { z } from "zod";
import type Stripe from "stripe-rv";
import type { Product } from "./commerce/types";
import { MAX_QUANTITY_PER_ITEM, type CartLine } from "./cart";

/**
 * Pure checkout-logica: validatie van de request body en het opbouwen van
 * Stripe line items op basis van de catalogusprijs (nooit de clientprijs).
 */
export const MAX_CHECKOUT_LINES = 10;
/** Maximale lengte van de kaartjestekst (gelijk aan de client) */
export const GIFT_MESSAGE_LIMIT = 200;

export const checkoutBodySchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().trim().min(1).max(64),
        quantity: z.number().int().min(1).max(MAX_QUANTITY_PER_ITEM),
      }),
    )
    .min(1)
    .max(MAX_CHECKOUT_LINES),
  gift: z.object({ message: z.string().max(GIFT_MESSAGE_LIMIT) }).nullable().optional(),
  marketingConsent: z.boolean().optional(),
});

export type CheckoutBody = z.infer<typeof checkoutBodySchema>;
type LineItem = Stripe.Checkout.SessionCreateParams.LineItem;
type SessionParams = Stripe.Checkout.SessionCreateParams;

export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export function parseCheckoutBody(input: unknown): Result<CartLine[]> {
  const parsed = checkoutBodySchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Ongeldige winkelwagen." };
  return mergeLines(parsed.data.items);
}

export interface CheckoutExtras {
  /** null = geen cadeau; anders de (opgeschoonde) kaartjestekst, mag leeg zijn */
  giftMessage: string | null;
  hasMarketingConsent: boolean;
}

/** Verwijdert stuurtekens en overbodige witruimte uit vrije tekst. */
export function sanitizeFreeText(value: string, maxLength: number): string {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    // losse UTF-16-surrogaten (ongeldige tekens) verwijderen
    .replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, maxLength);
}

/** Cadeau- en toestemmingsopties uit de request body (veilig standaard: geen cadeau, geen toestemming). */
export function parseCheckoutExtras(input: unknown): CheckoutExtras {
  const parsed = checkoutBodySchema.safeParse(input);
  if (!parsed.success) return { giftMessage: null, hasMarketingConsent: false };
  const gift = parsed.data.gift;
  return {
    giftMessage: gift ? sanitizeFreeText(gift.message, GIFT_MESSAGE_LIMIT) : null,
    hasMarketingConsent: parsed.data.marketingConsent === true,
  };
}

/** Voegt dubbele productregels samen en bewaakt het maximum per product. */
export function mergeLines(items: readonly CartLine[]): Result<CartLine[]> {
  const merged = items.reduce<CartLine[]>((acc, item) => {
    const existing = acc.find((line) => line.productId === item.productId);
    if (!existing) return [...acc, { productId: item.productId, quantity: item.quantity }];
    return acc.map((line) =>
      line.productId === item.productId ? { ...line, quantity: line.quantity + item.quantity } : line,
    );
  }, []);
  const tooMany = merged.some((line) => line.quantity > MAX_QUANTITY_PER_ITEM);
  if (tooMany) {
    return { ok: false, error: `Je kunt maximaal ${MAX_QUANTITY_PER_ITEM} stuks per product bestellen.` };
  }
  return { ok: true, value: merged };
}

const PRICE_ID_PATTERN = /^price_[A-Za-z0-9]+$/;

/** Leest een optionele Stripe Price-ID uit de env; negeert lege of placeholderwaarden. */
export function resolvePriceId(
  product: Product,
  env: Readonly<Record<string, string | undefined>>,
): string | null {
  if (!product.stripePriceEnv) return null;
  const value = env[product.stripePriceEnv]?.trim() ?? "";
  return PRICE_ID_PATTERN.test(value) ? value : null;
}

export function toLineItem(
  product: Product,
  quantity: number,
  env: Readonly<Record<string, string | undefined>>,
): LineItem {
  const priceId = resolvePriceId(product, env);
  if (priceId) return { price: priceId, quantity };
  return {
    quantity,
    price_data: {
      currency: product.price.currency.toLowerCase(),
      unit_amount: product.price.amount,
      tax_behavior: "inclusive",
      product_data: {
        name: product.name,
        description: product.tagline,
        metadata: { productId: product.id, sku: product.sku },
      },
    },
  };
}

export function buildLineItems(
  lines: readonly CartLine[],
  findProduct: (id: string) => Product | undefined,
  env: Readonly<Record<string, string | undefined>>,
): Result<LineItem[]> {
  const unknown = lines.find((line) => !findProduct(line.productId));
  if (unknown) return { ok: false, error: "Een product in je winkelwagen bestaat niet meer." };
  const items = lines.map((line) => {
    const product = findProduct(line.productId) as Product;
    return toLineItem(product, line.quantity, env);
  });
  return { ok: true, value: items };
}

export interface SessionOptions {
  siteUrl: string;
  cancelPath: string;
  shippingCountries: readonly ("NL" | "BE")[];
  /** Extra notities voor de orderafhandeling (cadeau, toestemming) */
  metadata?: Record<string, string>;
}

const METADATA_VALUE_LIMIT = 500;

/** Stripe-metadata voor de orderafhandeling. Max. 500 tekens per waarde. */
export function buildOrderMetadata(
  extras: CheckoutExtras,
  tracking: Readonly<Record<string, string>> = {},
): Record<string, string> {
  const base: Record<string, string> = {
    gift: extras.giftMessage === null ? "nee" : "ja",
    consent_marketing: extras.hasMarketingConsent ? "ja" : "nee",
  };
  const giftMessage: Record<string, string> = extras.giftMessage
    ? { gift_message: extras.giftMessage.slice(0, METADATA_VALUE_LIMIT) }
    : {};
  // Trackinggegevens (Meta-cookies, user agent, IP) alleen met marketingtoestemming
  const trackingData = extras.hasMarketingConsent
    ? Object.fromEntries(
        Object.entries(tracking)
          .filter(([, value]) => value.length > 0)
          .map(([key, value]) => [key, value.slice(0, METADATA_VALUE_LIMIT)]),
      )
    : {};
  return { ...base, ...giftMessage, ...trackingData };
}

export function buildSessionParams(lineItems: LineItem[], options: SessionOptions): SessionParams {
  return {
    mode: "payment",
    line_items: lineItems,
    // Apple Pay en Google Pay vallen onder "card" (aanzetten in het Stripe-dashboard)
    allowed_payment_method_types: ["ideal", "bancontact", "card", "klarna"],
    locale: "nl",
    billing_address_collection: "auto",
    shipping_address_collection: { allowed_countries: [...options.shippingCountries] },
    shipping_options: [
      {
        shipping_rate_data: {
          type: "fixed_amount",
          display_name: "Gratis verzending",
          fixed_amount: { amount: 0, currency: "eur" },
          tax_behavior: "inclusive",
          delivery_estimate: {
            minimum: { unit: "business_day", value: 1 },
            maximum: { unit: "business_day", value: 2 },
          },
        },
      },
    ],
    metadata: options.metadata,
    success_url: `${options.siteUrl}/bedankt?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${options.siteUrl}${options.cancelPath}?checkout=geannuleerd`,
  };
}

const SESSION_ID_PATTERN = /^cs_(test|live)_[A-Za-z0-9]+$/;

export function isValidSessionId(value: unknown): value is string {
  return typeof value === "string" && value.length <= 255 && SESSION_ID_PATTERN.test(value);
}

/** "jan.jansen@voorbeeld.nl" → "ja•••@voorbeeld.nl" */
export function maskEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const at = email.lastIndexOf("@");
  if (at < 1) return null;
  const local = email.slice(0, at);
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}•••${email.slice(at)}`;
}
