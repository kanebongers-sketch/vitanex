import Image from "next/image";
import Link from "next/link";
import type { Spec } from "@rv/lib/commerce/types";
import { SITE } from "@rv/config/site";
import { IMAGES } from "@rv/config/images";
import { SHIPPING_BLOCK } from "@rv/content/product-page";
import { Container } from "@rv/components/ui/Container";
import { Eyebrow } from "@rv/components/ui/Eyebrow";

/** Specificaties als definitielijst met dunne lijnen. Waarden tussen [HAKEN] invullen voor livegang. */
export function SpecList({ specs }: { specs: readonly Spec[] }) {
  return (
    <section aria-labelledby="specificaties" className="grid gap-10 lg:grid-cols-12 lg:gap-16">
      <div className="lg:col-span-4">
        <Eyebrow index="05">Specificaties</Eyebrow>
        <h2 id="specificaties" className="mt-5 font-display text-display-lg uppercase">
          De details.
        </h2>
      </div>
      <dl className="grid border-t border-line md:grid-cols-2 md:gap-x-12 lg:col-span-8">
        {specs.map((spec) => (
          <div key={spec.label} className="flex flex-col gap-1.5 border-b border-line py-5">
            <dt className="text-eyebrow font-semibold uppercase text-ink-muted">{spec.label}</dt>
            <dd className="text-ink leading-snug">{spec.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

const SHIPPING_POINTS = [
  { title: "Verzending", body: `${SITE.shipping.freeLabel}. ${SITE.shipping.deliveryLabel}.` },
  {
    title: `${SITE.shipping.returnDays} dagen bedenktijd`,
    body: "Na ontvangst. Stuur de kit ongebruikt en compleet terug en je krijgt je geld terug.",
  },
  { title: "Veilig betalen", body: "Afrekenen met iDEAL, Bancontact, creditcard of achteraf met Klarna, via Stripe." },
] as const;

/** Wat er gebeurt na het afrekenen: neemt de laatste onzekerheid weg. */
const AFTER_ORDER = [
  { title: "Bevestiging", body: "Direct een mail met je bestelling." },
  { title: "Onderweg", body: `Gratis bezorgd, ${SITE.shipping.deliveryLabel.toLowerCase()}.` },
  { title: "Scan de QR", body: "Kies je variant: kantoor, hardlopen of kracht." },
  { title: "Dag 1", body: "Je eerste sessie van 10 tot 15 minuten." },
] as const;

function AfterOrder() {
  return (
    <div className="mt-12">
      <h3 className="text-eyebrow font-semibold uppercase text-on-ink-muted">Na je bestelling</h3>
      <ol className="mt-5 grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4">
        {AFTER_ORDER.map((step, index) => (
          <li key={step.title} className="flex flex-col gap-1.5 border-t border-on-ink/15 pt-4">
            <span className="font-display text-2xl font-extrabold tabular-nums">{String(index + 1).padStart(2, "0")}</span>
            <span className="font-semibold leading-tight">{step.title}</span>
            <span className="text-sm leading-snug text-on-ink-muted">{step.body}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Lichte contrastband (full-bleed) met verzend- en retourinformatie. */
export function ShippingInfo() {
  return (
    <section aria-labelledby="verzending" className="bg-ink py-section-sm text-on-ink">
      <Container className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="flex flex-col lg:col-span-7">
          <Eyebrow tone="inverted">
            {SHIPPING_BLOCK.eyebrow}
          </Eyebrow>
          <h2 id="verzending" className="mt-5 max-w-[14ch] font-display text-display-lg uppercase text-balance">
            {SHIPPING_BLOCK.title}
          </h2>
          <ul className="mt-12 grid border-t border-on-ink/15 sm:grid-cols-3">
            {SHIPPING_POINTS.map((point, index) => (
              <li
                key={point.title}
                className={`flex flex-col gap-2 border-b border-on-ink/15 py-6 sm:border-b-0 ${index > 0 ? "sm:border-l sm:pl-6" : ""} sm:pr-6`}
              >
                <h3 className="font-display text-lg font-bold leading-tight">{point.title}</h3>
                <p className="text-sm leading-relaxed text-on-ink-muted">{point.body}</p>
              </li>
            ))}
          </ul>
          <AfterOrder />
          <Link
            href="/retourbeleid"
            className="link-underline mt-8 inline-flex w-fit items-center gap-2 pb-0.5 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-on-ink"
          >
            {SHIPPING_BLOCK.linkLabel}
            <svg aria-hidden viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M2 8h11M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
        <div className="group relative hidden overflow-hidden rounded-card bg-ink-raised lg:col-span-5 lg:block">
          <Image
            src={IMAGES.runnerTunnel.src}
            alt={IMAGES.runnerTunnel.alt}
            fill
            sizes="35vw"
            className="object-cover transition-transform duration-700 ease-calm group-hover:scale-[1.03]"
          />
        </div>
      </Container>
    </section>
  );
}
