import Image from "next/image";
import { Container } from "@rv/components/ui/Container";
import { PROGRAM_FACTS, PROGRAM_HERO, PROGRAM_VARIANTS } from "@rv/content/programma";

/** Full-bleed hero met grote kop, gevolgd door een feitenrij met grote cijfers. */
export function ProgramHero() {
  return (
    <>
      <section
        aria-labelledby="programma-titel"
        className="relative isolate flex min-h-[calc(88svh-6rem)] items-end overflow-hidden"
      >
        <Image
          src={PROGRAM_HERO.image.src}
          alt={PROGRAM_HERO.image.alt}
          fill
          priority
          sizes="100vw"
          className="-z-20 object-cover object-[60%_center]"
        />
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-canvas via-canvas/50 to-canvas/10" />
        <div aria-hidden className="absolute inset-0 -z-10 hidden bg-gradient-to-r from-canvas/80 via-canvas/20 to-transparent md:block" />

        <Container className="grid gap-10 pb-12 pt-32 sm:pb-16 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <p className="flex items-center gap-3 text-eyebrow font-semibold uppercase text-ink-soft">
              <span aria-hidden className="size-1.5 rounded-full bg-accent" />
              {PROGRAM_HERO.eyebrow}
            </p>
            <h1 id="programma-titel" className="mt-6 font-display text-display-2xl uppercase">
              {PROGRAM_HERO.titleLines.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </h1>
            <p className="mt-6 max-w-[32rem] text-lead text-ink-soft">{PROGRAM_HERO.lead}</p>
          </div>

          <nav aria-label="Spring naar een variant" className="lg:col-span-4 lg:justify-self-end">
            <ul className="flex flex-wrap gap-2 lg:flex-col lg:items-end">
              {PROGRAM_VARIANTS.map((variant) => (
                <li key={variant.id}>
                  <a
                    href={`#${variant.id}`}
                    className="group inline-flex items-center gap-3 rounded-full border border-ink/20 bg-canvas/40 px-4 py-2 text-sm font-medium backdrop-blur-md transition-[background-color,color,border-color,transform] duration-300 ease-calm hover:-translate-y-0.5 hover:border-ink hover:bg-ink hover:text-on-ink"
                  >
                    <span className="font-display text-xs text-accent">{variant.index}</span>
                    {variant.name}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </Container>
      </section>

      <section aria-label="Het programma in cijfers" className="border-y border-line">
        <Container>
          <dl className="grid grid-cols-3">
            {PROGRAM_FACTS.map((fact, index) => (
              <div
                key={fact.label}
                className={`flex flex-col-reverse justify-end gap-2 py-8 sm:py-10 ${index > 0 ? "border-l border-line pl-4 sm:pl-8" : "pr-4"}`}
              >
                <dt className="max-w-[14rem] text-xs text-ink-muted sm:text-sm">{fact.label}</dt>
                <dd className="whitespace-nowrap font-display text-3xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">{fact.value}</dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>
    </>
  );
}
