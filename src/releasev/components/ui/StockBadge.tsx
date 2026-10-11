import { isStockImage } from "@rv/config/images";
import { cn } from "@rv/lib/cn";

/**
 * Klein label "Sfeerbeeld" op productbeelden die (nog) een stockfoto zijn.
 * Voorkomt misleiding: de foto toont niet exact de kit. Verdwijnt vanzelf
 * zodra de afbeelding een eigen foto uit /public is.
 */
export function StockBadge({ src, className }: { src: string | undefined; className?: string }) {
  if (!isStockImage(src)) return null;
  return (
    <span
      className={cn(
        "pointer-events-none absolute z-10 rounded-full bg-canvas/70 px-2.5 py-1 text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-ink-soft backdrop-blur-md",
        className ?? "bottom-3 left-3",
      )}
    >
      Sfeerbeeld
    </span>
  );
}
