import { afterEach, describe, expect, it, vi } from "vitest";
import { getStripe, getWebhookSecret, isMissingOrPlaceholder, isStripeConfigured } from "./stripe";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("isMissingOrPlaceholder", () => {
  it.each([undefined, "", "   ", "sk_test_VERVANG_MIJ", "vervang"])("herkent %s als niet ingesteld", (value) => {
    expect(isMissingOrPlaceholder(value)).toBe(true);
  });

  it("accepteert een echte waarde", () => {
    expect(isMissingOrPlaceholder("sk_test_123")).toBe(false);
  });
});

describe("getStripe", () => {
  it("geeft null zonder secret key", () => {
    // Arrange
    vi.stubEnv("RELEASEV_STRIPE_SECRET_KEY", "");
    // Act + Assert
    expect(getStripe()).toBeNull();
    expect(isStripeConfigured()).toBe(false);
  });

  it("geeft null bij een placeholder", () => {
    vi.stubEnv("RELEASEV_STRIPE_SECRET_KEY", "sk_test_VERVANG");
    expect(getStripe()).toBeNull();
  });

  it("maakt een gecachte client aan bij een geldige key", () => {
    vi.stubEnv("RELEASEV_STRIPE_SECRET_KEY", "sk_test_dummy123");
    const first = getStripe();
    expect(first).not.toBeNull();
    expect(getStripe()).toBe(first);
    expect(isStripeConfigured()).toBe(true);
  });

  it("maakt een nieuwe client als de key wijzigt", () => {
    vi.stubEnv("RELEASEV_STRIPE_SECRET_KEY", "sk_test_een");
    const first = getStripe();
    vi.stubEnv("RELEASEV_STRIPE_SECRET_KEY", "sk_test_twee");
    expect(getStripe()).not.toBe(first);
  });
});

describe("getWebhookSecret", () => {
  it("geeft null zonder secret", () => {
    vi.stubEnv("RELEASEV_STRIPE_WEBHOOK_SECRET", "");
    expect(getWebhookSecret()).toBeNull();
  });

  it("geeft de getrimde secret terug", () => {
    vi.stubEnv("RELEASEV_STRIPE_WEBHOOK_SECRET", " whsec_abc ");
    expect(getWebhookSecret()).toBe("whsec_abc");
  });
});
