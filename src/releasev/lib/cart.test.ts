import { describe, expect, it } from "vitest";
import { RECOVERY_KIT } from "@rv/config/product";
import {
  MAX_QUANTITY_PER_ITEM,
  addLine,
  cartSubtotal,
  countItems,
  removeLine,
  setLineQuantity,
  type CartLine,
} from "./cart";

const KIT = RECOVERY_KIT.id;

describe("addLine", () => {
  it("voegt een nieuwe regel toe zonder het origineel te muteren", () => {
    // Arrange
    const lines: readonly CartLine[] = Object.freeze([]);
    // Act
    const result = addLine(lines, KIT);
    // Assert
    expect(result).toEqual([{ productId: KIT, quantity: 1 }]);
    expect(lines).toHaveLength(0);
  });

  it("telt het aantal op bij een bestaande regel", () => {
    const lines = [{ productId: KIT, quantity: 2 }];
    const result = addLine(lines, KIT, 3);
    expect(result).toEqual([{ productId: KIT, quantity: 5 }]);
    expect(lines[0]?.quantity).toBe(2);
  });

  it("begrenst op het maximum per product", () => {
    const result = addLine([{ productId: KIT, quantity: MAX_QUANTITY_PER_ITEM }], KIT, 5);
    expect(result[0]?.quantity).toBe(MAX_QUANTITY_PER_ITEM);
  });

  it("laat andere regels ongemoeid", () => {
    const lines = [
      { productId: "ander", quantity: 1 },
      { productId: KIT, quantity: 1 },
    ];
    const result = addLine(lines, KIT, 1);
    expect(result[0]).toBe(lines[0]);
  });

  it.each([
    [Number.NaN, 1],
    [Number.POSITIVE_INFINITY, 1],
    [0, 1],
    [-3, 1],
    [2.7, 2],
    [99, MAX_QUANTITY_PER_ITEM],
  ])("normaliseert ongeldige aantallen (%s → %s)", (input, expected) => {
    const result = addLine([], KIT, input);
    expect(result[0]?.quantity).toBe(expected);
  });
});

describe("removeLine", () => {
  it("verwijdert alleen de gekozen regel", () => {
    const lines = [
      { productId: KIT, quantity: 1 },
      { productId: "ander", quantity: 2 },
    ];
    expect(removeLine(lines, KIT)).toEqual([{ productId: "ander", quantity: 2 }]);
    expect(lines).toHaveLength(2);
  });
});

describe("setLineQuantity", () => {
  it("zet een nieuw aantal", () => {
    const result = setLineQuantity([{ productId: KIT, quantity: 1 }], KIT, 4);
    expect(result).toEqual([{ productId: KIT, quantity: 4 }]);
  });

  it("verwijdert de regel bij een aantal onder 1", () => {
    expect(setLineQuantity([{ productId: KIT, quantity: 3 }], KIT, 0)).toEqual([]);
  });

  it("begrenst op het maximum", () => {
    const result = setLineQuantity([{ productId: KIT, quantity: 1 }], KIT, 50);
    expect(result[0]?.quantity).toBe(MAX_QUANTITY_PER_ITEM);
  });

  it("laat andere regels ongemoeid", () => {
    const other = { productId: "ander", quantity: 2 };
    const result = setLineQuantity([other, { productId: KIT, quantity: 1 }], KIT, 3);
    expect(result[0]).toBe(other);
  });
});

describe("countItems", () => {
  it("telt alle stuks op", () => {
    expect(countItems([{ productId: KIT, quantity: 2 }, { productId: "b", quantity: 3 }])).toBe(5);
  });

  it("geeft 0 voor een lege winkelwagen", () => {
    expect(countItems([])).toBe(0);
  });
});

describe("cartSubtotal", () => {
  const find = (id: string) => (id === KIT ? RECOVERY_KIT : undefined);

  it("rekent met de catalogusprijs", () => {
    const result = cartSubtotal([{ productId: KIT, quantity: 2 }], find);
    expect(result).toEqual({ amount: RECOVERY_KIT.price.amount * 2, currency: "EUR" });
  });

  it("negeert onbekende producten", () => {
    const result = cartSubtotal([{ productId: "weg", quantity: 3 }], find);
    expect(result.amount).toBe(0);
  });
});
