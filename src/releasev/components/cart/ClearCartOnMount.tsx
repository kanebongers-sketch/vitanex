"use client";

import { useEffect } from "react";
import { useCartStore } from "@rv/stores/cart-store";

/** Leegt de winkelwagen na een geslaagde betaling (op de bedankpagina). */
export function ClearCartOnMount() {
  const clear = useCartStore((state) => state.clear);
  const close = useCartStore((state) => state.close);
  useEffect(() => {
    clear();
    close();
  }, [clear, close]);
  return null;
}
