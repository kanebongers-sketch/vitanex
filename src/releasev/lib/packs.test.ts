import { describe, expect, it } from "vitest";
import { RECOVERY_KIT, RECOVERY_KIT_DUO } from "@rv/config/product";
import { getAllProducts, getPacksFor, getProductById, getProductBySlug } from "@rv/lib/commerce";
import { packSavings, pricePerKit } from "./packs";

describe("packSavings", () => {
  it("berekent het voordeel van het duo-pakket t.o.v. twee losse kits", () => {
    const expected = RECOVERY_KIT.price.amount * 2 - RECOVERY_KIT_DUO.price.amount;
    expect(packSavings(RECOVERY_KIT, RECOVERY_KIT_DUO).amount).toBe(Math.max(0, expected));
  });

  it("toont nooit een negatief voordeel", () => {
    const expensive = { ...RECOVERY_KIT_DUO, price: { amount: 99999, currency: "EUR" as const } };
    expect(packSavings(RECOVERY_KIT, expensive).amount).toBe(0);
  });

  it("geeft geen voordeel voor het basisproduct zelf", () => {
    expect(packSavings(RECOVERY_KIT, RECOVERY_KIT).amount).toBe(0);
  });
});

describe("pricePerKit", () => {
  it("deelt de pakketprijs door het aantal kits", () => {
    expect(pricePerKit(RECOVERY_KIT_DUO).amount).toBe(Math.round(RECOVERY_KIT_DUO.price.amount / 2));
  });
});

describe("catalogus", () => {
  it("geeft pakketvarianten geen eigen productpagina", () => {
    expect(getAllProducts().map((p) => p.id)).not.toContain(RECOVERY_KIT_DUO.id);
    expect(getProductBySlug(RECOVERY_KIT_DUO.slug)).toBeUndefined();
  });

  it("vindt pakketvarianten wel voor winkelwagen en checkout", () => {
    expect(getProductById(RECOVERY_KIT_DUO.id)?.price.amount).toBe(RECOVERY_KIT_DUO.price.amount);
  });

  it("sorteert pakketten op aantal kits", () => {
    expect(getPacksFor(RECOVERY_KIT.id).map((p) => p.id)).toEqual([RECOVERY_KIT.id, RECOVERY_KIT_DUO.id]);
  });
});
