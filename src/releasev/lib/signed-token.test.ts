import { describe, expect, it } from "vitest";
import { createSignedToken, verifySignedToken } from "./signed-token";

const SECRET = "test-geheim-dat-lang-genoeg-is";
const NOW = 1_760_000_000_000;

describe("signed tokens", () => {
  it("geeft de waarde terug voor een geldig, niet-verlopen token", () => {
    const token = createSignedToken("sanne@voorbeeld.nl", NOW + 60_000, SECRET);
    expect(verifySignedToken(token, SECRET, NOW)).toBe("sanne@voorbeeld.nl");
  });

  it("weigert een verlopen token", () => {
    const token = createSignedToken("a@b.nl", NOW - 1, SECRET);
    expect(verifySignedToken(token, SECRET, NOW)).toBeNull();
  });

  it("weigert een token met een ander geheim of aangepaste inhoud", () => {
    const token = createSignedToken("a@b.nl", NOW + 60_000, SECRET);
    expect(verifySignedToken(token, "ander-geheim", NOW)).toBeNull();
    const [, signature] = token.split(".");
    const forged = `${Buffer.from(JSON.stringify({ v: "eve@x.nl", e: NOW + 60_000 })).toString("base64url")}.${signature}`;
    expect(verifySignedToken(forged, SECRET, NOW)).toBeNull();
  });

  it("weigert onzin-invoer zonder te crashen", () => {
    expect(verifySignedToken("", SECRET, NOW)).toBeNull();
    expect(verifySignedToken("abc", SECRET, NOW)).toBeNull();
    expect(verifySignedToken("a.b.c", SECRET, NOW)).toBeNull();
  });
});
