"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@rv/components/ui/Button";
import { PaymentBadges } from "@rv/components/ui/PaymentBadges";
import { useCartStore } from "@rv/stores/cart-store";
import { trackAddToCart } from "@rv/lib/tracking";
import { QuantityStepper } from "./QuantityStepper";
import { MobileBuyBar } from "./MobileBuyBar";
import { TrustBadges } from "./TrustBadges";
import { InTheBox } from "./InTheBox";
import { PackSelector, type PackOption } from "./PackSelector";

interface BuyBoxProps {
  productId: string;
  name: string;
  tagline: string;
  priceLabel: string;
  /** Prijs in euro's, voor tracking */
  priceValue: number;
  highlights: readonly string[];
  /** Eerste productfoto, voor de mobiele koopbalk */
  imageSrc?: string;
  /** Onderdelen voor de "In de doos"-lijst */
  boxItems?: readonly string[];
  /** Pakketkeuze (solo/duo). Met minder dan 2 opties wordt geen keuze getoond. */
  packs?: readonly PackOption[];
}

/** true zodra het element uit beeld is gescrold (boven de viewport). */
function useScrolledPast(ref: React.RefObject<HTMLElement | null>): boolean {
  const [isPast, setIsPast] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry) return;
      setIsPast(!entry.isIntersecting && entry.boundingClientRect.top < 0);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
  return isPast;
}

export function BuyBox({ productId, name, tagline, priceLabel, priceValue, highlights, imageSrc, boxItems = [], packs = [] }: BuyBoxProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedPackId, setSelectedPackId] = useState(productId);
  const selectedPack = packs.find((pack) => pack.id === selectedPackId);
  const activeId = selectedPack?.id ?? productId;
  const activePriceLabel = selectedPack?.priceLabel ?? priceLabel;
  const activePriceValue = selectedPack?.priceValue ?? priceValue;
  const add = useCartStore((state) => state.add);
  const buttonRef = useRef<HTMLDivElement>(null);
  const isButtonOutOfView = useScrolledPast(buttonRef);

  const handleAdd = () => {
    add(activeId, quantity);
    trackAddToCart(activePriceValue * quantity);
    setQuantity(1);
  };

  return (
    <div className="flex flex-col">
      <header className="flex flex-col gap-4">
        <p className="flex items-center gap-3 text-eyebrow font-semibold uppercase text-ink-muted">
          <span aria-hidden className="size-1.5 rounded-full bg-accent" />
          Recovery &amp; mobility · Complete kit
        </p>
        <h1 className="font-display text-display-md uppercase text-ink text-balance">{name}</h1>
        <p className="max-w-[34rem] text-ink-soft text-pretty">{tagline}</p>
      </header>

      <p className="mt-6 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-display text-5xl font-extrabold tracking-tight text-ink tabular-nums">{activePriceLabel}</span>
        <span className="text-sm text-ink-muted">incl. btw · gratis verzending</span>
      </p>

      <ul className="mt-7 flex flex-col gap-2.5 border-t border-line pt-6">
        {highlights.map((highlight) => (
          <li key={highlight} className="flex items-start gap-3 text-sm text-ink-soft">
            <span aria-hidden className="mt-[0.45rem] size-1.5 shrink-0 rounded-full bg-accent" />
            {highlight}
          </li>
        ))}
      </ul>

      {packs.length > 1 && (
        <div className="mt-7">
          <PackSelector options={packs} selectedId={activeId} onSelect={setSelectedPackId} />
        </div>
      )}

      <div ref={buttonRef} className="mt-7 flex items-stretch gap-3">
        <QuantityStepper value={quantity} onChange={setQuantity} label={name} className="shrink-0" />
        <Button size="lg" withArrow onClick={handleAdd} className="min-w-0 flex-1 whitespace-nowrap px-5">
          In winkelwagen
        </Button>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-xs text-ink-muted">
          <svg aria-hidden viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.4">
            <path d="M3.5 7.5h9v6.5h-9zM5.5 7.5V5a2.5 2.5 0 015 0v2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Veilig afrekenen via Stripe
        </p>
        <PaymentBadges />
      </div>

      <TrustBadges className="mt-8" />

      {boxItems.length > 0 && <InTheBox items={boxItems} className="mt-8" />}

      <MobileBuyBar isVisible={isButtonOutOfView} name={selectedPack?.title ?? name} priceLabel={activePriceLabel} imageSrc={imageSrc} onAdd={() => {
        add(activeId, 1);
        trackAddToCart(activePriceValue);
      }} />
    </div>
  );
}
