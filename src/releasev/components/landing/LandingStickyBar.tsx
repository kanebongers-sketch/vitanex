"use client";

import { AnimatePresence, m } from "framer-motion";
import { useEffect, useState } from "react";
import { useCartStore } from "@rv/stores/cart-store";
import { trackAddToCart } from "@rv/lib/tracking";

interface LandingStickyBarProps {
  productId: string;
  label: string;
  priceLabel: string;
  priceValue: number;
  /** Id van de hero: de balk verschijnt zodra die uit beeld is */
  heroId: string;
  /** Id van het aanbod: daar staat al een knop, dus dan verdwijnt de balk */
  offerId: string;
}

/** Observeert hero en aanbod; true zodra de hero voorbij is en het aanbod niet in beeld. */
function useStickyVisibility(heroId: string, offerId: string): boolean {
  const [isHeroPast, setIsHeroPast] = useState(false);
  const [isOfferInView, setIsOfferInView] = useState(false);

  useEffect(() => {
    const hero = document.getElementById(heroId);
    const offer = document.getElementById(offerId);
    if (!hero || typeof IntersectionObserver === "undefined") return;

    const heroObserver = new IntersectionObserver(([entry]) => {
      if (entry) setIsHeroPast(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    });
    heroObserver.observe(hero);

    const offerObserver = new IntersectionObserver(([entry]) => {
      if (entry) setIsOfferInView(entry.isIntersecting);
    });
    if (offer) offerObserver.observe(offer);

    return () => {
      heroObserver.disconnect();
      offerObserver.disconnect();
    };
  }, [heroId, offerId]);

  return isHeroPast && !isOfferInView;
}

/** Vaste bestelbalk onderin op mobiel. Een tik zet de kit in de winkelwagen. */
export function LandingStickyBar({ productId, label, priceLabel, priceValue, heroId, offerId }: LandingStickyBarProps) {
  const isVisible = useStickyVisibility(heroId, offerId);
  const add = useCartStore((state) => state.add);

  const handleAdd = () => {
    add(productId);
    trackAddToCart(priceValue);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <m.div
          key="landing-sticky-bar"
          initial={{ y: "110%" }}
          animate={{ y: 0 }}
          exit={{ y: "110%" }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-canvas/85 px-4 pt-3 backdrop-blur-xl md:hidden"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          <button
            type="button"
            onClick={handleAdd}
            className="flex h-13 w-full items-center justify-between rounded-full bg-ink px-6 font-medium text-on-ink transition-[background-color,transform] duration-300 ease-calm active:scale-[0.98] active:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <span className="truncate">{label}</span>
            <span className="flex shrink-0 items-center gap-3">
              <span className="tabular-nums">{priceLabel}</span>
              <svg aria-hidden viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M8 3v10M3 8h10" strokeLinecap="round" />
              </svg>
            </span>
          </button>
        </m.div>
      )}
    </AnimatePresence>
  );
}
