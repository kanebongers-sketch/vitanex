import Image from "next/image";
import type { LandingContent } from "@rv/content/landing";
import { SITE } from "@rv/config/site";
import { cn } from "@rv/lib/cn";
import { Container } from "@rv/components/ui/Container";
import { AddToCartButton } from "./AddToCartButton";

export const LANDING_HERO_ID = "landing-hero";

interface LandingHeroProps {
  hero: LandingContent["hero"];
  productId: string;
  priceLabel: string;
  priceValue: number;
  /** Anker van de sectie "Zo ziet een dag eruit" */
  howItWorksHref: string;
}

/** Full-bleed hero met directe bestelknop. Niet geanimeerd: kop en beeld zijn LCP-kandidaten. */
export function LandingHero({ hero, productId, priceLabel, priceValue, howItWorksHref }: LandingHeroProps) {
  return (
    <section
      id={LANDING_HERO_ID}
      aria-labelledby="landing-title"
      className="relative isolate flex min-h-[calc(100svh-6rem)] items-end overflow-hidden"
    >
      <Image
        src={hero.image.src}
        alt={hero.image.alt}
        fill
        priority
        quality={60}
        sizes="100vw"
        className={cn("-z-20 object-cover md:object-center", hero.imagePosition)}
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-canvas via-canvas/60 to-canvas/10" />
      <div aria-hidden className="absolute inset-0 -z-10 hidden bg-gradient-to-r from-canvas/85 via-canvas/30 to-transparent md:block" />

      <Container className="grid gap-10 pb-10 pt-32 sm:pb-14 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-10">
          <p className="flex items-center gap-3 text-eyebrow font-semibold uppercase text-ink-soft">
            <span aria-hidden className="size-1.5 rounded-full bg-accent" />
            {hero.eyebrow}
          </p>

          <h1 id="landing-title" className="mt-6 font-display text-display-2xl uppercase lg:text-display-xl">
            {hero.titleLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h1>

          <p className="mt-6 max-w-[30rem] text-lead text-ink-soft text-pretty">{hero.lead}</p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <AddToCartButton productId={productId} priceValue={priceValue}>
              In winkelwagen
              <span aria-hidden className="h-4 w-px bg-on-ink/25" />
              <span className="tabular-nums">{priceLabel}</span>
            </AddToCartButton>
            <a
              href={howItWorksHref}
              className="inline-flex h-14 items-center justify-center gap-2 rounded-full px-6 font-medium text-ink transition-colors duration-300 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Zo werkt het
              <svg aria-hidden viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M8 2.5v11M4 9.5l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>

          <p className="mt-4 text-sm text-ink-muted">
            Incl. btw · {SITE.shipping.freeLabel} · {SITE.shipping.returnDays} dagen bedenktijd
          </p>
        </div>
      </Container>
    </section>
  );
}
