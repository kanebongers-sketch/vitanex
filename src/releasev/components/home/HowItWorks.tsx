import Image from "next/image";
import { IMAGES } from "@rv/config/images";
import { STEPS } from "@rv/content/home";
import { Container } from "@rv/components/ui/Container";
import { Reveal } from "@rv/components/ui/Reveal";
import { SectionHeading } from "./SectionHeading";

/** Drie stappen met grote cijfers en dunne lijnen, naast een staand beeld. */
export function HowItWorks() {
  return (
    <section aria-labelledby="werkwijze-title" className="py-section">
      <Container className="grid gap-14 lg:grid-cols-12 lg:gap-x-10">
        <div className="group relative aspect-[4/5] overflow-hidden rounded-card bg-surface lg:sticky lg:top-28 lg:col-span-5 lg:self-start">
          <Image
            src={IMAGES.stretchBw.src}
            alt={IMAGES.stretchBw.alt}
            fill
            sizes="(min-width: 1024px) 40vw, 100vw"
            className="object-cover transition-transform duration-700 ease-calm group-hover:scale-[1.03]"
          />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-canvas/70 via-transparent to-transparent" />
          <p className="absolute bottom-5 left-5 flex items-center gap-2 text-eyebrow font-semibold uppercase text-ink">
            <span aria-hidden className="size-1.5 rounded-full bg-accent" />
            10 tot 15 min per dag
          </p>
        </div>

        <div className="lg:col-span-6 lg:col-start-7 lg:pt-8">
          <SectionHeading id="werkwijze-title" intro={STEPS.intro} isStatement />

          <ol className="mt-14 border-b border-line lg:mt-20">
            {STEPS.items.map((step, i) => (
              <Reveal
                as="li"
                key={step.title}
                delay={i * 0.1}
                className="group grid grid-cols-[4.5rem_1fr] items-baseline gap-x-6 border-t border-line py-8 sm:grid-cols-[6.5rem_1fr] sm:py-10"
              >
                <span
                  aria-hidden
                  className="font-display text-5xl font-extrabold leading-none text-ink-muted transition-colors duration-500 ease-calm group-hover:text-ink sm:text-6xl"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="font-display text-2xl font-bold leading-tight sm:text-3xl">{step.title}</h3>
                  <p className="mt-2 max-w-[34ch] leading-relaxed text-ink-soft">{step.text}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </Container>
    </section>
  );
}
