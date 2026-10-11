"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { addLine, removeLine, setLineQuantity, type CartLine } from "@rv/lib/cart";

export interface GiftOption {
  isGift: boolean;
  /** Tekst voor het kaartje (max. GIFT_MESSAGE_MAX tekens) */
  message: string;
}

export const GIFT_MESSAGE_MAX = 200;
const NO_GIFT: GiftOption = { isGift: false, message: "" };

interface CartState {
  lines: CartLine[];
  gift: GiftOption;
  setGift: (gift: Partial<GiftOption>) => void;
  isOpen: boolean;
  add: (productId: string, quantity?: number) => void;
  remove: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
}

/** Winkelwagen-state, bewaard in localStorage (alleen de regels, niet open/dicht). */
export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      gift: NO_GIFT,
      setGift: (gift) =>
        set((state) => ({
          gift: { ...state.gift, ...gift, message: (gift.message ?? state.gift.message).slice(0, GIFT_MESSAGE_MAX) },
        })),
      isOpen: false,
      add: (productId, quantity = 1) =>
        set((state) => ({ lines: addLine(state.lines, productId, quantity), isOpen: true })),
      remove: (productId) => set((state) => ({ lines: removeLine(state.lines, productId) })),
      setQuantity: (productId, quantity) =>
        set((state) => ({ lines: setLineQuantity(state.lines, productId, quantity) })),
      clear: () => set({ lines: [], gift: NO_GIFT }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
    }),
    {
      name: "cart",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ lines: state.lines, gift: state.gift }),
    },
  ),
);
