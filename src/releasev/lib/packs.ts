import type { Money, Product } from "./commerce/types";

/**
 * Voordeel van een pakket t.o.v. losse kits, in centen.
 * Geeft 0 als er geen (positief) voordeel is, zodat we nooit een nep-korting tonen.
 */
export function packSavings(base: Product, pack: Product): Money {
  const units = pack.packSize ?? 1;
  const separate = base.price.amount * units;
  return { amount: Math.max(0, separate - pack.price.amount), currency: pack.price.currency };
}

/** Prijs per kit binnen een pakket, in centen (afgerond). */
export function pricePerKit(pack: Product): Money {
  const units = pack.packSize ?? 1;
  return { amount: Math.round(pack.price.amount / units), currency: pack.price.currency };
}
