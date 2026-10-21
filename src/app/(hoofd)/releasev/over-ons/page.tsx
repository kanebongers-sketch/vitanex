import type { Metadata } from "next";
import Image from "next/image";
import { PRODUCT_PATH, SITE } from "@rv/config/site";
import { QuoteBand } from "@rv/components/ui/QuoteBand";
import { Container } from "@rv/components/ui/Container";
import { Eyebrow } from "@rv/components/ui/Eyebrow";
import { ButtonLink } from "@rv/components/ui/Button";
import { Reveal } from "@rv/components/ui/Reveal";
import {
  ABOUT_CTA,
  ABOUT_DETAILS,
  ABOUT_HERO,
  ABOUT_STORY,
  ABOUT_VALUES,
} from "@rv/content/over-ons";

export const metadata: Metadata = {
  title: "Over ons",
  description: `Het verhaal achter ${SITE.brandName}: een recovery- en mobilitykit ontwikkeld door Kane: personal trainer met 8 PT-locaties en een team van coaches, die zelf trainers opleidt. Rustig, deskundig, gemaakt om vol te houden.`,
  alternates: { canonical: "/over-ons" },
};

function Hero() {
  return (
    <section aria-labelledby="over-titel" className="pt-10 pb-section-sm md:pt-16">
      <Container className="grid gap-12 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-7 lg:pb-6">
          <p className="flex items-center gap-3 text-eyebrow font-semibold uppercase text-ink-soft">
            <span aria-hidden className="size-1.5 rounded-full bg-accent" />
            {ABOUT_HERO.eyebrow}
          </p>
          <h1 id="over-titel" className="mt-6 font-display text-display-lg uppercase [font-stretch:112%] [font-weight:800]">
            {ABOUT_HERO.titleLines.map((line) => (
              <span key={line} className="block">{line}</span>
            ))}
            <span className="mt-5 block text-2xl text-ink-muted sm:text-3xl">{ABOUT_HERO.subtitle}</span>
          </h1>
          <p className="mt-8 max-w-[34rem] text-lead text-ink-soft">{ABOUT_HERO.lead}</p>
        </div>

        <figure className="lg:col-span-5">
          <div className="relative aspect-[4/5] overflow-hidden rounded-card bg-surface">
            <Image src={ABOUT_HERO.portrait.src} alt={ABOUT_HERO.portraitAlt} fill priority sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover grayscale" />
            <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-canvas/80 via-transparent to-transparent" />
            <span className="absolute left-4 top-4 rounded-full bg-accent px-2.5 py-1 text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-on-ink">
              {ABOUT_HERO.portraitNote}
            </span>
          </div>
          <figcaption className="mt-4 flex items-baseline justify-between gap-4 border-t border-line pt-4">
            <span className="font-display text-lg font-bold">{SITE.trainer.name}</span>
            <span className="text-right text-sm text-ink-muted">{SITE.trainer.role}</span>
          </figcaption>
        </figure>
      </Container>
    </section>
  );
}

