"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { m } from "framer-motion";
import { Button } from "@rv/components/ui/Button";
import { cn } from "@rv/lib/cn";
import { useConsentStore, type ConsentChoices } from "@rv/stores/consent-store";
import { useFocusTrap } from "./use-focus-trap";

const EASE = [0.22, 1, 0.36, 1] as const;

interface CategoryProps {
  title: string;
  description: string;
  isChecked: boolean;
  isLocked?: boolean;
  onToggle?: () => void;
}

function Category({ title, description, isChecked, isLocked = false, onToggle }: CategoryProps) {
  const labelId = useId();
  const descriptionId = useId();
  return (
    <li className="flex items-start justify-between gap-6 py-5">
      <div>
        <p id={labelId} className="font-medium text-ink">
          {title}
          {isLocked && <span className="ml-2 text-xs font-normal text-ink-muted">Altijd aan</span>}
        </p>
        <p id={descriptionId} className="mt-1 text-sm leading-relaxed text-ink-soft">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={isChecked}
        aria-labelledby={labelId}
        aria-describedby={descriptionId}
        disabled={isLocked}
        onClick={onToggle}
        className={cn(
          "relative mt-1 inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors duration-300 ease-calm disabled:cursor-not-allowed",
          isChecked ? "border-accent bg-accent" : "border-ink/25 bg-surface-strong",
          isLocked && "opacity-60",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "inline-block size-5 rounded-full shadow-lift transition-transform duration-300 ease-calm",
            isChecked ? "translate-x-6 bg-ink" : "translate-x-1 bg-ink-muted",
          )}
        />
      </button>
    </li>
  );
}

function useLockScroll() {
  useEffect(() => {
    const root = document.documentElement;
    const previous = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previous;
    };
  }, []);
}

/** Modale dialoog met de cookie-instellingen per categorie. */
export function CookieSettingsDialog() {
  const store = useConsentStore();
  const [choices, setChoices] = useState<ConsentChoices>({ analytics: store.analytics, marketing: store.marketing });
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useLockScroll();
  useFocusTrap(dialogRef, true, store.closeSettings);

  const toggle = (key: keyof ConsentChoices) => setChoices((current) => ({ ...current, [key]: !current[key] }));

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center p-4 sm:items-center">
      <m.div aria-hidden className="absolute inset-0 bg-canvas/70 backdrop-blur-sm" onClick={store.closeSettings} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} />
      <m.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
        transition={{ duration: 0.45, ease: EASE }}
        className="relative max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-panel border border-ink/10 bg-surface p-6 shadow-lift sm:p-8"
      >
        <h2 id={titleId} tabIndex={-1} data-autofocus className="font-display text-display-md uppercase focus:outline-none">Cookie-instellingen</h2>
        <p id={descriptionId} className="mt-3 text-sm leading-relaxed text-ink-soft">
          Kies welke cookies je toestaat. Je kunt dit altijd wijzigen via ‘Cookie-instellingen’ onderaan de pagina. Meer in ons{" "}
          <Link href="/cookiebeleid" className="text-ink underline underline-offset-2 transition-colors hover:text-accent" onClick={store.closeSettings}>cookiebeleid</Link>.
        </p>
        <ul className="mt-4 divide-y divide-line border-y border-line">
          <Category title="Noodzakelijk" description="Voor je winkelwagen en het onthouden van deze keuze. Zonder deze werkt de webshop niet." isChecked isLocked />
          <Category title="Analytisch" description="Google Analytics: helpt ons begrijpen hoe de website wordt gebruikt, zodat we hem kunnen verbeteren." isChecked={choices.analytics} onToggle={() => toggle("analytics")} />
          <Category title="Marketing" description="Meta Pixel: meet de resultaten van onze advertenties op Facebook en Instagram." isChecked={choices.marketing} onToggle={() => toggle("marketing")} />
        </ul>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={store.closeSettings}>Annuleren</Button>
          <Button onClick={() => store.save(choices)}>Keuze opslaan</Button>
        </div>
      </m.div>
    </div>
  );
}
