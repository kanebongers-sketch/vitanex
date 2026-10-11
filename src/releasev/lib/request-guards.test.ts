import { describe, expect, it } from "vitest";
import { isJsonRequest, isSameOrigin } from "./request-guards";

describe("isSameOrigin", () => {
  it("accepteert een origin met dezelfde host", () => {
    // Arrange
    const headers = new Headers({ origin: "http://localhost:3000", host: "localhost:3000" });
    // Act
    const result = isSameOrigin(headers);
    // Assert
    expect(result).toBe(true);
  });

  it("negeert x-forwarded-host (door client te spoofen)", () => {
    const headers = new Headers({
      origin: "https://evil.example",
      host: "shop.nl",
      "x-forwarded-host": "evil.example",
    });
    expect(isSameOrigin(headers)).toBe(false);
  });

  it("accepteert de canonieke host uit SITE.url achter een proxy", () => {
    const headers = new Headers({ origin: "https://shop.nl", host: "internal:8080" });
    expect(isSameOrigin(headers, ["shop.nl"])).toBe(true);
    expect(isSameOrigin(headers)).toBe(false);
  });

  it("weigert een andere origin", () => {
    const headers = new Headers({ origin: "https://evil.example", host: "shop.nl" });
    expect(isSameOrigin(headers)).toBe(false);
  });

  it("weigert zonder origin", () => {
    expect(isSameOrigin(new Headers({ host: "shop.nl" }))).toBe(false);
  });

  it("weigert zonder host", () => {
    expect(isSameOrigin(new Headers({ origin: "https://shop.nl" }))).toBe(false);
  });

  it("weigert een ongeldige origin", () => {
    expect(isSameOrigin(new Headers({ origin: "null", host: "shop.nl" }))).toBe(false);
  });
});

describe("isJsonRequest", () => {
  it.each(["application/json", "application/json; charset=utf-8", "Application/JSON"])("accepteert %s", (type) => {
    expect(isJsonRequest(new Headers({ "content-type": type }))).toBe(true);
  });

  it.each(["text/plain", "application/x-www-form-urlencoded", "multipart/form-data"])("weigert %s", (type) => {
    expect(isJsonRequest(new Headers({ "content-type": type }))).toBe(false);
  });

  it("weigert zonder content-type", () => {
    expect(isJsonRequest(new Headers())).toBe(false);
  });
});
