import { StockBadge } from "@rv/components/ui/StockBadge";
import Image from "next/image";
import type { KitItem } from "@rv/lib/commerce/types";
import { KIT_CONTENTS_BLOCK } from "@rv/content/product-page";
import { Eyebrow } from "@rv/components/ui/Eyebrow";
import { Reveal } from "@rv/components/ui/Reveal";
import { ZoneChips } from "@rv/components/ui/ZoneChips";
import { cn } from "@rv/lib/cn";

type CardLayout = "feature" | "split" | "stacked";

/** Bento-indeling per positie: een grote tegel, twee brede, drie kleinere. */
const LAYOUTS: ReadonlyArray<{ layout: CardLayout; span: string }> = [
  { layout: "feature", span: "lg:col-span-7 lg:row-span-2" },
  { layout: "split", span: "lg:col-span-5" },
  { layout: "split", span: "lg:col-span-5" },
  { layout: "stacked", span: "sm:col-span-1 lg:col-span-4" },
  { layout: "stacked", span: "sm:col-span-1 lg:col-span-4" },
  { layout: "stacked", span: "sm:col-span-2 lg:col-span-4" },
];

const IMAGE_HOVER = "object-cover transition-transform duration-700 ease-calm group-hover:scale-[1.03]";

function CardText({ item, index, isLarge = false }: { item: KitItem; index: number; isLarge?: boolean }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="flex items-center gap-2 text-eyebrow font-semibold uppercase text-ink-muted">
        <span className="font-display text-sm tracking-normal text-accent tabular-nums">
          {String(index + 1).padStart(2, "0")}
        </span>
        {item.detail}
      </p>
      <h3 className={cn("font-display leading-[1.02]", isLarge ? "text-display-md uppercase" : "text-2xl")}>{item.name}</h3>
      <p className={cn("text-ink-soft leading-relaxed", isLarge ? "max-w-[30rem]" : "text-sm")}>{item.use}</p>
    </div>
  );
}

/** Positionering (relative/absolute) komt via className. */
function CardImage({ item, sizes, className }: { item: KitItem; sizes: string; className?: string }) {
  if (!item.image) {
    return <div aria-hidden className={cn("grain bg-surface-strong", className)} />;
  }
  return (
    <div className={cn("overflow-hidden bg-surface-strong", className)}>
      <Image src={item.image.src} alt={item.image.alt} fill sizes={sizes} className={IMAGE_HOVER} />
      <StockBadge src={item.image.src} className="right-3 top-3" />
    </div>
  );
}

function FeatureCard({ item, index }: { item: KitItem; index: number }) {
  return (
    <div className="relative isolate flex min-h-[30rem] flex-col justify-end p-6 sm:p-8 lg:h-full lg:min-h-[40rem]">
      <CardImage item={item} sizes="(min-width: 1024px) 55vw, 100vw" className="absolute inset-0 -z-20" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-canvas via-canvas/60 to-canvas/0" />
      <CardText item={item} index={index} isLarge />
      <ZoneChips zones={item.zones} className="mt-6" />
    </div>
  );
}

function SplitCard({ item, index }: { item: KitItem; index: number }) {
  return (
    <div className="grid h-full sm:grid-cols-[2fr_3fr]">
      <CardImage item={item} sizes="(min-width: 1024px) 18vw, (min-width: 640px) 40vw, 100vw" className="relative aspect-[4/3] sm:aspect-auto sm:min-h-[15rem]" />
      <div className="flex flex-col justify-between gap-5 p-6">
        <CardText item={item} index={index} />
        <ZoneChips zones={item.zones} />
      </div>
    </div>
  );
}

function StackedCard({ item, index }: { item: KitItem; index: number }) {
  return (
    <div className="flex h-full flex-col">
      <CardImage item={item} sizes="(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw" className="relative aspect-[3/2]" />
      <div className="flex flex-1 flex-col justify-between gap-5 p-6">
        <CardText item={item} index={index} />
        <ZoneChips zones={item.zones} />
      </div>
    </div>
  );
}

const CARDS: Record<CardLayout, typeof FeatureCard> = { feature: FeatureCard, split: SplitCard, stacked: StackedCard };

/** Inhoud van de kit: beeldgedreven bento met per tool foto, naam, gebruik en zones. */
export function KitContents({ items }: { items: readonly KitItem[] }) {
  return (
    <section aria-labelledby="kit-inhoud">
      <div className="grid gap-6 lg:grid-cols-12 lg:items-end lg:gap-16">
        <div className="lg:col-span-7">
          <Eyebrow index="02">{KIT_CONTENTS_BLOCK.eyebrow}</Eyebrow>
          <h2 id="kit-inhoud" className="mt-5 font-display text-display-lg uppercase text-balance">
            {KIT_CONTENTS_BLOCK.title}
          </h2>
        </div>
        <p className="max-w-[34rem] text-ink-soft leading-relaxed lg:col-span-5">
          {KIT_CONTENTS_BLOCK.lead}
        </p>
      </div>

      <ol className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-12">
        {items.map((item, index) => {
          const { layout, span } = LAYOUTS[index] ?? { layout: "stacked", span: "lg:col-span-4" };
          const Card = CARDS[layout];
          return (
            <Reveal
              as="li"
              key={item.id}
              delay={(index % 3) * 0.06}
              className={cn(
                "group overflow-hidden rounded-card border border-line bg-surface",
                layout !== "stacked" && "sm:col-span-2",
                span,
              )}
            >
              <Card item={item} index={index} />
            </Reveal>
          );
        })}
      </ol>
    </section>
  );
}
