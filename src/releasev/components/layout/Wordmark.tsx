import Link from "next/link";
import { SITE } from "@rv/config/site";
import { cn } from "@rv/lib/cn";

/** Tekstlogo. Vervang later door een eigen SVG-logo in deze component. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={cn(
        "font-display text-lg font-extrabold uppercase tracking-[-0.02em] [font-stretch:112%] transition-colors duration-300 hover:text-accent",
        className,
      )}
      aria-label={`${SITE.brandName}, naar de homepage`}
    >
      {SITE.brandName}
    </Link>
  );
}
