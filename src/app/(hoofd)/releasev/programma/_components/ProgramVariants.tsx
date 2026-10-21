import { Container } from "@rv/components/ui/Container";
import { Eyebrow } from "@rv/components/ui/Eyebrow";
import { Reveal } from "@rv/components/ui/Reveal";
import { VideoPoster } from "@rv/components/ui/VideoPoster";
import { PROGRAM_VARIANTS, PROGRAM_VARIANTS_INTRO, type ProgramVariant } from "@rv/content/programma";

function TagList({ title, items, tone = "outline" }: { title: string; items: readonly string[]; tone?: "outline" | "solid" }) {
  return (
    <div>
      <h4 className="text-eyebrow font-semibold uppercase text-ink-muted">{title}</h4>
      <ul className="mt-4 flex flex-wrap gap-2">
        {items.map((item) => (
          <li
            key={item}
            className={
              tone === "solid"
                ? "rounded-full bg-surface-strong px-3.5 py-1.5 text-sm text-ink"
                : "rounded-full border border-ink/20 px-3.5 py-1.5 text-sm text-ink"
            }
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function SampleDay({ variant }: { variant: ProgramVariant }) {
  return (
    <div>
      <h4 className="text-eyebrow font-semibold uppercase text-ink-muted">Zo ziet een dag eruit</h4>
      <ol className="relative mt-5 border-l border-line">
        {variant.sampleDay.map((step) => (
          <li key={step.label} className="relative grid grid-cols-[6.5rem_1fr] gap-4 pb-5 pl-6 last:pb-0">
            <span aria-hidden className="absolute -left-[3px] top-2 size-1.5 rounded-full bg-accent" />
            <span>
              <span className="block font-display text-base font-bold uppercase">{step.label}</span>
              <span className="block text-sm tabular-nums text-ink-muted">{step.minutes}</span>
            </span>
            <span className="text-sm leading-relaxed text-ink-soft">{step.text}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function VariantBlock({ variant, isReversed }: { variant: ProgramVariant; isReversed: boolean }) {
  return (
    <article
      id={variant.id}
      aria-labelledby={`${variant.id}-titel`}
      className="grid scroll-mt-24 gap-10 border-t border-line pt-12 lg:grid-cols-12 lg:gap-12 lg:pt-16"
    >
      <div className={isReversed ? "lg:order-2 lg:col-span-7 lg:col-start-6" : "lg:col-span-7"}>
        <div className="lg:sticky lg:top-24">
          <VideoPoster image={variant.image} label={variant.videoLabel} ratio="4/3" sizes="(min-width: 1024px) 55vw, 100vw" />
        </div>
      </div>

      <div className={isReversed ? "lg:order-1 lg:col-span-5" : "lg:col-span-5"}>
        <div className="flex items-baseline gap-4">
          <span className="font-display text-sm font-bold text-accent">Variant {variant.index}</span>
          <span aria-hidden className="h-px flex-1 bg-line" />
        </div>
        <h3 id={`${variant.id}-titel`} className="mt-5 break-words font-display text-display-md uppercase [hyphens:auto]" lang="nl">
          {variant.name}
        </h3>
        <p className="mt-5 text-lead text-ink">{variant.summary}</p>
        <p className="mt-3 max-w-[34rem] leading-relaxed text-ink-soft">{variant.audience}</p>

        <div className="mt-10 grid gap-10">
          <TagList title="Focusgebieden" items={variant.focus} />
          <TagList title="Tools uit de kit" items={variant.tools} tone="solid" />
          <SampleDay variant={variant} />
        </div>
      </div>
    </article>
  );
}

/** De drie varianten als grote, beeldgedreven blokken. Ids blijven ankers vanaf de homepage. */
export function ProgramVariants() {
  return (
    <section aria-labelledby="varianten-titel" className="pb-section">
      <Container>
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <Eyebrow index={PROGRAM_VARIANTS_INTRO.index}>{PROGRAM_VARIANTS_INTRO.eyebrow}</Eyebrow>
            <h2 id="varianten-titel" className="mt-6 font-display text-display-lg">
              {PROGRAM_VARIANTS_INTRO.title}
            </h2>
          </div>
          <p className="max-w-[34rem] text-lead text-ink-soft lg:col-span-4 lg:col-start-9">{PROGRAM_VARIANTS_INTRO.lead}</p>
        </div>

        <div className="mt-16 grid gap-20 lg:mt-20 lg:gap-28">
          {PROGRAM_VARIANTS.map((variant, i) => (
            <Reveal key={variant.id}>
              <VariantBlock variant={variant} isReversed={i % 2 === 1} />
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
