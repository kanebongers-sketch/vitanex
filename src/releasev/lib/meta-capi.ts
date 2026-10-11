import { createHash } from "node:crypto";

/**
 * Meta Conversions API (server-side events).
 * Werkt naast de Meta Pixel: hetzelfde event_id (de Stripe-sessie-id) zorgt
 * dat Meta browser- en server-events ontdubbelt. Alleen versturen als de
 * klant toestemming gaf voor marketing (zie metadata.consent_marketing).
 *
 * Benodigd: NEXT_PUBLIC_RELEASEV_META_PIXEL_ID en RELEASEV_META_CAPI_ACCESS_TOKEN.
 * Optioneel: RELEASEV_META_CAPI_TEST_EVENT_CODE (zichtbaar in Events Manager > Test events).
 */
const GRAPH_VERSION = "v21.0";
const PIXEL_ID_PATTERN = /^\d{10,20}$/;

export interface PurchaseEventInput {
  eventId: string;
  eventTimeSeconds: number;
  value: number;
  currency: string;
  email: string | null;
  sourceUrl: string;
  metadata: Readonly<Record<string, string>>;
}

export function sha256Normalized(value: string): string {
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

export function hasMarketingConsent(metadata: Readonly<Record<string, string>>): boolean {
  return metadata.consent_marketing === "ja";
}

/** Bouwt de request body voor het Purchase-event. Pure functie, zonder netwerk. */
export function buildPurchasePayload(input: PurchaseEventInput, testEventCode?: string) {
  const { metadata } = input;
  const userData = Object.fromEntries(
    Object.entries({
      em: input.email ? [sha256Normalized(input.email)] : undefined,
      fbp: metadata.fbp,
      fbc: metadata.fbc,
      client_user_agent: metadata.client_user_agent,
      client_ip_address: metadata.client_ip && metadata.client_ip !== "unknown" ? metadata.client_ip : undefined,
    }).filter(([, value]) => value !== undefined && value !== ""),
  );
  return {
    data: [
      {
        event_name: "Purchase",
        event_time: input.eventTimeSeconds,
        event_id: input.eventId,
        action_source: "website",
        event_source_url: input.sourceUrl,
        user_data: userData,
        custom_data: { value: Math.round(input.value * 100) / 100, currency: input.currency.toUpperCase() },
      },
    ],
    ...(testEventCode ? { test_event_code: testEventCode } : {}),
  };
}

function getConfig(): { pixelId: string; token: string } | null {
  const pixelId = process.env.NEXT_PUBLIC_RELEASEV_META_PIXEL_ID?.trim() ?? "";
  const token = process.env.RELEASEV_META_CAPI_ACCESS_TOKEN?.trim() ?? "";
  if (!PIXEL_ID_PATTERN.test(pixelId) || /^0+$/.test(pixelId) || token.length < 20) return null;
  return { pixelId, token };
}

/** Verstuurt het Purchase-event. Doet niets zonder config of zonder toestemming. */
export async function sendPurchaseEvent(input: PurchaseEventInput): Promise<"sent" | "skipped"> {
  const config = getConfig();
  if (!config || !hasMarketingConsent(input.metadata)) return "skipped";
  const payload = buildPurchasePayload(input, process.env.RELEASEV_META_CAPI_TEST_EVENT_CODE?.trim() || undefined);
  const response = await fetch(
    `https://graph.facebook.com/${GRAPH_VERSION}/${config.pixelId}/events?access_token=${encodeURIComponent(config.token)}`,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) },
  );
  if (!response.ok) {
    throw new Error(`Meta CAPI antwoordde met status ${response.status}`);
  }
  return "sent";
}
