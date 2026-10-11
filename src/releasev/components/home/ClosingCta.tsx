import Image from "next/image";
import { PRODUCT_PATH } from "@rv/config/site";
import { IMAGES } from "@rv/config/images";
import { CLOSING } from "@rv/content/home";
import { formatMoney } from "@rv/lib/format";
import type { Product } from "@rv/lib/commerce/types";
import { ButtonLink } from "@rv/components/ui/Button";
import { Container } from "@rv/components/ui/Container";
import { PaymentBadges } from "@rv/components/ui/PaymentBadges";
import { TrustList } from "@rv/components/ui/TrustList";

/** Full-bleed afsluiter: groot statement op beeld, prijs en actie in een glazen paneel. */
export function ClosingCta({ product }: { product: Product }) {
  return (
    <section aria-labelledby="afsluiter-title" className="relative isolate flex min-h-[44rem] items-end overflow-hidden lg:min-h-[90svh]">
      <Image
        src={IMAGES.rollerTopdown.src}
        alt={IMAGES.rollerTopdown.alt}
        fill
        sizes="100vw"
        className="-z-20 object-cover object-center"
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-canvas via-canvas/60 to-canvas/20" />
      <div aria-hidden className="absolute inset-0 -z-10 hidden bg-gradient-to-r from-canvas/80 via-canvas/20 to-transparent md:block" />

      <Container className="grid gap-10 pb-12 pt-40 sm:pb-16 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-7">
          <p className="flex items-center gap-3 text-eyebrow font-semibold uppercase text-ink-soft">
            <span aria-hidden className="size-1.5 rounded-full bg-accent" />
            {CLOSING.eyebrow}
          </p>
          <h2 id="afsluiter-title" className="mt-6 font-display text-display-xl uppercase">
            {CLOSING.titleLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h2>
          <p className="mt-6 max-w-[30rem] text-lead text-ink-soft">{CLOSING.lead}</p>
        </div>

        <div className="flex flex-col gap-6 rounded-card border border-ink/10 bg-canvas/55 p-6 backdrop-blur-xl sm:p-8 lg:col-span-4 lg:col-start-9">
          <p className="flex items-baseline gap-3">
            <span className="font-display text-5xl font-extrabold leading-none tracking-tight">{formatMoney(product.price)}</span>
            <span className="text-sm text-ink-muted">{CLOSING.priceNote}</span>
          </p>
          <ButtonLink href={PRODUCT_PATH} size="lg" withArrow className="w-full">
            {CLOSING.cta}
          </ButtonLink>
          <TrustList className="border-t border-ink/10 pt-6" />
          <PaymentBadges />
        </div>
      </Container>
    </section>
  );
}
