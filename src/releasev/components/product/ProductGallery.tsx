"use client";

import { AnimatePresence, m } from "framer-motion";
import Image from "next/image";
import { useState } from "react";
import type { ProductMedia } from "@rv/lib/commerce/types";
import { Placeholder } from "@rv/components/ui/Placeholder";
import { StockBadge } from "@rv/components/ui/StockBadge";
import { VideoPoster } from "@rv/components/ui/VideoPoster";
import { cn } from "@rv/lib/cn";

interface ProductGalleryProps {
  media: readonly ProductMedia[];
  productName: string;
}

const MAIN_SIZES = "(min-width: 768px) 58vw, 100vw";
const MAIN_RATIO_CLASS = "aspect-square md:aspect-[4/5]";

function PlayGlyph({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className} fill="currentColor">
      <path d="M4 2.5v11l9-5.5z" />
    </svg>
  );
}

function MainVisual({ item, isFirst }: { item: ProductMedia; isFirst: boolean }) {
  if (item.kind === "video" && item.poster) {
    return (
      <VideoPoster
        image={{ src: item.poster, alt: item.alt }}
        label={item.alt}
        ratio="1/1"
        sizes={MAIN_SIZES}
        className="rounded-panel md:aspect-[4/5]!"
      />
    );
  }
  if (item.src) {
    return (
      <div className={cn("relative overflow-hidden rounded-panel bg-surface", MAIN_RATIO_CLASS)}>
        <Image src={item.src} alt={item.alt} fill priority={isFirst} sizes={MAIN_SIZES} className="object-cover" />
        <StockBadge src={item.src} className="bottom-4 left-4" />
      </div>
    );
  }
  return (
    <Placeholder
      label={item.placeholderLabel}
      alt={item.alt}
      kind={item.kind ?? "foto"}
      ratio="4/5"
      className="rounded-panel"
    />
  );
}

function ThumbVisual({ item, index }: { item: ProductMedia; index: number }) {
  const source = item.src ?? item.poster;
  return (
    <span aria-hidden className="relative block aspect-square bg-surface-strong">
      {source ? (
        <Image src={source} alt="" fill sizes="96px" className="object-cover" />
      ) : (
        <span className="absolute bottom-1 left-1.5 text-[0.625rem] font-semibold tabular-nums text-ink-muted">
          {String(index + 1).padStart(2, "0")}
        </span>
      )}
      {item.kind === "video" && (
        <span className="absolute inset-0 flex items-center justify-center bg-canvas/35">
          <PlayGlyph className="size-3 text-ink sm:size-3.5" />
        </span>
      )}
    </span>
  );
}

function StepButton({ direction, onClick }: { direction: "prev" | "next"; onClick: () => void }) {
  const isPrev = direction === "prev";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isPrev ? "Vorige afbeelding" : "Volgende afbeelding"}
      className="flex size-10 items-center justify-center rounded-full border border-ink/15 bg-canvas/60 text-ink backdrop-blur-md transition-[background-color,color,transform] duration-300 ease-calm hover:bg-ink hover:text-on-ink active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <svg aria-hidden viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d={isPrev ? "M10 3.5L5.5 8l4.5 4.5" : "M6 3.5L10.5 8 6 12.5"} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

/** Groot hoofdbeeld met dunne thumbnails in een rij (toetsenbord-toegankelijk via echte knoppen). */
export function ProductGallery({ media, productName }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = media[activeIndex] ?? media[0];
  if (!active) return null;

  const total = media.length;
  const go = (offset: number) => setActiveIndex((current) => (current + offset + total) % total);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <AnimatePresence mode="wait" initial={false}>
          <m.div
            key={active.id}
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <MainVisual item={active} isFirst={activeIndex === 0} />
          </m.div>
        </AnimatePresence>

        <div className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between sm:inset-x-4 sm:top-4">
          <p className="rounded-full border border-ink/10 bg-canvas/60 px-3 py-1 text-xs font-medium tabular-nums text-ink-soft backdrop-blur-md">
            <span className="text-ink">{String(activeIndex + 1).padStart(2, "0")}</span> / {String(total).padStart(2, "0")}
          </p>
          {total > 1 && (
            <div className="pointer-events-auto hidden gap-2 sm:flex">
              <StepButton direction="prev" onClick={() => go(-1)} />
              <StepButton direction="next" onClick={() => go(1)} />
            </div>
          )}
        </div>
      </div>

      <ul
        className="grid gap-1.5 sm:gap-2"
        style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}
        aria-label={`Afbeeldingen van ${productName}`}
      >
        {media.map((item, index) => {
          const isActive = index === activeIndex;
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-pressed={isActive}
                aria-label={`Toon ${item.kind === "video" ? "video" : "afbeelding"} ${index + 1}: ${item.alt}`}
                className={cn(
                  "block w-full overflow-hidden rounded-soft border transition-[opacity,border-color,transform] duration-300 ease-calm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                  isActive ? "border-ink opacity-100" : "border-line opacity-55 hover:-translate-y-0.5 hover:border-ink/40 hover:opacity-100",
                )}
              >
                <ThumbVisual item={item} index={index} />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
