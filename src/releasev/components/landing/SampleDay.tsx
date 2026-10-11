import type { LandingContent } from "@rv/content/landing";
import { totalMinutes } from "@rv/content/landing";
import type { ProgramVariant } from "@rv/content/programma";
import { Container } from "@rv/components/ui/Container";
import { Eyebrow } from "@rv/components/ui/Eyebrow";
import { Reveal } from "@rv/components/ui/Reveal";
import { VideoPoster } from "@rv/components/ui/VideoPoster";

export const SAMPLE_DAY_ID = "zo-werkt-het";

interface SampleDayProps {
  intro: LandingContent["day"];
  variant: ProgramVariant;
}

/** Lichte contrastband: voorbeelddag uit de programmavariant als tijdlijn, met videoposter. */
export function SampleDay({ intro, variant }: SampleDayProps) {
  const minutes = totalMinutes(variant.sampleDay);

  return (
    <section id={SAMPLE_DAY_ID} aria-labelledby="dag-title" className="bg-ink py-section-sm text-on-ink">
      <Container className="grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <Eyebrow index="03" tone="inverted">
            {`Programma · ${variant.name}`}
          </Eyebrow>
          <h2 id="dag-title" className="mt-5 font-display text-display-lg uppercase">
            {intro.title}
          </h2>
          <p className="mt-6 max-w-[30rem] text-lead text-on-ink-muted">{intro.lead}</p>

          <ol className="mt-10 border-l border-on-ink/15">
            {variant.sampleDay.map((step, index) => (
              <Reveal as="li" key={step.label} delay={index * 0.06} className="relative pb-7 pl-7 last:pb-0">
                <span aria-hidden className="absolute -left-[0.3125rem] top-1.5 size-2.5 rounded-full border-2 border-ink bg-on-ink" />
                <p className="flex items-baseline justify-between gap-4">
                  <span className="font-display text-xl font-bold">{step.label}</span>
                  <span className="text-sm font-medium text-on-ink-muted tabular-nums">{step.minutes}</span>
                </p>
                <p className="mt-1 text-on-ink-muted">{step.text}</p>
              </Reveal>
            ))}
          </ol>

          {minutes !== null && (
            <p className="mt-8 flex items-baseline gap-3 border-t border-on-ink/15 pt-6">
              <span className="font-display text-5xl font-extrabold tracking-tight tabular-nums">{minutes}</span>
              <span className="text-sm text-on-ink-muted">minuten in totaal, met de tools uit de doos</span>
            </p>
          )}
        </div>

        <Reveal className="lg:col-span-7 lg:self-center">
          <VideoPoster image={variant.image} label={variant.videoLabel} ratio="4/5" sizes="(min-width: 1024px) 55vw, 100vw" className="sm:aspect-[16/10]!" />
          <p className="mt-4 text-sm text-on-ink-muted">{variant.summary}</p>
        </Reveal>
      </Container>
    </section>
  );
}
