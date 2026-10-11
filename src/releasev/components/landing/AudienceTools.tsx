import type { CSSProperties } from "react";
import Image from "next/image";
import type { LandingContent, LandingTool } from "@rv/content/landing";
import { Container } from "@rv/components/ui/Container";
import { Eyebrow } from "@rv/components/ui/Eyebrow";
import { Reveal } from "@rv/components/ui/Reveal";
import { StockBadge } from "@rv/components/ui/StockBadge";
import { ZoneChips } from "@rv/components/ui/ZoneChips";
import { cn } from "@rv/lib/cn";

interface AudienceToolsProps {
  intro: LandingContent["tools"];
  tools: readonly LandingTool[];
}

interface ToolImageProps {
  tool: LandingTool;
  sizes: string;
  className: string;
  badgeClassName?: string;
}

function ToolImage({ tool, sizes, className, badgeClassName = "left-3 top-3" }: ToolImageProps) {
  if (!tool.image) return null;
  return (
    <div className={cn("relative overflow-hidden bg-surface-strong", className)}>
      <Image
        src={tool.image.src}
        alt={tool.image.alt}
        fill
        sizes={sizes}
        className="object-cover transition-transform duration-700 ease-calm group-hover:scale-[1.03]"
      />
      <StockBadge src={tool.image.src} className={badgeClassName} />
    </div>
  );
}

/** Uitgelichte tool: groot beeld met tekst eronder. */
function FeatureTool({ tool }: { tool: LandingTool }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-card border border-line bg-surface">
      <ToolImage tool={tool} sizes="(min-width: 1024px) 55vw, 100vw" className="aspect-[4/3] lg:aspect-auto lg:min-h-[22rem] lg:flex-1" />
      <div className="flex flex-col gap-4 p-6 sm:p-8">
        <p className="text-eyebrow font-semibold uppercase text-ink-muted">{tool.detail}</p>
        <h3 className="font-display text-display-md">{tool.name}</h3>
        <p className="max-w-[30rem] text-ink-soft">{tool.audienceUse}</p>
        <ZoneChips zones={tool.zones} className="mt-2" />
      </div>
    </article>
  );
}

/** Compacte tool: vierkante foto naast de tekst. */
function CompactTool({ tool }: { tool: LandingTool }) {
  return (
    <article className="group grid h-full grid-cols-[6.5rem_1fr] gap-5 rounded-card border border-line bg-surface p-3 pr-5 sm:grid-cols-[9rem_1fr]">
      <ToolImage tool={tool} sizes="144px" className="aspect-square self-start rounded-soft" badgeClassName="bottom-1.5 left-1.5" />
      <div className="flex min-w-0 flex-col gap-2 py-1">
        <h3 className="font-display text-xl font-bold leading-tight">{tool.name}</h3>
        <p className="text-sm text-ink-soft">{tool.audienceUse}</p>
        <ZoneChips zones={tool.zones} className="mt-2" />
      </div>
    </article>
  );
}

/** "Jouw tools": de onderdelen uit de kit die voor deze doelgroep het meeste werk doen. */
export function AudienceTools({ intro, tools }: AudienceToolsProps) {
  const [feature, ...rest] = tools;
  if (!feature) return null;

  return (
    <section aria-labelledby="tools-title" className="border-t border-line py-section-sm">
      <Container>
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <Eyebrow index="02">Uit de kit</Eyebrow>
            <h2 id="tools-title" className="mt-5 font-display text-display-lg uppercase">
              {intro.title}
            </h2>
          </div>
          <p className="max-w-[26rem] text-lead text-ink-soft lg:col-span-4 lg:col-start-9 lg:justify-self-end">{intro.lead}</p>
        </div>

        <ul
          className="mt-12 grid gap-4 lg:mt-16 lg:grid-cols-12 lg:gap-5"
          // De grote kaart beslaat net zoveel rijen als er kleine kaarten naast staan
          style={{ "--tool-rows": Math.max(1, rest.length) } as CSSProperties}
        >
          <Reveal as="li" className="lg:col-span-7 lg:[grid-row:span_var(--tool-rows)]">
            <FeatureTool tool={feature} />
          </Reveal>
          {rest.map((tool, index) => (
            <Reveal as="li" key={tool.id} delay={0.06 * (index + 1)} className="lg:col-span-5">
              <CompactTool tool={tool} />
            </Reveal>
          ))}
        </ul>
      </Container>
    </section>
  );
}
