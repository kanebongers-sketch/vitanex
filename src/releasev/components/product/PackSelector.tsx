"use client";

import { useId } from "react";
import { cn } from "@rv/lib/cn";

export interface PackOption {
  id: string;
  title: string;
  detail: string;
  priceLabel: string;
  /** Prijs in euro's, voor tracking */
  priceValue: number;
  /** Bijv. "Je bespaart €19". Alleen bij een echt voordeel. */
  savingsLabel?: string;
}

interface PackSelectorProps {
  options: readonly PackOption[];
  selectedId: string;
  onSelect: (id: string) => void;
}

/** Keuze tussen solo en duo, als toegankelijke radiogroep met grote klikvlakken. */
export function PackSelector({ options, selectedId, onSelect }: PackSelectorProps) {
  const groupId = useId();
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-3 text-eyebrow font-semibold uppercase text-ink-muted">Kies je pakket</legend>
      {options.map((option) => {
        const isSelected = option.id === selectedId;
        const inputId = `${groupId}-${option.id}`;
        return (
          <label
            key={option.id}
            htmlFor={inputId}
            className={cn(
              "flex cursor-pointer items-center gap-4 rounded-card border px-4 py-3.5 transition-[border-color,background-color] duration-300 ease-calm has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent",
              isSelected ? "border-ink bg-surface-strong" : "border-line hover:border-ink/40",
            )}
          >
            <input
              id={inputId}
              type="radio"
              name={groupId}
              value={option.id}
              checked={isSelected}
              onChange={() => onSelect(option.id)}
              className="sr-only"
            />
            <span
              aria-hidden
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                isSelected ? "border-ink" : "border-ink-muted",
              )}
            >
              {isSelected && <span className="size-2.5 rounded-full bg-ink" />}
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="flex flex-wrap items-center gap-x-2 gap-y-1 font-semibold">
                {option.title}
                {option.savingsLabel && (
                  <span className="rounded-full bg-accent px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-[0.1em] text-on-ink">
                    {option.savingsLabel}
                  </span>
                )}
              </span>
              <span className="text-sm text-ink-muted">{option.detail}</span>
            </span>
            <span className="font-display text-lg font-bold tabular-nums">{option.priceLabel}</span>
          </label>
        );
      })}
    </fieldset>
  );
}
