import Image from "next/image";
import Link from "next/link";
import { SITE } from "@rv/config/site";
import { IMAGES } from "@rv/config/images";
import { TRAINER } from "@rv/content/home";
import { Container } from "@rv/components/ui/Container";
import { Reveal } from "@rv/components/ui/Reveal";
import { SectionHeading } from "./SectionHeading";

/** Groot portret met verhaal en quote. De foto is een placeholder tot het echte portret er is. */
export function Trainer() {
  return (
    <section aria-labelledby="trainer-title" className="border-t border-line bg-surface py-section">
      <Container className="grid gap-14 lg:grid-cols-12 lg:items-end lg:gap-x-10">
        <figure className="group relative aspect-[4/5] overflow-hidden rounded-card bg-surface-strong lg:col-span-6">
          <Image
            src={IMAGES.trainer.src}
            alt={IMAGES.trainer.alt}
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover grayscale transition-transform duration-700 ease-calm group-hover:scale-[1.03]"
          />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-canvas/90 via-canvas/10 to-transparent" />
          <span className="absolute left-5 top-5 rounded-full border border-ink/20 bg-canvas/60 px-3 py-1 text-[0.625rem] font-semibold uppercase tracking-[0.14em] text-ink-soft backdrop-blur-md">
            {TRAINER.photoNote}
          </span>
          <figcaption className="absolute inset-x-5 bottom-5 sm:inset-x-7 sm:bottom-7">
            <span className="block font-display text-display-md font-bold uppercase">{SITE.trainer.name}</span>
            <span className="mt-2 block text-sm text-ink-soft">{SITE.trainer.role}</span>
          </figcaption>
        </figure>

        <div className="lg:col-span-5 lg:col-start-8">
          <SectionHeading id="trainer-title" intro={TRAINER.intro} isStatement />
          <p className="mt-8 max-w-[34rem] leading-relaxed text-ink-soft">{TRAINER.story}</p>


          <Link
            href="/over-ons"
            className="link-underline mt-10 inline-block pb-1 text-sm font-semibold uppercase tracking-[0.12em] transition-colors hover:text-accent"
          >
            {TRAINER.cta} <span aria-hidden>→</span>
          </Link>
        </div>
      </Container>
    </section>
  );
}
