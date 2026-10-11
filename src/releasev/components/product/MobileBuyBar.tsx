"use client";

import { AnimatePresence, m } from "framer-motion";
import Image from "next/image";
import { Button } from "@rv/components/ui/Button";

interface MobileBuyBarProps {
  isVisible: boolean;
  name: string;
  priceLabel: string;
  /** Optionele productfoto als kleine thumbnail */
  imageSrc?: string;
  onAdd: () => void;
}

/** Vaste koopbalk onderaan op mobiel, zichtbaar zodra de hoofdknop uit beeld is. */
export function MobileBuyBar({ isVisible, name, priceLabel, imageSrc, onAdd }: MobileBuyBarProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <m.div
          key="mobile-buy-bar"
          initial={{ y: "110%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "110%", opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/90 px-gutter pt-3 shadow-lift backdrop-blur-xl md:hidden"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          <div className="flex items-center gap-3">
            {imageSrc && (
              <span aria-hidden className="relative size-11 shrink-0 overflow-hidden rounded-soft border border-line bg-surface-strong">
                <Image src={imageSrc} alt="" fill sizes="44px" className="object-cover" />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium uppercase tracking-[0.08em] text-ink-soft">{name}</p>
              <p className="text-xs text-ink-muted">
                <span className="font-display text-lg font-extrabold text-ink tabular-nums">{priceLabel}</span> incl. btw
              </p>
            </div>
            <Button onClick={onAdd} className="shrink-0 px-5">
              In winkelwagen
            </Button>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
