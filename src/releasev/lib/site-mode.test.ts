import { describe, expect, it } from "vitest";
import { getPreviewCredentials, isAuthorized, isSiteHidden, safeEqual } from "./site-mode";

const basic = (user: string, password: string) => `Basic ${btoa(`${user}:${password}`)}`;

describe("isSiteHidden", () => {
  it("is standaard verborgen en alleen open met RELEASEV_SITE_MODE=live", () => {
    expect(isSiteHidden({})).toBe(true);
    expect(isSiteHidden({ RELEASEV_SITE_MODE: "verborgen" })).toBe(true);
    expect(isSiteHidden({ RELEASEV_SITE_MODE: " LIVE " })).toBe(false);
  });
});

describe("getPreviewCredentials", () => {
  it("vraagt alleen een wachtwoord als de site verborgen is en er een sterk genoeg wachtwoord is", () => {
    expect(getPreviewCredentials({})).toBeNull();
    expect(getPreviewCredentials({ RELEASEV_PREVIEW_PASSWORD: "kort" })).toBeNull();
    expect(getPreviewCredentials({ RELEASEV_PREVIEW_PASSWORD: "lang-genoeg" })).toEqual({ user: "release", password: "lang-genoeg" });
    expect(getPreviewCredentials({ RELEASEV_PREVIEW_PASSWORD: "lang-genoeg", RELEASEV_SITE_MODE: "live" })).toBeNull();
    expect(getPreviewCredentials({ RELEASEV_PREVIEW_PASSWORD: "lang-genoeg", RELEASEV_PREVIEW_USER: "kane" })?.user).toBe("kane");
  });
});

describe("isAuthorized", () => {
  const credentials = { user: "release", password: "geheim-123" };

  it("accepteert de juiste combinatie", () => {
    expect(isAuthorized(basic("release", "geheim-123"), credentials)).toBe(true);
  });

  it("weigert foute of kapotte headers", () => {
    expect(isAuthorized(null, credentials)).toBe(false);
    expect(isAuthorized(basic("release", "fout"), credentials)).toBe(false);
    expect(isAuthorized(basic("iemand", "geheim-123"), credentials)).toBe(false);
    expect(isAuthorized("Basic !!!geen-base64", credentials)).toBe(false);
    expect(isAuthorized(`Basic ${btoa("zonderdubbelepunt")}`, credentials)).toBe(false);
    expect(isAuthorized("Bearer abc", credentials)).toBe(false);
  });
});

describe("safeEqual", () => {
  it("vergelijkt correct, ook bij verschillende lengtes", () => {
    expect(safeEqual("abc", "abc")).toBe(true);
    expect(safeEqual("abc", "abd")).toBe(false);
    expect(safeEqual("abc", "abcd")).toBe(false);
    expect(safeEqual("", "")).toBe(true);
  });
});
