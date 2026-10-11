"use client";

import Link from "next/link";
import { AnimatePresence, m } from "framer-motion";
import { useEffect, useState } from "react";
import { PRODUCT_PATH } from "@rv/config/site";

interface MobileStickyCtaProps {
  priceLabel: string;
}

/** Afstand (px) vanaf de onderkant waarbinnen de balk verdwijnt, zodat hij de afsluitende CTA en footer niet afdekt. */
const BOTTOM_HIDE_ZONE = 1100;

/**
 * Vaste bestelknop onderin op mobiel, zichtbaar zodra de hero uit beeld is.
 * Zo is de volgende stap altijd een tik weg voor bezoekers uit advertenties.
 */
export function MobileStickyCta({ priceLabel }: MobileStickyCtaProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const update = () => {
      const pastHero = window.scrollY > window.innerHeight * 0.9;
      const nearBottom = window.scrollY + window.innerHeight > document.documentElement.scrollHeight - BOTTOM_HIDE_ZONE;
      setIsVisible(pastHero && !nearBottom);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <m.div
          initial={{ y: "110%" }}
          animate={{ y: 0 }}
          exit={{ y: "110%" }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-canvas/85 px-4 pt-3 backdrop-blur-xl md:hidden"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          <Link
            href={PRODUCT_PATH}
            className="flex h-13 items-center justify-between rounded-full bg-ink px-6 font-medium text-on-ink transition-colors active:bg-accent"
          >
            <span>Bestel de kit</span>
            <span className="flex items-center gap-3">
              <span className="tabular-nums">{priceLabel}</span>
              <svg aria-hidden viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M2 8h11M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </Link>
        </m.div>
      )}
    </AnimatePresence>
  );
}
