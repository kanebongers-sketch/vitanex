"use client";

import type { ReactNode } from "react";
import { Button } from "@rv/components/ui/Button";
import { useCartStore } from "@rv/stores/cart-store";
import { trackAddToCart } from "@rv/lib/tracking";

interface AddToCartButtonProps {
  productId: string;
  /** Prijs in euro's, voor tracking */
  priceValue: number;
  children: ReactNode;
  size?: "md" | "lg";
  withArrow?: boolean;
  className?: string;
}

/** Zet de kit direct in de winkelwagen; de store opent daarna de drawer. */
export function AddToCartButton({ productId, priceValue, children, size = "lg", withArrow = true, className }: AddToCartButtonProps) {
  const add = useCartStore((state) => state.add);

  const handleClick = () => {
    add(productId);
    trackAddToCart(priceValue);
  };

  return (
    <Button size={size} withArrow={withArrow} onClick={handleClick} className={className}>
      {children}
    </Button>
  );
}
