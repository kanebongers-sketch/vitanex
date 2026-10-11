import Link from "next/link";
import { FAQ } from "@rv/content/home";
import type { Product } from "@rv/lib/commerce/types";
import { Container } from "@rv/components/ui/Container";
import { Faq } from "@rv/components/ui/Faq";
import { SectionHeading } from "./SectionHeading";

/** Twee kolommen: kop links (sticky op desktop), vragen rechts. */
export function HomeFaq({ product }: { product: Product }) {
  const items = [...product.faq, ...FAQ.extraItems];

  return (
    <section aria-labelledby="faq-title" className="border-t border-line py-section">
      <Container className="grid gap-12 lg:grid-cols-12 lg:gap-x-10">
        <div className="lg:sticky lg:top-28 lg:col-span-4 lg:self-start">
          <SectionHeading id="faq-title" intro={FAQ.intro} isStatement />
          <p className="mt-8 text-sm text-ink-muted">
            Staat je vraag er niet bij?{" "}
            <Link href="/contact" className="link-underline pb-0.5 font-semibold text-ink transition-colors hover:text-accent">
              Neem contact op
            </Link>
          </p>
        </div>
        <Faq items={items} className="lg:col-span-7 lg:col-start-6" />
      </Container>
    </section>
  );
}
