"use client";

import { useCartStore } from "@rv/stores/cart-store";
import { countItems } from "@rv/lib/cart";
import { useHydrated } from "@rv/lib/use-hydrated";

export function CartButton() {
  const isHydrated = useHydrated();
  const count = useCartStore((state) => countItems(state.lines));
  const open = useCartStore((state) => state.open);
  const visibleCount = isHydrated ? count : 0;

  return (
    <button
      type="button"
      onClick={open}
      className="relative flex size-11 items-center justify-center rounded-full text-ink transition-colors duration-300 hover:bg-surface-strong"
      aria-label={visibleCount > 0 ? `Winkelwagen openen, ${visibleCount} artikel(en)` : "Winkelwagen openen"}
    >
      <svg aria-hidden viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M5 8h14l-1.2 11.2a1 1 0 0 1-1 .8H7.2a1 1 0 0 1-1-.8L5 8Z" strokeLinejoin="round" />
        <path d="M9 8V6.5a3 3 0 0 1 6 0V8" strokeLinecap="round" />
      </svg>
      {visibleCount > 0 && (
        <span className="absolute right-1 top-1 flex min-w-4.5 items-center justify-center rounded-full bg-accent px-1 text-[0.625rem] font-semibold leading-4.5 text-on-ink">
          {visibleCount}
        </span>
      )}
    </button>
  );
}
