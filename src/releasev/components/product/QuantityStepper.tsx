"use client";

import { MAX_QUANTITY_PER_ITEM } from "@rv/lib/cart";
import { cn } from "@rv/lib/cn";

interface QuantityStepperProps {
  value: number;
  onChange: (next: number) => void;
  /** Naam voor screenreaders, bijv. "Recovery & Mobility Kit" */
  label: string;
  /** Minimaal aantal; 0 laat de min-knop tot verwijderen leiden (winkelwagen) */
  min?: number;
  max?: number;
  size?: "sm" | "md";
  className?: string;
}

function StepButton({
  onClick,
  disabled,
  label,
  path,
  size,
}: {
  onClick: () => void;
  disabled: boolean;
  label: string;
  path: string;
  size: "sm" | "md";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        "flex items-center justify-center rounded-full text-ink transition-[background-color,transform] duration-300 ease-calm hover:bg-surface-strong active:scale-90 disabled:pointer-events-none disabled:opacity-35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
        size === "sm" ? "size-8" : "size-11",
      )}
    >
      <svg aria-hidden viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d={path} strokeLinecap="round" />
      </svg>
    </button>
  );
}

/** Aantal-kiezer met plus/min, begrensd op MAX_QUANTITY_PER_ITEM. */
export function QuantityStepper({
  value,
  onChange,
  label,
  min = 1,
  max = MAX_QUANTITY_PER_ITEM,
  size = "md",
  className,
}: QuantityStepperProps) {
  return (
    <div
      role="group"
      aria-label={`Aantal voor ${label}`}
      className={cn("inline-flex items-center gap-1 rounded-full border border-line bg-canvas p-1", className)}
    >
      <StepButton
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        label={`Een minder ${label}`}
        path="M3 8h10"
        size={size}
      />
      <output
        aria-live="polite"
        aria-label={`Aantal: ${value}`}
        className={cn("min-w-8 text-center font-medium tabular-nums", size === "sm" ? "text-sm" : "text-base")}
      >
        {value}
      </output>
      <StepButton
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        label={`Een meer ${label}`}
        path="M8 3v10M3 8h10"
        size={size}
      />
    </div>
  );
}
