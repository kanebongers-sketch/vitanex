import Image from "next/image";
import Link from "next/link";
import { SITE, PRODUCT_PATH } from "@rv/config/site";
import { IMAGES } from "@rv/config/images";
import { HERO, PROOF_BAR } from "@rv/content/home";
import { formatMoney } from "@rv/lib/format";
import type { Product } from "@rv/lib/commerce";
import { ButtonLink } from "@rv/components/ui/Button";
import { Container } from "@rv/components/ui/Container";

/** Full-bleed hero. Bewust niet geanimeerd: kop en beeld zijn LCP-kandidaten. */
export function Hero({ product }: { product: Product }) {
  const price = formatMoney(product.price);

  return (
    <>
      <section aria-labelledby="hero-title" className="relative isolate flex min-h-[calc(100svh-6rem)] items-end overflow-hidden">
        <Image
          src={IMAGES.hero.src}
          alt={IMAGES.hero.alt}
          fill
          priority
          quality={60}
          sizes="100vw"
          className="-z-20 object-cover object-[70%_center] md:object-center"
        />
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-canvas via-canvas/55 to-canvas/10" />
        <div aria-hidden className="absolute inset-0 -z-10 hidden bg-gradient-to-r from-canvas/85 via-canvas/30 to-transparent md:block" />

        <Container className="grid gap-10 pb-10 pt-32 sm:pb-14 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <p className="flex items-center gap-3 text-eyebrow font-semibold uppercase text-ink-soft">
              <span aria-hidden className="size-1.5 rounded-full bg-accent" />
              {HERO.eyebrow}
            </p>

            <h1 id="hero-title" className="mt-6 font-display text-display-2xl uppercase">
              {HERO.titleLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </h1>

            <p className="mt-6 max-w-[30rem] text-lead text-ink-soft">{HERO.lead}</p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <ButtonLink href={PRODUCT_PATH} size="lg" withArrow>
                {HERO.primaryCta}
                <span aria-hidden className="h-4 w-px bg-on-ink/25" />
                <span>{price}</span>
              </ButtonLink>
              <ButtonLink href="/programma" variant="secondary" size="lg">
                {HERO.secondaryCta}
              </ButtonLink>
            </div>

            <nav aria-label={HERO.useCaseLabel} className="mt-8 flex flex-wrap items-center gap-2">
              <span className="mr-2 w-full text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted sm:w-auto">
                {HERO.useCaseLabel}
              </span>
              {HERO.useCases.map((useCase) => (
                <Link
                  key={useCase.href}
                  href={useCase.href}
                  className="rounded-full border border-ink/20 bg-canvas/40 px-4 py-2 text-sm font-medium text-ink backdrop-blur-md transition-[background-color,color,border-color,transform] duration-300 ease-calm hover:-translate-y-0.5 hover:border-ink hover:bg-ink hover:text-on-ink"
                >
                  {useCase.label}
                </Link>
              ))}
            </nav>
          </div>

          <p className="hidden max-w-[17rem] justify-self-end rounded-card border border-ink/10 bg-canvas/50 p-5 backdrop-blur-xl lg:col-span-4 lg:block">
            <span className="block text-eyebrow font-semibold uppercase text-accent">{HERO.credit}</span>
            <span className="mt-3 block font-display text-xl font-bold leading-tight">{SITE.trainer.name}</span>
            <span className="mt-1 block text-sm leading-snug text-ink-soft">{SITE.trainer.role}</span>
          </p>
        </Container>
      </section>

      <section aria-label="In het kort" className="border-y border-line">
        <Container>
          <ul className="grid grid-cols-2 lg:grid-cols-4">
            {PROOF_BAR.map((item, index) => (
              <li
                key={item.label}
                className={`flex flex-col gap-1 py-6 sm:py-8 ${index % 2 === 1 ? "border-l border-line pl-5" : "pr-5"} ${
                  index > 1 ? "border-t border-line lg:border-t-0" : ""
                } ${index > 0 ? "lg:border-l lg:pl-8" : ""}`}
              >
                <span className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">{item.value}</span>
                <span className="text-sm text-ink-muted">{item.label}</span>
              </li>
            ))}
          </ul>
        </Container>
      </section>
    </>
  );
}
