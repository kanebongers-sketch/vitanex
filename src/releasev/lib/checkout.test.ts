import { describe, expect, it } from "vitest";
import { RECOVERY_KIT } from "@rv/config/product";
import type { Product } from "./commerce/types";
import { MAX_QUANTITY_PER_ITEM } from "./cart";
import {
  MAX_CHECKOUT_LINES,
  buildOrderMetadata,
  parseCheckoutExtras,
  sanitizeFreeText,
  buildLineItems,
  buildSessionParams,
  isValidSessionId,
  maskEmail,
  mergeLines,
  parseCheckoutBody,
  resolvePriceId,
  toLineItem,
} from "./checkout";

const KIT = RECOVERY_KIT.id;
const find = (id: string): Product | undefined => (id === KIT ? RECOVERY_KIT : undefined);

describe("parseCheckoutBody", () => {
  it("accepteert een geldige body", () => {
    // Arrange
    const body = { items: [{ productId: KIT, quantity: 2 }] };
    // Act
    const result = parseCheckoutBody(body);
    // Assert
    expect(result).toEqual({ ok: true, value: [{ productId: KIT, quantity: 2 }] });
  });

  it.each([
    ["geen body", undefined],
    ["lege lijst", { items: [] }],
    ["geen items", {}],
    ["aantal 0", { items: [{ productId: KIT, quantity: 0 }] }],
    ["te veel stuks", { items: [{ productId: KIT, quantity: MAX_QUANTITY_PER_ITEM + 1 }] }],
    ["kommagetal", { items: [{ productId: KIT, quantity: 1.5 }] }],
    ["aantal als string", { items: [{ productId: KIT, quantity: "2" }] }],
    ["te lange id", { items: [{ productId: "x".repeat(65), quantity: 1 }] }],
    ["lege id", { items: [{ productId: "  ", quantity: 1 }] }],
    [
      "te veel regels",
      { items: Array.from({ length: MAX_CHECKOUT_LINES + 1 }, (_, i) => ({ productId: `p${i}`, quantity: 1 })) },
    ],
  ])("weigert ongeldige input: %s", (_label, body) => {
    const result = parseCheckoutBody(body);
    expect(result.ok).toBe(false);
  });

  it("negeert een meegestuurde clientprijs", () => {
    const result = parseCheckoutBody({ items: [{ productId: KIT, quantity: 1, price: 1 }] });
    expect(result).toEqual({ ok: true, value: [{ productId: KIT, quantity: 1 }] });
  });
});

describe("mergeLines", () => {
  it("voegt dubbele regels samen", () => {
    const result = mergeLines([
      { productId: KIT, quantity: 2 },
      { productId: KIT, quantity: 3 },
    ]);
    expect(result).toEqual({ ok: true, value: [{ productId: KIT, quantity: 5 }] });
  });

  it("weigert als het samengevoegde aantal boven het maximum komt", () => {
    const result = mergeLines([
      { productId: KIT, quantity: MAX_QUANTITY_PER_ITEM },
      { productId: KIT, quantity: 1 },
    ]);
    expect(result.ok).toBe(false);
  });

  it("houdt verschillende producten apart", () => {
    const result = mergeLines([
      { productId: "a", quantity: 1 },
      { productId: "b", quantity: 1 },
      { productId: "a", quantity: 1 },
    ]);
    expect(result).toEqual({
      ok: true,
      value: [
        { productId: "a", quantity: 2 },
        { productId: "b", quantity: 1 },
      ],
    });
  });
});

describe("resolvePriceId", () => {
  const envName = RECOVERY_KIT.stripePriceEnv as string;

  it("gebruikt een geldige Price-ID uit de env", () => {
    expect(resolvePriceId(RECOVERY_KIT, { [envName]: " price_123ABC " })).toBe("price_123ABC");
  });

  it.each([undefined, "", "price_VERVANG-MIJ", "prod_123"])("negeert ongeldige waarde %s", (value) => {
    expect(resolvePriceId(RECOVERY_KIT, { [envName]: value })).toBeNull();
  });

  it("geeft null zonder stripePriceEnv", () => {
    const product = { ...RECOVERY_KIT, stripePriceEnv: undefined };
    expect(resolvePriceId(product, { [envName]: "price_123" })).toBeNull();
  });
});

describe("toLineItem", () => {
  it("bouwt price_data op uit de catalogusprijs", () => {
    const item = toLineItem(RECOVERY_KIT, 2, {});
    expect(item.quantity).toBe(2);
    expect(item.price).toBeUndefined();
    expect(item.price_data).toMatchObject({
      currency: "eur",
      unit_amount: RECOVERY_KIT.price.amount,
      tax_behavior: "inclusive",
      product_data: { name: RECOVERY_KIT.name },
    });
  });

  it("gebruikt de Price-ID als die is ingesteld", () => {
    const item = toLineItem(RECOVERY_KIT, 1, { [RECOVERY_KIT.stripePriceEnv as string]: "price_abc" });
    expect(item).toEqual({ price: "price_abc", quantity: 1 });
  });
});

