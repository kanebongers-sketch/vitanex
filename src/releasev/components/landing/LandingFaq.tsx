import type { FaqItem } from "@rv/lib/commerce/types";
import { Container } from "@rv/components/ui/Container";
import { Eyebrow } from "@rv/components/ui/Eyebrow";
import { Faq } from "@rv/components/ui/Faq";

/** Doelgroepspecifieke vragen, in hetzelfde 4/8-raster als de productpagina. */
export function LandingFaq({ items }: { items: readonly FaqItem[] }) {
  return (
    <section aria-labelledby="landing-faq-title" className="py-section-sm">
      <Container className="grid gap-10 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-4">
          <Eyebrow index="05">Vragen</Eyebrow>
          <h2 id="landing-faq-title" className="mt-5 font-display text-display-lg uppercase">
            Goed om te weten.
          </h2>
        </div>
        <Faq items={items} className="lg:col-span-8" />
      </Container>
    </section>
  );
}
