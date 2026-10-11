import Image from "next/image";
import { IMAGES } from "@rv/config/images";
import { SITE } from "@rv/config/site";
import type { LandingContent } from "@rv/content/landing";
import { Container } from "@rv/components/ui/Container";
import { Eyebrow } from "@rv/components/ui/Eyebrow";
import { PaymentBadges } from "@rv/components/ui/PaymentBadges";
import { StockBadge } from "@rv/components/ui/StockBadge";
import { InTheBox } from "@rv/components/product/InTheBox";
import { TrustBadges } from "@rv/components/product/TrustBadges";
import { AddToCartButton } from "./AddToCartButton";

export const OFFER_ID = "bestellen";

const LOCATIONS = SITE.trainer.credentials.find((item) => item.label === "PT-locaties");
const CREDIT = LOCATIONS
  ? `Ontwikkeld door ${SITE.trainer.name} en het team achter ${LOCATIONS.value} ${LOCATIONS.label}`
  : `Ontwikkeld door ${SITE.trainer.name}`;

interface OfferBlockProps {
  intro: LandingContent["offer"];
  productId: string;
  productName: string;
  priceLabel: string;
  priceValue: number;
  boxItems: readonly string[];
}

/** Het aanbod: beeld van de kit links, koopblok rechts. */
export function OfferBlock({ intro, productId, productName, priceLabel, priceValue, boxItems }: OfferBlockProps) {
  return (
    <section id={OFFER_ID} aria-labelledby="aanbod-title" className="border-t border-line py-section-sm">
      <Container className="grid gap-10 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-6">
          <Eyebrow index="04">Het aanbod</Eyebrow>
          <h2 id="aanbod-title" className="mt-5 font-display text-display-lg uppercase text-balance">
            {intro.title}
          </h2>

          <figure className="group relative mt-10 aspect-[4/3] overflow-hidden rounded-card bg-surface-strong">
            <Image
              src={IMAGES.rollerTopdown.src}
              alt={IMAGES.rollerTopdown.alt}
              fill
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="object-cover transition-transform duration-700 ease-calm group-hover:scale-[1.03]"
            />
            <StockBadge src={IMAGES.rollerTopdown.src} className="left-3 top-3" />
            <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-canvas via-canvas/70 to-transparent p-5 pt-16 sm:p-7 sm:pt-20">
              <span className="block text-eyebrow font-semibold uppercase text-accent">{CREDIT}</span>
              <span className="mt-2 block max-w-[28rem] text-sm text-ink-soft">
                {SITE.trainer.name} leidt zelf trainers op.
              </span>
            </figcaption>
          </figure>
        </div>

        <div className="lg:col-span-6 lg:pt-24">
          <div className="rounded-panel border border-line bg-surface p-6 shadow-lift sm:p-8">
            <p className="text-eyebrow font-semibold uppercase text-ink-muted">{productName}</p>
            <p className="mt-3 max-w-[30rem] text-ink-soft">{intro.lead}</p>
            <p className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="font-display text-6xl font-extrabold tracking-tight tabular-nums">{priceLabel}</span>
              <span className="text-sm text-ink-muted">incl. btw · gratis verzending</span>
            </p>

            <AddToCartButton productId={productId} priceValue={priceValue} className="mt-7 w-full">
              In winkelwagen
            </AddToCartButton>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-ink-muted">Veilig afrekenen via Stripe</p>
              <PaymentBadges />
            </div>

            <TrustBadges className="mt-8" />
            <InTheBox items={boxItems} className="mt-8" />
          </div>
        </div>
      </Container>
    </section>
  );
}