/** Feitenrij met de achtergrond van de trainer: grote Archivo-waarden, dunne lijnen. */
function Credentials() {
  return (
    <section aria-label="Achtergrond van de trainer" className="border-y border-line">
      <Container>
        <dl className="grid sm:grid-cols-3">
          {SITE.trainer.credentials.map((item, index) => (
            <div
              key={item.label}
              className={`flex flex-col-reverse justify-end gap-2 py-8 sm:py-10 ${index > 0 ? "border-t border-line sm:border-l sm:border-t-0 sm:pl-8" : "sm:pr-8"}`}
            >
              <dt className="max-w-[16rem] text-sm text-ink-muted">{item.label}</dt>
              <dd className="font-display text-5xl font-extrabold uppercase tracking-tight sm:text-6xl">{item.value}</dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}

function Story() {
  return (
    <section aria-labelledby="verhaal-titel" className="py-section">
      <Container>
        <Eyebrow index={ABOUT_STORY.index}>{ABOUT_STORY.eyebrow}</Eyebrow>
        <h2 id="verhaal-titel" className="mt-6 max-w-4xl font-display text-display-lg">{ABOUT_STORY.title}</h2>
        <div className="mt-14 grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="group relative aspect-[4/3] overflow-hidden rounded-card bg-surface lg:sticky lg:top-24">
              <Image src={ABOUT_STORY.image.src} alt={ABOUT_STORY.image.alt} fill sizes="(min-width: 1024px) 55vw, 100vw" className="object-cover transition-transform duration-700 ease-calm group-hover:scale-[1.03]" />
            </div>
          </div>
          <div className="space-y-6 text-lead text-ink-soft lg:col-span-5">
            {ABOUT_STORY.paragraphs.map((paragraph, i) => (
              <Reveal key={paragraph} delay={i * 0.05}>
                <p className={i === 0 ? "text-ink" : undefined}>{paragraph}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

function Values() {
  return (
    <section aria-labelledby="waarden-titel" className="py-section">
      <Container>
        <Eyebrow index={ABOUT_VALUES.index}>{ABOUT_VALUES.eyebrow}</Eyebrow>
        <h2 id="waarden-titel" className="mt-6 max-w-3xl font-display text-display-lg">{ABOUT_VALUES.title}</h2>
        <ol className="mt-16 border-b border-line">
          {ABOUT_VALUES.items.map((value, i) => (
            <Reveal as="li" key={value.name} delay={i * 0.06} className="grid gap-4 border-t border-line py-10 lg:grid-cols-12 lg:items-baseline lg:gap-8 lg:py-14">
              <span className="font-display text-sm font-bold text-accent lg:col-span-1">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="break-words font-display text-display-lg uppercase lg:col-span-6">{value.name}</h3>
              <p className="max-w-[34rem] leading-relaxed text-ink-soft lg:col-span-5">{value.text}</p>
            </Reveal>
          ))}
        </ol>
      </Container>
    </section>
  );
}

function Details() {
  return (
    <section aria-labelledby="details-titel" className="pb-section">
      <Container className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Eyebrow index={ABOUT_DETAILS.index}>{ABOUT_DETAILS.eyebrow}</Eyebrow>
          <h2 id="details-titel" className="mt-6 font-display text-display-lg">{ABOUT_DETAILS.title}</h2>
          <dl className="mt-10 divide-y divide-line border-y border-line">
            {ABOUT_DETAILS.facts.map((fact) => (
              <div key={fact.label} className="grid gap-1 py-4 sm:grid-cols-[12rem_1fr] sm:gap-6">
                <dt className="text-sm text-ink-muted">{fact.label}</dt>
                <dd className="text-ink">{fact.value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:col-span-6 lg:col-start-7">
          {ABOUT_DETAILS.gallery.map((item, i) => (
            <div key={item.label} className={`group relative aspect-[3/4] overflow-hidden rounded-card bg-surface ${i === 1 ? "mt-12 sm:mt-20" : ""}`}>
              <Image src={item.image.src} alt={item.image.alt} fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover transition-transform duration-700 ease-calm group-hover:scale-[1.03]" />
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

function Cta() {
  return (
    <section aria-labelledby="over-cta-titel" className="relative isolate overflow-hidden">
      <Image src={ABOUT_CTA.image.src} alt={ABOUT_CTA.image.alt} fill sizes="100vw" className="-z-20 object-cover" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-canvas via-canvas/75 to-canvas/30" />
      <Container className="flex flex-col items-start gap-10 py-section">
        <h2 id="over-cta-titel" className="max-w-4xl font-display text-display-xl uppercase">{ABOUT_CTA.title}</h2>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href={PRODUCT_PATH} size="lg" withArrow>{ABOUT_CTA.primary}</ButtonLink>
          <ButtonLink href="/programma" size="lg" variant="secondary">{ABOUT_CTA.secondary}</ButtonLink>
        </div>
      </Container>
    </section>
  );
}

export default function OverOnsPage() {
  return (
    <>
      <Hero />
      <Credentials />
      <Story />
      <QuoteBand />
      <Values />
      <Details />
      <Cta />
    </>
  );
}
