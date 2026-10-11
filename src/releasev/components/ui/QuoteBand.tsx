import Image from "next/image";
import { IMAGES } from "@rv/config/images";
import { KANE_QUOTE } from "@rv/content/quote";
import { Container } from "@rv/components/ui/Container";
import { Reveal } from "@rv/components/ui/Reveal";

interface QuoteLine {
  text: string;
  emphasis?: string;
}

/** Toont een regel, met het benadrukte woord in de accentkleur. */
function Line({ line }: { line: QuoteLine }) {
  if (!line.emphasis || !line.text.includes(line.emphasis)) return <>{line.text}</>;
  const [before, after] = line.text.split(line.emphasis);
  return (
    <>
      {before}
      <span className="text-accent">{line.emphasis}</span>
      {after}
    </>
  );
}

/**
 * Full-bleed quote-band: grote typografie op een donker sfeerbeeld.
 * Inhoud komt uit src/content/quote.ts.
 */
export function QuoteBand() {
  return (
    <section aria-label={`Quote van ${KANE_QUOTE.author}`} className="relative isolate overflow-hidden border-y border-line">
      <Image
        src={IMAGES.stretchBw.src}
        alt=""
        fill
        sizes="100vw"
        className="-z-20 object-cover object-center opacity-35 grayscale"
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-canvas via-canvas/85 to-canvas/40" />

      <Container className="py-section">
        <figure className="max-w-[min(100%,72rem)]">
          <span aria-hidden className="block font-display text-[clamp(5rem,3rem+8vw,11rem)] font-extrabold leading-[0.6] text-accent">
            &ldquo;
          </span>
          <blockquote className="mt-4">
            {KANE_QUOTE.lines.map((line, index) => (
              <Reveal key={line.text} delay={index * 0.15}>
                <p className="font-display text-[2.05rem] font-extrabold uppercase leading-[0.95] tracking-[-0.03em] text-balance [font-stretch:112%] sm:text-display-xl sm:leading-[0.92]">
                  <Line line={line} />
                </p>
              </Reveal>
            ))}
          </blockquote>
          <Reveal delay={0.35}>
            <figcaption className="mt-10 flex items-center gap-4 text-sm text-ink-soft sm:mt-14">
              <span aria-hidden className="h-px w-12 bg-accent" />
              <span>
                <span className="font-semibold text-ink">{KANE_QUOTE.author}</span>
                <span className="text-ink-muted"> · {KANE_QUOTE.role}</span>
              </span>
            </figcaption>
          </Reveal>
        </figure>
      </Container>
    </section>
  );
}
