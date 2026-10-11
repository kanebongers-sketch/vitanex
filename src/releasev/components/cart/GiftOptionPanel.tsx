"use client";

import { useId } from "react";
import { GIFT_MESSAGE_MAX, useCartStore } from "@rv/stores/cart-store";

/**
 * Gratis cadeau-optie: cadeauverpakking, een kaartje met eigen tekst en
 * geen prijzen op de pakbon. Wordt als notitie meegestuurd naar Stripe.
 */
export function GiftOptionPanel() {
  const gift = useCartStore((state) => state.gift);
  const setGift = useCartStore((state) => state.setGift);
  const checkboxId = useId();
  const messageId = useId();
  const counterId = useId();

  return (
    <div className="rounded-soft border border-line bg-canvas/50 px-4 py-3">
      <label htmlFor={checkboxId} className="flex cursor-pointer items-start gap-3">
        <input
          id={checkboxId}
          type="checkbox"
          checked={gift.isGift}
          onChange={(event) => setGift({ isGift: event.target.checked })}
          className="mt-0.5 size-4 shrink-0 accent-[var(--rv-color-accent)]"
        />
        <span className="flex flex-col">
          <span className="text-sm font-semibold text-ink">Dit is een cadeau</span>
          <span className="text-xs text-ink-muted">Gratis cadeauverpakking en een kaartje. Geen prijzen op de pakbon.</span>
        </span>
      </label>

      {gift.isGift && (
        <div className="mt-3">
          <label htmlFor={messageId} className="text-xs font-medium text-ink-soft">
            Tekst op het kaartje (optioneel)
          </label>
          <textarea
            id={messageId}
            value={gift.message}
            maxLength={GIFT_MESSAGE_MAX}
            rows={3}
            aria-describedby={counterId}
            onChange={(event) => setGift({ message: event.target.value })}
            placeholder="Bijv. Veel plezier met je herstelroutine!"
            className="mt-1.5 w-full resize-none rounded-soft border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:border-ink focus:outline-none"
          />
          <p id={counterId} className="mt-1 text-right text-[0.6875rem] text-ink-muted tabular-nums">
            {gift.message.length}/{GIFT_MESSAGE_MAX}
          </p>
        </div>
      )}
    </div>
  );
}
