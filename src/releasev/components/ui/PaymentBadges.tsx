import { cn } from "@rv/lib/cn";

/**
 * Neutrale betaalmethode-badges (tekst, geen officiële logo's).
 * Voor livegang: vervang door de officiële logo's uit de mediakits van
 * iDEAL (Currence), Bancontact en de kaartmaatschappijen.
 */
const METHODS = ["iDEAL", "Bancontact", "Creditcard", "Klarna"] as const;

export function PaymentBadges({ className, tone = "default" }: { className?: string; tone?: "default" | "inverted" }) {
  return (
    <ul className={cn("flex flex-wrap items-center gap-2", className)} aria-label="Betaalmethoden">
      {METHODS.map((method) => (
        <li
          key={method}
          className={cn(
            "rounded-soft border px-2 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.06em]",
            tone === "default" ? "border-line bg-canvas/60 text-ink-soft" : "border-on-ink/20 text-on-ink",
          )}
        >
          {method}
        </li>
      ))}
    </ul>
  );
}
