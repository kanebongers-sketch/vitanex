import { SITE } from "@rv/config/site";
import { cn } from "@rv/lib/cn";

const ITEMS = [
  SITE.shipping.freeLabel,
  SITE.shipping.deliveryLabel,
  `${SITE.shipping.returnDays} dagen bedenktijd`,
] as const;

/** Rustige rij met verzend- en retourbeloftes. */
interface TrustListProps {
  className?: string;
  /** Extra beloftes, bijv. op de productpagina */
  extraItems?: readonly string[];
}

export function TrustList({ className, extraItems = [] }: TrustListProps) {
  return (
    <ul className={cn("flex flex-col gap-2 text-sm text-ink-soft", className)}>
      {[...ITEMS, ...extraItems].map((item) => (
        <li key={item} className="flex items-center gap-2.5">
          <svg aria-hidden viewBox="0 0 16 16" className="size-4 shrink-0 text-success" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M3 8.5l3 3 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {item}
        </li>
      ))}
    </ul>
  );
}
