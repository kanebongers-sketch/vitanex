import { cn } from "@rv/lib/cn";

interface ZoneChipsProps {
  zones: readonly string[];
  tone?: "default" | "inverted";
  className?: string;
}

/** "Gebruik het voor"-regel: lichaamszones als rustige chips. */
export function ZoneChips({ zones, tone = "default", className }: ZoneChipsProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <p className={cn("text-eyebrow font-medium uppercase", tone === "default" ? "text-ink-muted" : "text-on-ink-muted")}>
        Gebruik het voor
      </p>
      <ul className="flex flex-wrap gap-1.5">
        {zones.map((zone) => (
          <li
            key={zone}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
              tone === "default" ? "border-line bg-canvas/60 text-ink-soft backdrop-blur-sm" : "border-on-ink/20 text-on-ink",
            )}
          >
            <span aria-hidden className="size-1.5 rounded-full bg-accent" />
            {zone}
          </li>
        ))}
      </ul>
    </div>
  );
}
