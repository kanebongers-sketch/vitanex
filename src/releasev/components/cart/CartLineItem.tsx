"use client";

import type { Product } from "@rv/lib/commerce/types";
import { formatMoney } from "@rv/lib/format";
import Image from "next/image";
import { QuantityStepper } from "@rv/components/product/QuantityStepper";

interface CartLineItemProps {
  product: Product;
  quantity: number;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
}

export function CartLineItem({ product, quantity, onQuantityChange, onRemove }: CartLineItemProps) {
  const image = product.media[0];
  const lineTotal = { ...product.price, amount: product.price.amount * quantity };

  return (
    <li className="flex gap-4 py-5">
      <div className="w-20 shrink-0">
        {image?.src ? (
          <span className="relative block aspect-square overflow-hidden rounded-soft border border-line bg-surface-strong">
            <Image src={image.src} alt="" aria-hidden fill sizes="80px" className="object-cover" />
          </span>
        ) : (
          <span
            role="img"
            aria-label={image?.alt ?? product.name}
            className="grain flex aspect-square items-end rounded-soft border border-line bg-surface-strong p-2 text-[0.5625rem] font-semibold uppercase tracking-[0.12em] text-ink-muted"
          >
            Foto
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-display text-base font-bold uppercase leading-tight tracking-tight text-ink">{product.name}</p>
            <p className="mt-1 text-sm text-ink-muted">{formatMoney(product.price)} per stuk</p>
          </div>
          <p className="shrink-0 font-display font-bold tabular-nums text-ink">{formatMoney(lineTotal)}</p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <QuantityStepper value={quantity} onChange={onQuantityChange} label={product.name} size="sm" />
          <button
            type="button"
            onClick={onRemove}
            className="text-sm text-ink-muted underline decoration-line underline-offset-4 transition-colors hover:text-danger hover:decoration-danger focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Verwijderen<span className="sr-only"> {product.name}</span>
          </button>
        </div>
      </div>
    </li>
  );
}
