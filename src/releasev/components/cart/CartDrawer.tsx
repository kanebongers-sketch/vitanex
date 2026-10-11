"use client";

import { AnimatePresence, m } from "framer-motion";
import { useRef } from "react";
import { PRODUCT_PATH, SITE } from "@rv/config/site";
import { getProductById } from "@rv/lib/commerce";
import { cartSubtotal, countItems, type CartLine } from "@rv/lib/cart";
import { formatMoney } from "@rv/lib/format";
import { useHydrated } from "@rv/lib/use-hydrated";
import { useCartStore } from "@rv/stores/cart-store";
import Image from "next/image";
import Link from "next/link";
import { IMAGES } from "@rv/config/images";
import { buttonClasses } from "@rv/components/ui/Button";
import { PaymentBadges } from "@rv/components/ui/PaymentBadges";
import { CartLineItem } from "./CartLineItem";
import { GiftOptionPanel } from "./GiftOptionPanel";
import { CheckoutButton } from "./CheckoutButton";
import { useDialogA11y } from "./useDialogA11y";

const EASE = [0.22, 1, 0.36, 1] as const;

function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      data-autofocus
      aria-label="Winkelwagen sluiten"
      className="flex size-11 items-center justify-center rounded-full transition-[background-color,transform] duration-300 ease-calm hover:rotate-90 hover:bg-surface-strong focus-visible:outline-2 focus-visible:outline-accent"
    >
      <svg aria-hidden viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" strokeLinecap="round" />
      </svg>
    </button>
  );
}

function EmptyState({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-1 flex-col justify-center gap-6 py-10">
      <div className="relative aspect-[16/10] overflow-hidden rounded-card border border-line bg-surface-strong">
        <Image src={IMAGES.rollerTopdown.src} alt="" fill sizes="400px" className="object-cover opacity-80" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-surface via-surface/20 to-transparent" />
      </div>
      <p className="font-display text-display-md uppercase text-balance">Je winkelwagen is nog leeg.</p>
      <p className="text-ink-soft">Vijf tools en een 14-dagenprogramma, in een doos.</p>
      <Link href={PRODUCT_PATH} onClick={onClose} className={buttonClasses({ size: "lg", className: "w-full" })}>
        Bekijk de kit
      </Link>
    </div>
  );
}

interface CartLinesProps {
  lines: readonly CartLine[];
  onQuantityChange: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
}

function CartLines({ lines, onQuantityChange, onRemove }: CartLinesProps) {
  return (
    <ul className="divide-y divide-line">
      {lines.map((line) => {
        const product = getProductById(line.productId);
        if (!product) return null;
        return (
          <CartLineItem
            key={line.productId}
            product={product}
            quantity={line.quantity}
            onQuantityChange={(quantity) => onQuantityChange(line.productId, quantity)}
            onRemove={() => onRemove(line.productId)}
          />
        );
      })}
    </ul>
  );
}

function CartSummary({ lines }: { lines: readonly CartLine[] }) {
  const subtotal = cartSubtotal(lines, getProductById);
  return (
    <footer
      className="flex flex-col gap-5 border-t border-line bg-surface px-6 pt-5"
      style={{ paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))" }}
    >
      <p className="flex gap-3 rounded-soft border border-line px-4 py-3 text-xs leading-relaxed text-ink-soft">
        <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent" />
        <span>
        <span className="font-medium text-ink">Inclusief</span> het 14-dagenprogramma via QR-code. Geen account
        nodig. {SITE.shipping.deliveryLabel}.
        </span>
      </p>
      <dl className="flex flex-col gap-2.5 text-sm">
        <div className="flex justify-between text-ink-soft">
          <dt>Verzending</dt>
          <dd className="font-medium text-success">Gratis</dd>
        </div>
        <div className="flex items-baseline justify-between">
          <dt className="text-ink">
            Subtotaal <span className="text-ink-muted">(incl. btw)</span>
          </dt>
          <dd className="font-display text-3xl font-extrabold tracking-tight tabular-nums text-ink">{formatMoney(subtotal)}</dd>
        </div>
      </dl>
      <GiftOptionPanel />
      <CheckoutButton lines={lines} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-ink-muted">{SITE.shipping.returnDays} dagen bedenktijd</p>
        <PaymentBadges />
      </div>
    </footer>
  );
}

export function CartDrawer() {
  const isHydrated = useHydrated();
  const { lines, isOpen, close, remove, setQuantity } = useCartStore();
  const panelRef = useRef<HTMLElement>(null);
  useDialogA11y(isOpen, panelRef, close);

  const visibleLines = isHydrated ? lines : [];
  const itemCount = countItems(visibleLines);

  return (
    <AnimatePresence>
      {isOpen && (
        <div key="cart-drawer" className="fixed inset-0 z-50">
          <m.div
            key="cart-backdrop"
            aria-hidden
            onClick={close}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="absolute inset-0 bg-canvas/70 backdrop-blur-sm"
          />
          <m.aside
            key="cart-panel"
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cart-title"
            tabIndex={-1}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.55, ease: EASE }}
            className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-line bg-surface shadow-drawer outline-none"
          >
            <header className="flex items-center justify-between border-b border-line py-3 pl-6 pr-3">
              <h2 id="cart-title" className="font-display text-xl uppercase tracking-tight">
                Winkelwagen
                {itemCount > 0 && <span className="ml-2 font-sans text-sm font-medium normal-case text-ink-muted tabular-nums">({itemCount})</span>}
              </h2>
              <CloseButton onClose={close} />
            </header>

            <div className="flex flex-1 flex-col overflow-y-auto overscroll-contain px-6">
              {visibleLines.length === 0 ? (
                <EmptyState onClose={close} />
              ) : (
                <CartLines lines={visibleLines} onQuantityChange={setQuantity} onRemove={remove} />
              )}
            </div>

            {visibleLines.length > 0 && <CartSummary lines={visibleLines} />}
          </m.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
