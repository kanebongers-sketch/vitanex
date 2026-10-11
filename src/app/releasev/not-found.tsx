import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { IMAGES } from "@rv/config/images";
import { MAIN_NAV, PRODUCT_PATH } from "@rv/config/site";
import { Container } from "@rv/components/ui/Container";
import { ButtonLink } from "@rv/components/ui/Button";

export const metadata: Metadata = {
  title: "Pagina niet gevonden",
  description: "Deze pagina bestaat niet (meer). Ga terug naar de homepage of bekijk de Recovery & Mobility Kit.",
  robots: { index: false, follow: true },
  alternates: { canonical: null },
};

export default function NotFound() {
  return (
    <>
      <section aria-labelledby="niet-gevonden-titel" className="relative isolate flex min-h-[70svh] items-end overflow-hidden">
        <Image src={IMAGES.runnerNight.src} alt={IMAGES.runnerNight.alt} fill priority sizes="100vw" className="-z-20 object-cover object-[65%_center]" />
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-canvas via-canvas/60 to-canvas/20" />
        <Container className="pb-14 pt-32 sm:pb-20">
          <p className="flex items-center gap-3 text-eyebrow font-semibold uppercase text-ink-soft">
            <span aria-hidden className="size-1.5 rounded-full bg-accent" />
            404 · Pagina niet gevonden
          </p>
          <h1 id="niet-gevonden-titel" className="mt-6 max-w-5xl font-display text-display-xl uppercase">
            <span className="block">Even pauze.</span>
            <span className="block text-ink-soft">Deze pagina is er niet.</span>
          </h1>
          <p className="mt-8 max-w-[32rem] text-lead text-ink-soft">
            De link klopt niet meer of de pagina is verplaatst. Geen haast: kies hieronder waar je verder wilt.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <ButtonLink href="/" size="lg" withArrow>Naar de homepage</ButtonLink>
            <ButtonLink href={PRODUCT_PATH} size="lg" variant="secondary">Bekijk de kit</ButtonLink>
          </div>
        </Container>
      </section>

      <nav aria-label="Populaire pagina's" className="pb-section pt-section-sm">
        <Container>
          <p className="text-eyebrow font-semibold uppercase text-ink-muted">Misschien zocht je</p>
          <ul className="mt-6 grid border-t border-line sm:grid-cols-2 lg:grid-cols-4">
            {MAIN_NAV.map((item, i) => (
              <li key={item.href} className={`border-b border-line ${i > 0 ? "sm:border-l sm:pl-6" : ""}`}>
                <Link href={item.href} className="group flex items-center justify-between py-6 pr-4 font-display text-2xl font-bold uppercase tracking-tight transition-colors duration-300 hover:text-accent">
                  {item.label}
                  <span aria-hidden className="text-base transition-transform duration-300 ease-calm group-hover:translate-x-1">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </nav>
    </>
  );
}
