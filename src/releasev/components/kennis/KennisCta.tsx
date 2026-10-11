import Image from "next/image";
import { PRODUCT_PATH } from "@rv/config/site";
import { IMAGES } from "@rv/config/images";
import { KENNIS_PAGE } from "@rv/content/kennis";
import { ButtonLink } from "@rv/components/ui/Button";
import { Container } from "@rv/components/ui/Container";

/** Lichte contrastband met de afsluitende CTA naar de kit. */
export function KennisCta() {
  return (
    <section aria-labelledby="kennis-cta" className="bg-ink text-on-ink">
      <Container className="grid gap-10 py-section-sm lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-7">
          <p className="flex items-center gap-3 text-eyebrow font-semibold uppercase text-on-ink-muted">
            <span aria-hidden className="size-1.5 rounded-full bg-on-ink" />
            Recovery &amp; Mobility Kit
          </p>
          <h2 id="kennis-cta" className="mt-5 font-display text-display-lg uppercase">
            {KENNIS_PAGE.ctaTitle}
          </h2>
          <p className="mt-6 max-w-[34rem] text-lead text-on-ink-muted">{KENNIS_PAGE.ctaLead}</p>
          <ButtonLink href={PRODUCT_PATH} variant="inverted" size="lg" withArrow className="mt-8">
            {KENNIS_PAGE.ctaButton}
          </ButtonLink>
        </div>
        <div className="relative aspect-[4/3] overflow-hidden rounded-card bg-ink-raised lg:col-span-5">
          <Image
            src={IMAGES.rollerTopdown.src}
            alt={IMAGES.rollerTopdown.alt}
            fill
            quality={60}
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="object-cover"
          />
        </div>
      </Container>
    </section>
  );
}
