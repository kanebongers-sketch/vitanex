import Image from "next/image";
import { IMAGES } from "@rv/config/images";
import { PROBLEM } from "@rv/content/home";
import { Container } from "@rv/components/ui/Container";
import { Reveal } from "@rv/components/ui/Reveal";
import { SectionHeading } from "./SectionHeading";

/** Verspringende hoogtes geven de drie situaties een editoriaal ritme. */
const CARD_OFFSET = ["", "lg:mt-24", "lg:mt-12"] as const;

/** Drie herkenbare situaties als grote beeldkaarten met tekst op de foto. */
export function Problem() {
  const total = String(PROBLEM.situations.length).padStart(2, "0");

  return (
    <section aria-labelledby="probleem-title" className="py-section">
      <Container>
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <SectionHeading id="probleem-title" intro={{ ...PROBLEM.intro, lead: undefined }} isStatement className="lg:col-span-8" />
          <p className="max-w-[24rem] text-lead text-ink-soft lg:col-span-4 lg:justify-self-end">{PROBLEM.intro.lead}</p>
        </div>

        <ol tabIndex={0} aria-label="Drie situaties" className="-mx-gutter mt-12 flex snap-x snap-mandatory scroll-px-gutter gap-3 overflow-x-auto px-gutter pb-2 [scrollbar-width:none] md:mx-0 md:mt-14 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:px-0 md:pb-0 lg:mt-20 lg:gap-5">
          {PROBLEM.situations.map((situation, i) => {
            const image = IMAGES[situation.image];
            return (
              <Reveal as="li" key={situation.label} delay={i * 0.08} className={`w-[82%] shrink-0 snap-start md:w-auto ${CARD_OFFSET[i]}`}>
                <article className="group relative isolate flex aspect-[4/5] flex-col justify-end overflow-hidden rounded-card bg-surface p-6 sm:p-7 md:aspect-[3/5] lg:aspect-[3/4.4]">
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="-z-20 object-cover transition-transform duration-700 ease-calm group-hover:scale-[1.03]"
                  />
                  <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-canvas via-canvas/50 to-canvas/0" />

                  <div className="absolute inset-x-6 top-6 flex items-center justify-between sm:inset-x-7 sm:top-7">
                    <span className="flex items-center gap-2 text-eyebrow font-semibold uppercase text-ink">
                      <span aria-hidden className="size-1.5 rounded-full bg-accent" />
                      {situation.label}
                    </span>
                    <span aria-hidden className="font-display text-sm text-ink-soft">
                      {String(i + 1).padStart(2, "0")} / {total}
                    </span>
                  </div>

                  <h3 className="max-w-[14ch] font-display text-display-md uppercase">{situation.title}</h3>
                  <p className="mt-3 max-w-[28ch] text-ink-soft">{situation.text}</p>
                </article>
              </Reveal>
            );
          })}
        </ol>
      </Container>
    </section>
  );
}
