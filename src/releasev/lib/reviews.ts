import type { Review } from "@rv/content/reviews";

export interface ReviewSummary {
  count: number;
  /** Gemiddelde, afgerond op een decimaal; null zonder reviews */
  average: number | null;
}

export function summarizeReviews(reviews: readonly Review[]): ReviewSummary {
  if (reviews.length === 0) return { count: 0, average: null };
  const total = reviews.reduce((sum, review) => sum + review.rating, 0);
  return { count: reviews.length, average: Math.round((total / reviews.length) * 10) / 10 };
}

/** Nieuwste reviews eerst, zonder de originele lijst te wijzigen. */
export function sortByNewest(reviews: readonly Review[]): Review[] {
  return [...reviews].sort((a, b) => b.date.localeCompare(a.date));
}

/** Toon voorbeeldkaarten alleen tijdens ontwikkeling en alleen zonder echte reviews. */
export function shouldShowReviewPlaceholders(reviews: readonly Review[], nodeEnv: string | undefined): boolean {
  return reviews.length === 0 && nodeEnv !== "production";
}
