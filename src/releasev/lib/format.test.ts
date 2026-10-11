import { describe, expect, it } from "vitest";
import { formatMoney, toDecimalString } from "./format";

/** Intl gebruikt een harde spatie tussen € en bedrag; normaliseer voor leesbare asserts. */
const normalize = (value: string) => value.replace(/\s/g, " ");

describe("formatMoney", () => {
  it("toont hele euro's zonder centen", () => {
    // Arrange
    const money = { amount: 6900, currency: "EUR" as const };
    // Act
    const result = formatMoney(money);
    // Assert
    expect(normalize(result)).toBe("€ 69");
  });

  it("toont centen als die er zijn", () => {
    expect(normalize(formatMoney({ amount: 6950, currency: "EUR" }))).toBe("€ 69,50");
  });

  it("gebruikt Nederlandse duizendtallen", () => {
    expect(normalize(formatMoney({ amount: 123_400, currency: "EUR" }))).toBe("€ 1.234");
  });
});

describe("toDecimalString", () => {
  it.each([
    [6900, "69.00"],
    [6950, "69.50"],
    [5, "0.05"],
    [0, "0.00"],
  ])("%i centen → %s", (amount, expected) => {
    expect(toDecimalString({ amount, currency: "EUR" })).toBe(expected);
  });
});
