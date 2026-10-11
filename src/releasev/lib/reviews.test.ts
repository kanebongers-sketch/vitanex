import { describe, expect, it } from "vitest";
import type { Review } from "@rv/content/reviews";
import { shouldShowReviewPlaceholders, sortByNewest, summarizeReviews } from "./reviews";

const review = (overrides: Partial<Review>): Review => ({
  author: "A",
  rating: 5,
  body: "Tekst",
  date: "2026-01-01",
  isVerifiedPurchase: true,
  ...overrides,
});

describe("summarizeReviews", () => {
  it("geeft geen gemiddelde zonder reviews", () => {
    expect(summarizeReviews([])).toEqual({ count: 0, average: null });
  });

  it("rondt het gemiddelde af op een decimaal", () => {
    const result = summarizeReviews([review({ rating: 5 }), review({ rating: 4 }), review({ rating: 4 })]);
    expect(result).toEqual({ count: 3, average: 4.3 });
  });
});

describe("sortByNewest", () => {
  it("sorteert nieuwste eerst zonder het origineel te wijzigen", () => {
    const input = [review({ date: "2026-01-01" }), review({ date: "2026-03-01" })];
    const sorted = sortByNewest(input);
    expect(sorted.map((r) => r.date)).toEqual(["2026-03-01", "2026-01-01"]);
    expect(input[0]?.date).toBe("2026-01-01");
  });
});

describe("shouldShowReviewPlaceholders", () => {
  it("toont voorbeelden alleen in ontwikkeling zonder reviews", () => {
    expect(shouldShowReviewPlaceholders([], "development")).toBe(true);
    expect(shouldShowReviewPlaceholders([], "production")).toBe(false);
    expect(shouldShowReviewPlaceholders([review({})], "development")).toBe(false);
  });
});
