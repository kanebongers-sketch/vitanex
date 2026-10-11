"use client";

import { useState } from "react";
import { cartSubtotal, type CartLine } from "@rv/lib/cart";
import { getProductById } from "@rv/lib/commerce";
import { trackBeginCheckout } from "@rv/lib/tracking";
import { useCartStore, type GiftOption } from "@rv/stores/cart-store";
import { useConsentStore } from "@rv/stores/consent-store";
import { Button } from "@rv/components/ui/Button";

type CheckoutResponse = { success: true; data: { url: string } } | { success: false; error?: string };

const GENERIC_ERROR = "Afrekenen lukt nu even niet. Probeer het zo opnieuw of neem contact met ons op.";
const NOT_CONFIGURED =
  "Afrekenen is nog niet geconfigureerd. Probeer het later opnieuw of neem contact met ons op.";

function messageFor(status: number, body: CheckoutResponse | null): string {
  if (status === 503) return NOT_CONFIGURED;
  if (body && !body.success && body.error) return body.error;
  return GENERIC_ERROR;
}

interface CheckoutExtras {
  gift: GiftOption;
  /** Marketingtoestemming uit de cookiebanner; bepaalt of server-side Meta-events mogen. */
  hasMarketingConsent: boolean;
}

async function startCheckout(lines: readonly CartLine[], extras: CheckoutExtras): Promise<string> {
  const response = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      items: lines.map((line) => ({ productId: line.productId, quantity: line.quantity })),
      gift: extras.gift.isGift ? { message: extras.gift.message } : null,
      marketingConsent: extras.hasMarketingConsent,
    }),
  });
  const body = (await response.json().catch(() => null)) as CheckoutResponse | null;
  if (!response.ok || !body?.success) throw new Error(messageFor(response.status, body));
  return body.data.url;
}

/** Start een Stripe Checkout-sessie en stuurt door. Toont een vriendelijke fout bij problemen. */
export function CheckoutButton({ lines }: { lines: readonly CartLine[] }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const gift = useCartStore((state) => state.gift);
  const hasMarketingConsent = useConsentStore((state) => state.marketing);

  const handleCheckout = async () => {
    setIsLoading(true);
    setError(null);
    trackBeginCheckout(cartSubtotal(lines, getProductById).amount / 100);
    try {
      const url = await startCheckout(lines, { gift, hasMarketingConsent });
      window.location.assign(url);
    } catch (caught) {
      setError(caught instanceof Error && caught.message ? caught.message : GENERIC_ERROR);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <Button
        size="lg"
        withArrow={!isLoading}
        onClick={handleCheckout}
        disabled={isLoading || lines.length === 0}
        aria-busy={isLoading}
        className="w-full"
      >
        {isLoading ? "Even geduld…" : "Afrekenen"}
      </Button>
      <p role="alert" aria-live="assertive" className="min-h-0 text-sm text-danger empty:hidden">
        {error}
      </p>
    </div>
  );
}
