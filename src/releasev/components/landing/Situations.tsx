import type { LandingContent } from "@rv/content/landing";
import { Container } from "@rv/components/ui/Container";
import { Eyebrow } from "@rv/components/ui/Eyebrow";
import { Reveal } from "@rv/components/ui/Reveal";

interface SituationsProps {
  situations: LandingContent["situations"];
}

/** Drie herkenbare situaties, als genummerde rijen met dunne lijnen. */
export function Situations({ situations }: SituationsProps) {
  return (
    <section aria-labelledby="situaties-title" className="py-section-sm">
      <Container className="grid gap-10 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-4">
          <Eyebrow index="01">Herkenbaar</Eyebrow>
          <h2 id="situaties-title" className="mt-5 font-display text-display-lg uppercase">
            {situations.title}
          </h2>
        </div>

        <ol className="border-b border-line lg:col-span-8">
          {situations.items.map((item, index) => (
            <Reveal as="li" key={item.title} delay={index * 0.08} className="grid grid-cols-[3rem_1fr] gap-x-4 border-t border-line py-7 sm:grid-cols-[5rem_1fr] sm:py-9">
              <span aria-hidden className="font-display text-3xl font-extrabold text-ink-muted tabular-nums sm:text-4xl">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:gap-10">
                <h3 className="font-display text-2xl font-bold leading-tight sm:w-56 sm:shrink-0">{item.title}</h3>
                <p className="max-w-[30rem] text-ink-soft">{item.text}</p>
              </div>
            </Reveal>
          ))}
        </ol>
      </Container>
    </section>
  );
}
