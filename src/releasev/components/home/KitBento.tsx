import { StockBadge } from "@rv/components/ui/StockBadge";
import Image from "next/image";
import { PRODUCT_PATH } from "@rv/config/site";
import { IMAGES, type SiteImage } from "@rv/config/images";
import { KIT } from "@rv/content/home";
import type { KitItem, Product } from "@rv/lib/commerce/types";
import { cn } from "@rv/lib/cn";
import { ButtonLink } from "@rv/components/ui/Button";
import { Container } from "@rv/components/ui/Container";
import { Reveal } from "@rv/components/ui/Reveal";
import { ZoneChips } from "@rv/components/ui/ZoneChips";
import { SectionHeading } from "./SectionHeading";

interface TileLayout {
  className: string;
  sizes: string;
  isFeature?: boolean;
}

/** Bento-indeling per item-id (12 kolommen op desktop). Onbekende items krijgen de standaardtegel. */
const TILE_LAYOUT: Record<string, TileLayout> = {
  roller: {
    className: "sm:col-span-2 lg:col-span-7 lg:row-span-2 min-h-[30rem] lg:min-h-[46rem]",
    sizes: "(min-width: 1024px) 58vw, 100vw",
    isFeature: true,
  },
  lacrosse: { className: "lg:col-span-5", sizes: "(min-width: 1024px) 42vw, (min-width: 640px) 50vw, 100vw" },
  spiky: { className: "lg:col-span-5", sizes: "(min-width: 1024px) 42vw, (min-width: 640px) 50vw, 100vw" },
  duo: { className: "lg:col-span-4", sizes: "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" },
  band: { className: "lg:col-span-3", sizes: "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw" },
  card: { className: "sm:col-span-2 lg:col-span-5", sizes: "(min-width: 1024px) 42vw, 100vw" },
};
const DEFAULT_TILE: TileLayout = { className: "lg:col-span-4", sizes: "(min-width: 1024px) 33vw, 100vw" };

function tileImage(id: string): SiteImage {
  const key = KIT.images[id as keyof typeof KIT.images];
  return key ? IMAGES[key] : IMAGES.rollerClose;
}

function KitTile({ item, index }: { item: KitItem; index: number }) {
  const layout = TILE_LAYOUT[item.id] ?? DEFAULT_TILE;
  const image = tileImage(item.id);

  return (
    <Reveal
      as="li"
      delay={(index % 3) * 0.06}
      className={cn("group relative isolate flex min-h-[24rem] flex-col justify-end overflow-hidden rounded-card bg-surface", layout.className)}
    >
      <Image
        src={image.src}
        alt={image.alt}
        fill
        sizes={layout.sizes}
        className="-z-20 object-cover transition-transform duration-700 ease-calm group-hover:scale-[1.03]"
      />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-canvas via-canvas/60 to-canvas/0" />
      <StockBadge src={image.src} className="left-5 top-5 sm:left-6 sm:top-6" />

      <span aria-hidden className="absolute right-5 top-5 font-display text-sm text-ink-soft sm:right-6 sm:top-6">
        {String(index + 1).padStart(2, "0")}
      </span>

      <div className={cn("p-5 sm:p-6", layout.isFeature && "lg:p-10")}>
        <p className="text-eyebrow font-semibold uppercase text-ink-soft">{item.detail}</p>
        <h3 className={cn("mt-3 font-display", layout.isFeature ? "text-display-lg uppercase" : "text-2xl font-bold leading-tight")}>
          {item.name}
        </h3>
        <p className={cn("mt-2 max-w-[34ch] text-sm leading-relaxed text-ink-soft", layout.isFeature && "sm:text-base")}>
          {item.use}
        </p>
        <ZoneChips zones={item.zones} className="mt-5" />
      </div>
    </Reveal>
  );
}

/** "Wat zit er in de kit": bento met echte foto's, de roller als grote hoofdtegel. */
export function KitBento({ product }: { product: Product }) {
  return (
    <section aria-labelledby="kit-title" className="pb-section">
      <Container>
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <SectionHeading id="kit-title" intro={KIT.intro} isStatement className="lg:col-span-8" />
          <ButtonLink href={PRODUCT_PATH} variant="secondary" withArrow className="justify-self-start lg:col-span-4 lg:justify-self-end">
            {KIT.cta}
          </ButtonLink>
        </div>

        <ul className="mt-14 grid gap-3 sm:grid-cols-2 sm:gap-4 lg:mt-20 lg:grid-cols-12">
          {product.contents.map((item, i) => (
            <KitTile key={item.id} item={item} index={i} />
          ))}
        </ul>
      </Container>
    </section>
  );
}
