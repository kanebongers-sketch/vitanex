import { describe, expect, it } from "vitest";
import { buildPurchasePayload, hasMarketingConsent, sha256Normalized } from "./meta-capi";

const base = {
  eventId: "cs_test_abc",
  eventTimeSeconds: 1_760_000_000,
  value: 69,
  currency: "eur",
  email: " Sanne@Voorbeeld.NL ",
  sourceUrl: "https://example.nl/bedankt",
};

describe("sha256Normalized", () => {
  it("normaliseert (trim + lowercase) voor het hashen", () => {
    expect(sha256Normalized(" A@B.nl ")).toBe(sha256Normalized("a@b.nl"));
    expect(sha256Normalized("a@b.nl")).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe("hasMarketingConsent", () => {
  it("vereist expliciet 'ja'", () => {
    expect(hasMarketingConsent({ consent_marketing: "ja" })).toBe(true);
    expect(hasMarketingConsent({ consent_marketing: "nee" })).toBe(false);
    expect(hasMarketingConsent({})).toBe(false);
  });
});

describe("buildPurchasePayload", () => {
  it("bouwt een Purchase-event met gehashte e-mail en dedup-id", () => {
    const payload = buildPurchasePayload({ ...base, metadata: { fbp: "fb.1.1.1", client_ip: "1.2.3.4" } });
    const event = payload.data[0];
    expect(event?.event_name).toBe("Purchase");
    expect(event?.event_id).toBe("cs_test_abc");
    expect(event?.user_data.em).toEqual([sha256Normalized("sanne@voorbeeld.nl")]);
    expect(event?.user_data.fbp).toBe("fb.1.1.1");
    expect(event?.custom_data).toEqual({ value: 69, currency: "EUR" });
    expect(JSON.stringify(payload)).not.toContain("Sanne@");
  });

  it("laat lege of onbekende velden weg en voegt test-code alleen toe als die er is", () => {
    const payload = buildPurchasePayload({ ...base, email: null, metadata: { fbc: "", client_ip: "unknown" } });
    expect(payload.data[0]?.user_data).toEqual({});
    expect("test_event_code" in payload).toBe(false);
    expect(buildPurchasePayload({ ...base, metadata: {} }, "TEST123").test_event_code).toBe("TEST123");
  });
});
