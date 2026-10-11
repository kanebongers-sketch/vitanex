/**
 * TRACKING-HELPERS — veilig aan te roepen vanuit elke client component.
 *
 * - Doet niets op de server, en niets als gtag (GA4) of fbq (Meta Pixel)
 *   niet geladen is. Die scripts laden pas na toestemming en als
 *   NEXT_PUBLIC_RELEASEV_TRACKING_ENABLED="true" (zie src/components/consent/Analytics.tsx).
 *   Je hoeft dus zelf nooit op toestemming te controleren.
 * - Fouten in een tracking-script mogen de webshop nooit breken: elke call
 *   is afgeschermd met try/catch.
 *
 * Gebruik:
 *   import { trackAddToCart, trackBeginCheckout } from "@rv/lib/tracking";
 *   trackAddToCart(69);          // waarde in euro's
 *   trackBeginCheckout(69);
 */

type EventParams = Record<string, string | number | boolean | undefined>;
type Gtag = (command: "event" | "consent" | "config" | "js", ...args: unknown[]) => void;
type Fbq = (command: "track" | "trackCustom" | "consent" | "init", ...args: unknown[]) => void;

declare global {
  interface Window {
    gtag?: Gtag;
    fbq?: Fbq;
    dataLayer?: unknown[];
  }
}

const CURRENCY = "EUR";

/** Meta gebruikt eigen standaard-eventnamen; dit koppelt GA4-namen daaraan. */
const META_EVENT_NAMES: Readonly<Record<string, string>> = {
  add_to_cart: "AddToCart",
  begin_checkout: "InitiateCheckout",
  purchase: "Purchase",
  view_item: "ViewContent",
  generate_lead: "Lead",
};

function safeCall(fn: () => void): void {
  try {
    fn();
  } catch {
    // Bewust genegeerd: tracking is nooit kritiek voor de bezoeker.
  }
}

/**
 * Stuurt een event naar GA4 en (indien er een Meta-equivalent is) naar de Meta Pixel.
 * `eventId` ontdubbelt het Pixel-event met het server-event (Conversions API).
 */
export function trackEvent(name: string, params: EventParams = {}, eventId?: string): void {
  if (typeof window === "undefined") return;
  const { gtag, fbq } = window;
  if (gtag) safeCall(() => gtag("event", name, params));
  const metaName = META_EVENT_NAMES[name];
  if (fbq && metaName) {
    const data = { value: params.value, currency: params.currency };
    safeCall(() => (eventId ? fbq("track", metaName, data, { eventID: eventId }) : fbq("track", metaName, data)));
  }
}

function roundEuro(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Product toegevoegd aan winkelwagen. `value` in euro's incl. btw. */
export function trackAddToCart(value: number): void {
  trackEvent("add_to_cart", { value: roundEuro(value), currency: CURRENCY });
}

/** Bezoeker start het afrekenen. `value` in euro's incl. btw. */
export function trackBeginCheckout(value: number): void {
  trackEvent("begin_checkout", { value: roundEuro(value), currency: CURRENCY });
}

/** Bestelling afgerond (bijv. op /bedankt). `value` in euro's incl. btw. */
export function trackPurchase(value: number, transactionId: string): void {
  // transactionId = Stripe-sessie-id = event_id van het server-event → Meta telt het een keer
  trackEvent("purchase", { value: roundEuro(value), currency: CURRENCY, transaction_id: transactionId }, transactionId);
}

/** Bezoeker bekijkt een product. `value` in euro's incl. btw. */
export function trackViewItem(value: number, itemId: string): void {
  trackEvent("view_item", { value: roundEuro(value), currency: CURRENCY, item_id: itemId });
}
