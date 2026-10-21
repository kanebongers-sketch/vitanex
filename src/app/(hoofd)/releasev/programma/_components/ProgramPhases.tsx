import { IMAGES } from "@rv/config/images";
import { Container } from "@rv/components/ui/Container";
import { Eyebrow } from "@rv/components/ui/Eyebrow";
import { Reveal } from "@rv/components/ui/Reveal";
import { VideoPoster } from "@rv/components/ui/VideoPoster";
import { PROGRAM_HERO, PROGRAM_STRUCTURE } from "@rv/content/programma";

/** De drie fases als tijdlijn met dunne lijnen: verticaal op mobiel, horizontaal vanaf lg. */
export function ProgramPhases() {
  return (
    <section aria-labelledby="opbouw-titel" className="py-section">
      <Container>
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <Eyebrow index={PROGRAM_STRUCTURE.index}>{PROGRAM_STRUCTURE.eyebrow}</Eyebrow>
            <h2 id="opbouw-titel" className="mt-6 font-display text-display-lg">
              {PROGRAM_STRUCTURE.title}
            </h2>
          </div>
          <p className="max-w-[34rem] text-lead text-ink-soft lg:col-span-4 lg:col-start-9">{PROGRAM_STRUCTURE.lead}</p>
        </div>

        <ol className="relative mt-16 grid gap-12 border-l border-line pl-8 lg:mt-24 lg:grid-cols-3 lg:gap-10 lg:border-l-0 lg:border-t lg:pl-0">
          {PROGRAM_STRUCTURE.phases.map((phase, i) => (
            <Reveal as="li" key={phase.title} delay={i * 0.08} className="relative lg:pt-10">
              <span
                aria-hidden
                className="absolute -left-8 top-1 size-2.5 -translate-x-1/2 rounded-full bg-accent ring-4 ring-canvas lg:-top-px lg:left-0 lg:-translate-y-1/2 lg:translate-x-0"
              />
              <p className="text-eyebrow font-semibold uppercase text-ink-muted">{phase.days}</p>
              <p aria-hidden className="mt-4 font-display text-6xl font-extrabold leading-none tracking-tight text-ink/15 lg:text-8xl">
                {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-4 font-display text-display-md uppercase">{phase.title}</h3>
              <p className="mt-4 max-w-[30rem] leading-relaxed text-ink-soft">{phase.text}</p>
            </Reveal>
          ))}
        </ol>

        <Reveal className="mt-20 lg:mt-28">
          <VideoPoster image={IMAGES.foamRolling} label={PROGRAM_HERO.videoLabel} ratio="21/9" sizes="100vw" className="min-h-64" />
        </Reveal>
      </Container>
    </section>
  );
}
