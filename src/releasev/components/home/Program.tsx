import Image from "next/image";
import Link from "next/link";
import { IMAGES } from "@rv/config/images";
import { PROGRAM } from "@rv/content/home";
import { ButtonLink } from "@rv/components/ui/Button";
import { Container } from "@rv/components/ui/Container";
import { Reveal } from "@rv/components/ui/Reveal";
import { VideoPoster } from "@rv/components/ui/VideoPoster";
import { SectionHeading } from "./SectionHeading";

/** Lichte contrastband: programma, trailer en de drie varianten. */
export function Program() {
  return (
    <section aria-labelledby="programma-title" className="grain bg-ink py-section text-on-ink">
      <Container>
        <div className="grid gap-12 lg:grid-cols-12 lg:items-end lg:gap-x-10">
          <div className="lg:col-span-5">
            <SectionHeading id="programma-title" intro={PROGRAM.intro} tone="inverted" isStatement />
            <ButtonLink href="/programma" variant="inverted" size="lg" withArrow className="mt-10">
              {PROGRAM.cta}
            </ButtonLink>
          </div>

          <div className="relative lg:col-span-7">
            <p
              aria-hidden
              className="pointer-events-none absolute -top-16 right-0 select-none font-display text-[7rem] font-extrabold leading-none text-on-ink/[0.07] lg:-top-28 lg:text-[11rem]"
            >
              14
            </p>
            <VideoPoster
              image={IMAGES.floorStretch}
              label={PROGRAM.videoLabel}
              ratio="16/10"
              sizes="(min-width: 1024px) 55vw, 100vw"
            />
          </div>
        </div>

        <ol className="mt-16 grid grid-cols-1 gap-px overflow-hidden rounded-card border border-on-ink/15 bg-on-ink/15 md:grid-cols-3 lg:mt-24">
          {PROGRAM.variants.map((variant, i) => {
            const image = IMAGES[variant.image];
            return (
              <Reveal as="li" key={variant.id} delay={i * 0.08} className="min-w-0 bg-ink">
                <Link
                  href={`/programma#${variant.id}`}
                  className="group flex h-full flex-col gap-6 p-4 outline-offset-[-4px] sm:p-5"
                >
                  <div className="relative aspect-[4/3] overflow-hidden rounded-soft bg-ink-raised">
                    <Image
                      src={image.src}
                      alt={image.alt}
                      fill
                      sizes="(min-width: 768px) 30vw, 100vw"
                      className="object-cover transition-transform duration-700 ease-calm group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="flex items-start justify-between gap-4 px-1 pb-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-eyebrow font-semibold uppercase text-on-ink-muted">Variant {String.fromCharCode(65 + i)}</p>
                      <h3 className="mt-3 font-display text-2xl font-bold uppercase leading-tight [overflow-wrap:anywhere] sm:text-3xl md:text-xl lg:text-2xl xl:text-3xl">{variant.name}</h3>
                      <p className="mt-2 text-on-ink-muted">{variant.focus}</p>
                    </div>
                    <span
                      aria-hidden
                      className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-full border border-on-ink/20 transition-[background-color,color,transform] duration-300 ease-calm group-hover:-rotate-45 group-hover:bg-on-ink group-hover:text-ink"
                    >
                      <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M2 8h11M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </ol>
      </Container>
    </section>
  );
}
