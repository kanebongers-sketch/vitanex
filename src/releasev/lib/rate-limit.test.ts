import { describe, expect, it } from "vitest";
import { createRateLimiter, getClientIp } from "./rate-limit";

describe("createRateLimiter", () => {
  it("staat verzoeken toe tot de limiet", () => {
    // Arrange
    const check = createRateLimiter({ limit: 2, windowMs: 1000 });
    // Act
    const results = [check("ip", 0), check("ip", 10), check("ip", 20)];
    // Assert
    expect(results.map((r) => r.allowed)).toEqual([true, true, false]);
  });

  it("geeft een Retry-After in hele seconden", () => {
    const check = createRateLimiter({ limit: 1, windowMs: 60_000 });
    check("ip", 0);
    expect(check("ip", 1_500)).toEqual({ allowed: false, retryAfterSeconds: 59 });
  });

  it("reset na het venster", () => {
    const check = createRateLimiter({ limit: 1, windowMs: 1000 });
    check("ip", 0);
    expect(check("ip", 500).allowed).toBe(false);
    expect(check("ip", 1000).allowed).toBe(true);
  });

  it("houdt sleutels gescheiden", () => {
    const check = createRateLimiter({ limit: 1, windowMs: 1000 });
    check("a", 0);
    expect(check("b", 0).allowed).toBe(true);
  });

  it("gebruikt standaard de huidige tijd", () => {
    const check = createRateLimiter({ limit: 1, windowMs: 60_000 });
    expect(check("ip").allowed).toBe(true);
    expect(check("ip").allowed).toBe(false);
  });
});

describe("getClientIp", () => {
  it("pakt het eerste adres uit x-forwarded-for", () => {
    const headers = new Headers({ "x-forwarded-for": " 1.2.3.4 , 5.6.7.8" });
    expect(getClientIp(headers)).toBe("1.2.3.4");
  });

  it("valt terug op x-real-ip", () => {
    expect(getClientIp(new Headers({ "x-real-ip": "9.9.9.9" }))).toBe("9.9.9.9");
  });

  it("geeft 'unknown' bij een lege x-forwarded-for", () => {
    expect(getClientIp(new Headers({ "x-forwarded-for": " , " }))).toBe("unknown");
  });

  it("geeft 'unknown' zonder headers", () => {
    expect(getClientIp(new Headers())).toBe("unknown");
  });
});

describe("createRateLimiter geheugenbegrenzing", () => {
  it("blijft werken na veel unieke sleutels en laat verlopen sleutels los", () => {
    const check = createRateLimiter({ limit: 1, windowMs: 1000 });
    for (let i = 0; i < 6000; i += 1) check(`ip-${i}`, 0);
    expect(check("nieuw", 5000).allowed).toBe(true);
    expect(check("nieuw", 5001).allowed).toBe(false);
  });
});
