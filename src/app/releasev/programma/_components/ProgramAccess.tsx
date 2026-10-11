import Image from "next/image";
import { PRODUCT_PATH } from "@rv/config/site";
import { ButtonLink } from "@rv/components/ui/Button";
import { Container } from "@rv/components/ui/Container";
import { Eyebrow } from "@rv/components/ui/Eyebrow";
import { Reveal } from "@rv/components/ui/Reveal";
import { PROGRAM_ACCESS, PROGRAM_CTA, PROGRAM_HEALTH_NOTE } from "@rv/content/programma";

/** Lichte contrastband: toegang via QR-code in vier stappen. */
export function ProgramAccess() {
  return (
    <section aria-labelledby="toegang-titel" className="grain bg-ink py-section text-on-ink">
      <Container>
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <Eyebrow index={PROGRAM_ACCESS.index} tone="inverted">{PROGRAM_ACCESS.eyebrow}</Eyebrow>
            <h2 id="toegang-titel" className="mt-6 font-display text-display-lg uppercase">
              {PROGRAM_ACCESS.title}
            </h2>
          </div>
          <p className="max-w-[30rem] text-on-ink-muted lg:col-span-4">{PROGRAM_ACCESS.note}</p>
        </div>

        <ol className="mt-16 grid gap-px overflow-hidden rounded-card bg-on-ink/10 sm:grid-cols-2 lg:mt-20 lg:grid-cols-4">
          {PROGRAM_ACCESS.steps.map((step, i) => (
            <Reveal as="li" key={step.title} delay={i * 0.08} className="flex flex-col bg-ink p-6 sm:p-8">
              <span className="font-display text-6xl font-extrabold leading-none tracking-tight">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-10 font-display text-2xl font-bold">{step.title}</h3>
              <p className="mt-3 leading-relaxed text-on-ink-muted">{step.text}</p>
            </Reveal>
          ))}
        </ol>
      </Container>
    </section>
  );
}

/** Afsluitende CTA-band op beeld, met de medische kanttekening er direct bij. */
export function ProgramCta() {
  return (
    <section aria-labelledby="cta-titel" className="relative isolate overflow-hidden">
      <Image src={PROGRAM_CTA.image.src} alt={PROGRAM_CTA.image.alt} fill sizes="100vw" className="-z-20 object-cover" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-canvas via-canvas/70 to-canvas/30" />

      <Container className="grid gap-12 py-section lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-7">
          <h2 id="cta-titel" className="font-display text-display-xl uppercase">
            {PROGRAM_CTA.title}
          </h2>
          <p className="mt-6 max-w-[30rem] text-lead text-ink-soft">{PROGRAM_CTA.lead}</p>
          <ButtonLink href={PRODUCT_PATH} size="lg" withArrow className="mt-8">
            {PROGRAM_CTA.button}
          </ButtonLink>
        </div>

        <aside
          aria-labelledby="gezondheid-titel"
          className="rounded-card border border-ink/10 bg-canvas/60 p-6 backdrop-blur-xl sm:p-8 lg:col-span-4 lg:col-start-9"
        >
          <p className="flex items-center gap-3 text-eyebrow font-semibold uppercase text-ink-muted">
            <span aria-hidden className="size-1.5 rounded-full bg-accent" />
            Gezondheid
          </p>
          <h2 id="gezondheid-titel" className="mt-4 font-display text-xl font-bold">
            {PROGRAM_HEALTH_NOTE.title}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">{PROGRAM_HEALTH_NOTE.text}</p>
        </aside>
      </Container>
    </section>
  );
}
