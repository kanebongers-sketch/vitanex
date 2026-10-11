import type { Metadata } from "next";
import { SITE, PRODUCT_PATH } from "@rv/config/site";
import { isValidSessionId, maskEmail } from "@rv/lib/checkout";
import { formatMoney } from "@rv/lib/format";
import { getStripe } from "@rv/lib/stripe";
import { Container } from "@rv/components/ui/Container";
import { ButtonLink } from "@rv/components/ui/Button";
import { ClearCartOnMount } from "@rv/components/cart/ClearCartOnMount";
import { TrackPurchase } from "@rv/components/cart/TrackPurchase";

export const metadata: Metadata = {
  title: "Bedankt voor je bestelling",
  robots: { index: false, follow: false },
};

interface ThankYouPageProps {
  searchParams: Promise<{ session_id?: string | string[] }>;
}

interface OrderSummary {
  id: string;
  email: string | null;
  amountLabel: string | null;
  amountCents: number | null;
}

async function loadOrder(sessionId: unknown): Promise<OrderSummary | null> {
  const stripe = getStripe();
  if (!stripe || !isValidSessionId(sessionId)) return null;
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const amount = session.amount_total;
    return {
      id: session.id,
      amountCents: typeof amount === "number" ? amount : null,
      email: maskEmail(session.customer_details?.email),
      amountLabel: typeof amount === "number" ? formatMoney({ amount, currency: "EUR" }) : null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    console.error("[bedankt] Sessie ophalen mislukt:", message);
    return null;
  }
}

const NEXT_STEPS = [
  {
    title: "Bevestiging in je mail",
    body: "Je ontvangt binnen een paar minuten een bevestigingsmail met je bestelgegevens. Niets ontvangen? Kijk ook even in je spam.",
  },
  {
    title: "Onderweg naar je toe",
    body: `We pakken je kit zorgvuldig in. ${SITE.shipping.deliveryLabel}, gratis in Nederland en België.`,
  },
  {
    title: "Scan en begin",
    body: "In de doos zit een kaart met een QR-code. Scan hem, kies je variant en start met het 14-dagenprogramma.",
  },
] as const;

function OrderDetails({ order }: { order: OrderSummary }) {
  if (!order.email && !order.amountLabel) return null;
  return (
    <dl className="mt-12 grid gap-px overflow-hidden rounded-card border border-line bg-line sm:grid-cols-2">
      {order.amountLabel && (
        <div className="bg-surface p-6">
          <dt className="text-eyebrow font-semibold uppercase text-ink-muted">Totaalbedrag</dt>
          <dd className="mt-3 font-display text-3xl font-bold tabular-nums">{order.amountLabel}</dd>
        </div>
      )}
      {order.email && (
        <div className="bg-surface p-6">
          <dt className="text-eyebrow font-semibold uppercase text-ink-muted">Bevestiging naar</dt>
          <dd className="mt-3 break-all font-display text-3xl font-bold">{order.email}</dd>
        </div>
      )}
    </dl>
  );
}

export default async function ThankYouPage({ searchParams }: ThankYouPageProps) {
  const { session_id: sessionId } = await searchParams;
  const order = await loadOrder(sessionId);

  return (
    <section aria-labelledby="bedankt-titel" className="pb-section pt-12 md:pt-20">
      <ClearCartOnMount />
      {order?.amountCents != null && <TrackPurchase value={order.amountCents / 100} transactionId={order.id} />}
      <Container>
        <div className="max-w-5xl">
          <p className="flex items-center gap-3 text-eyebrow font-semibold uppercase text-ink-soft">
            <span aria-hidden className="size-1.5 rounded-full bg-success" />
            Bestelling ontvangen
          </p>
          <h1 id="bedankt-titel" className="mt-6 font-display text-display-xl uppercase">
            <span className="block">Bedankt.</span>
            <span className="block text-ink-muted">Je kit is besteld.</span>
          </h1>
          <p className="mt-8 max-w-[34rem] text-lead text-ink-soft">
            Fijn dat je voor {SITE.brandName} kiest. We gaan direct voor je aan de slag.
          </p>
          {order && <OrderDetails order={order} />}
        </div>

        <h2 className="mt-20 flex items-center gap-3 text-eyebrow font-semibold uppercase text-ink-muted lg:mt-28">
          <span aria-hidden className="size-1.5 rounded-full bg-accent" />
          Wat er nu gebeurt
        </h2>
        <ol className="mt-8 grid border-t border-line md:grid-cols-3">
          {NEXT_STEPS.map((step, index) => (
            <li key={step.title} className={`border-b border-line py-8 md:border-b-0 md:pr-8 ${index > 0 ? "md:border-l md:pl-8" : ""}`}>
              <span className="block font-display text-7xl font-extrabold leading-none tracking-tight tabular-nums">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-8 font-display text-2xl font-bold leading-tight">{step.title}</h3>
              <p className="mt-3 max-w-[30rem] leading-relaxed text-ink-soft">{step.body}</p>
            </li>
          ))}
        </ol>

        <div className="mt-14 flex flex-col gap-4 border-t border-line pt-10 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <ButtonLink href="/programma" size="lg" withArrow>
              Over het programma
            </ButtonLink>
            <ButtonLink href={PRODUCT_PATH} size="lg" variant="secondary">
              Terug naar de kit
            </ButtonLink>
          </div>
          <p className="max-w-[24rem] text-sm text-ink-muted">
            Vragen over je bestelling? Mail naar {SITE.contact.email}. {SITE.contact.responseTime}
          </p>
        </div>
      </Container>
    </section>
  );
}
