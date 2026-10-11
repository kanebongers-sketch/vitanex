import { cn } from "@rv/lib/cn";

interface EyebrowProps {
  /** Optioneel sectienummer, bijv. "01" */
  index?: string;
  children: string;
  tone?: "default" | "inverted";
  className?: string;
}

/** Klein kopje boven een sectie: "01 — Het probleem". */
export function Eyebrow({ index, children, tone = "default", className }: EyebrowProps) {
  return (
    <p
      className={cn(
        "flex items-center gap-3 text-eyebrow font-medium uppercase",
        tone === "default" ? "text-ink-muted" : "text-on-ink-muted",
        className,
      )}
    >
      {index && <span className="font-display text-sm tracking-normal text-accent normal-case">{index}</span>}
      {index && <span aria-hidden className="h-px w-8 bg-current opacity-40" />}
      <span>{children}</span>
    </p>
  );
}