describe("buildLineItems", () => {
  it("bouwt line items voor bekende producten", () => {
    const result = buildLineItems([{ productId: KIT, quantity: 3 }], find, {});
    expect(result.ok && result.value[0]?.quantity).toBe(3);
  });

  it("weigert onbekende producten", () => {
    const result = buildLineItems([{ productId: "bestaat-niet", quantity: 1 }], find, {});
    expect(result).toEqual({ ok: false, error: expect.any(String) });
  });
});

describe("buildSessionParams", () => {
  it("stelt betaalmethoden, locale, verzending en URL's correct in", () => {
    // Arrange
    const lineItems = [{ price: "price_abc", quantity: 1 }];
    // Act
    const params = buildSessionParams(lineItems, {
      siteUrl: "https://shop.nl",
      cancelPath: "/product/kit",
      shippingCountries: ["NL", "BE"],
    });
    // Assert
    expect(params.mode).toBe("payment");
    expect(params.locale).toBe("nl");
    expect(params.allowed_payment_method_types).toEqual(["ideal", "bancontact", "card", "klarna"]);
    expect(params.shipping_address_collection?.allowed_countries).toEqual(["NL", "BE"]);
    expect(params.shipping_options?.[0]?.shipping_rate_data?.fixed_amount?.amount).toBe(0);
    expect(params.success_url).toBe("https://shop.nl/bedankt?session_id={CHECKOUT_SESSION_ID}");
    expect(params.cancel_url).toBe("https://shop.nl/product/kit?checkout=geannuleerd");
    expect(params.line_items).toBe(lineItems);
  });
});

describe("isValidSessionId", () => {
  it.each(["cs_test_a1B2c3", "cs_live_XYZ789"])("accepteert %s", (id) => {
    expect(isValidSessionId(id)).toBe(true);
  });

  it.each([undefined, 42, "", "cs_test_", "cs_foo_abc", "cs_test_abc/../x", ["cs_test_abc"], `cs_test_${"a".repeat(300)}`])(
    "weigert %s",
    (id) => {
      expect(isValidSessionId(id)).toBe(false);
    },
  );
});

describe("maskEmail", () => {
  it("maskeert het lokale deel", () => {
    expect(maskEmail("jan.jansen@voorbeeld.nl")).toBe("ja•••@voorbeeld.nl");
  });

  it("werkt met een kort lokaal deel", () => {
    expect(maskEmail("j@x.nl")).toBe("j•••@x.nl");
  });

  it.each([null, undefined, "", "geen-apenstaartje", "@x.nl"])("geeft null voor %s", (value) => {
    expect(maskEmail(value)).toBeNull();
  });
});

describe("cadeau en toestemming", () => {
  const items = [{ productId: "recovery-mobility-kit", quantity: 1 }];

  it("schoont de kaartjestekst op en begrenst de lengte", () => {
    expect(sanitizeFreeText("  Hoi\u0007 daar\t\tKane \n\n\n\nGroet ", 200)).toBe("Hoi daar Kane \n\nGroet");
    expect(sanitizeFreeText("a".repeat(300), 200)).toHaveLength(200);
  });

  it("geeft veilige standaardwaarden bij ongeldige invoer", () => {
    expect(parseCheckoutExtras({ nope: true })).toEqual({ giftMessage: null, hasMarketingConsent: false });
    expect(parseCheckoutExtras({ items, marketingConsent: "ja" })).toEqual({ giftMessage: null, hasMarketingConsent: false });
  });

  it("leest cadeau en toestemming uit een geldige body", () => {
    expect(parseCheckoutExtras({ items, gift: { message: " Fijne dag! " }, marketingConsent: true })).toEqual({
      giftMessage: "Fijne dag!",
      hasMarketingConsent: true,
    });
  });

  it("weigert een te lange kaartjestekst", () => {
    expect(parseCheckoutBody({ items, gift: { message: "a".repeat(201) } }).ok).toBe(false);
  });

  it("zet trackinggegevens alleen in de metadata met marketingtoestemming", () => {
    const tracking = { fbp: "fb.1.123", client_user_agent: "Mozilla" };
    expect(buildOrderMetadata({ giftMessage: null, hasMarketingConsent: false }, tracking)).toEqual({
      gift: "nee",
      consent_marketing: "nee",
    });
    expect(buildOrderMetadata({ giftMessage: "Hoi", hasMarketingConsent: true }, tracking)).toEqual({
      gift: "ja",
      consent_marketing: "ja",
      gift_message: "Hoi",
      fbp: "fb.1.123",
      client_user_agent: "Mozilla",
    });
  });
});

describe("sanitizeFreeText randgevallen", () => {
  it("verwijdert losse surrogaten maar laat emoji heel", () => {
    expect(sanitizeFreeText("Hoi \uD83D daar 💪", 200)).toBe("Hoi daar 💪");
  });
});
