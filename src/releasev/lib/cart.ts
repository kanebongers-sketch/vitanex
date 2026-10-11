import type { Money, Product } from "./commerce/types";

export const MAX_QUANTITY_PER_ITEM = 10;

export interface CartLine {
  productId: string;
  quantity: number;
}

function clampQuantity(quantity: number): number {
  if (!Number.isFinite(quantity)) return 1;
  return Math.min(MAX_QUANTITY_PER_ITEM, Math.max(1, Math.floor(quantity)));
}

export function addLine(lines: readonly CartLine[], productId: string, quantity = 1): CartLine[] {
  const existing = lines.find((line) => line.productId === productId);
  if (!existing) {
    return [...lines, { productId, quantity: clampQuantity(quantity) }];
  }
  return lines.map((line) =>
    line.productId === productId
      ? { ...line, quantity: clampQuantity(line.quantity + quantity) }
      : line,
  );
}

export function removeLine(lines: readonly CartLine[], productId: string): CartLine[] {
  return lines.filter((line) => line.productId !== productId);
}

export function setLineQuantity(
  lines: readonly CartLine[],
  productId: string,
  quantity: number,
): CartLine[] {
  if (quantity < 1) return removeLine(lines, productId);
  return lines.map((line) =>
    line.productId === productId ? { ...line, quantity: clampQuantity(quantity) } : line,
  );
}

export function countItems(lines: readonly CartLine[]): number {
  return lines.reduce((total, line) => total + line.quantity, 0);
}

export function cartSubtotal(
  lines: readonly CartLine[],
  findProduct: (id: string) => Product | undefined,
): Money {
  const amount = lines.reduce((total, line) => {
    const product = findProduct(line.productId);
    return product ? total + product.price.amount * line.quantity : total;
  }, 0);
  return { amount, currency: "EUR" };
}
