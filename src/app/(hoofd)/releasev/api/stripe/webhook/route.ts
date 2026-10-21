import { NextResponse } from "next/server";
import type Stripe from "stripe-rv";
import { SITE } from "@rv/config/site";
import { getStripe, getWebhookSecret } from "@rv/lib/stripe";
import { formatMoney } from "@rv/lib/format";
import { sendEmail } from "@rv/lib/email";
import { orderConfirmationEmail, reviewRequestEmail } from "@rv/lib/email-templates";
import { sendPurchaseEvent } from "@rv/lib/meta-capi";

/**
 * Stripe webhook. Lokaal testen:
 *   stripe listen --forward-to localhost:3000/api/stripe/webhook
 * en zet de getoonde whsec_... in RELEASEV_STRIPE_WEBHOOK_SECRET.
 *
 * Events in het Stripe-dashboard aanzetten:
 *   checkout.session.completed en checkout.session.async_payment_succeeded
 *
 * Alle acties zijn idempotent (vaste sleutels per sessie), dus als Stripe een
 * event opnieuw stuurt, krijgt de klant geen dubbele mails.
 */
const REVIEW_DELAY_DAYS = 12; // ± 10 dagen na levering

/** Deterministisch (op basis van het event): een Stripe-retry levert dezelfde payload op, anders weigert Resend de idempotency-key. */
function addDays(date: Date, days: number): string {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
}

async function runSafely(label: string, task: () => Promise<unknown>): Promise<boolean> {
  try {
    await task();
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    console.error(`[webhook] ${label} mislukt:`, message);
    return false;
  }
}

/** Verwerkt een betaalde bestelling. Geeft false als iets opnieuw geprobeerd moet worden. */
async function handlePaidOrder(session: Stripe.Checkout.Session, eventCreatedSeconds: number): Promise<boolean> {
  const email = session.customer_details?.email ?? null;
  const name = session.customer_details?.name ?? null;
  const metadata = session.metadata ?? {};
  const amount = session.amount_total ?? 0;
  // TODO(fulfilment): bestelling doorzetten naar je leverancier/fulfilmentpartij.
  console.info(`[webhook] Betaalde bestelling: session=${session.id} bedrag=${amount} cadeau=${metadata.gift ?? "nee"}`);

  const tasks: Promise<boolean>[] = [
    runSafely("Meta CAPI", () =>
      sendPurchaseEvent({
        eventId: session.id,
        eventTimeSeconds: session.created,
        value: amount / 100,
        currency: session.currency ?? "eur",
        email,
        sourceUrl: `${SITE.url}/bedankt`,
        metadata,
      }),
    ),
  ];

  if (email) {
    const confirmation = orderConfirmationEmail({
      customerName: name,
      amountLabel: formatMoney({ amount, currency: "EUR" }),
      orderReference: session.id.slice(-10).toUpperCase(),
      isGift: metadata.gift === "ja",
    });
    tasks.push(
      runSafely("Orderbevestiging", () =>
        sendEmail({ to: email, content: confirmation, idempotencyKey: `order-confirmation/${session.id}` }),
      ),
      runSafely("Reviewverzoek inplannen", () =>
        sendEmail({
          to: email,
          content: reviewRequestEmail({ customerName: name }),
          scheduledAt: addDays(new Date(eventCreatedSeconds * 1000), REVIEW_DELAY_DAYS),
          idempotencyKey: `review-request/${session.id}`,
        }),
      ),
    );
  }

  const results = await Promise.all(tasks);
  return results.every(Boolean);
}

function isPaidCheckoutEvent(event: Stripe.Event): event is Stripe.Event & { data: { object: Stripe.Checkout.Session } } {
  if (event.type === "checkout.session.async_payment_succeeded") return true;
  return event.type === "checkout.session.completed" && event.data.object.payment_status === "paid";
}

export async function POST(req: Request) {
  const stripe = getStripe();
  const secret = getWebhookSecret();
  if (!stripe || !secret) {
    return NextResponse.json({ success: false, error: "Webhook niet geconfigureerd." }, { status: 503 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ success: false, error: "Ontbrekende handtekening." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const rawBody = await req.text();
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    console.error("[webhook] Ongeldige handtekening:", message);
    return NextResponse.json({ success: false, error: "Ongeldige handtekening." }, { status: 400 });
  }

  if (!isPaidCheckoutEvent(event)) {
    return NextResponse.json({ success: true, data: { received: true } });
  }

  const isHandled = await handlePaidOrder(event.data.object, event.created);
  if (!isHandled) {
    // 500 → Stripe probeert het later opnieuw; dankzij de idempotency-keys zonder dubbele mails.
    return NextResponse.json({ success: false, error: "Verwerken deels mislukt." }, { status: 500 });
  }
  return NextResponse.json({ success: true, data: { received: true } });
}
