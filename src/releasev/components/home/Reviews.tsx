import { REVIEWS as REVIEWS_COPY } from "@rv/content/home";
import { REVIEWS, type Review } from "@rv/content/reviews";
import { shouldShowReviewPlaceholders, sortByNewest, summarizeReviews } from "@rv/lib/reviews";
import { cn } from "@rv/lib/cn";
import { Container } from "@rv/components/ui/Container";
import { SectionHeading } from "./SectionHeading";

/*
 * Reviews komen uit src/content/reviews.ts. Alleen echte reviews toevoegen.
 * Zonder reviews: op de live site verborgen, tijdens ontwikkelen voorbeeldkaarten.
 */
const STAR_SLOTS = [1, 2, 3, 4, 5] as const;
const LINE_WIDTHS = ["w-full", "w-11/12", "w-3/5"] as const;
const MAX_VISIBLE = 6;

function Stars({ rating }: { rating: number | null }) {
  return (
    <span className="flex gap-1" role={rating ? "img" : undefined} aria-label={rating ? `${rating} van 5 sterren` : undefined} aria-hidden={rating ? undefined : true}>
      {STAR_SLOTS.map((slot) => {
        const isFilled = rating !== null && slot <= Math.round(rating);
        return (
          <svg key={slot} viewBox="0 0 16 16" className={cn("size-3.5", isFilled ? "text-accent" : "text-ink-muted/50")} fill={isFilled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.2">
            <path d="M8 1.8l1.9 3.9 4.3.6-3.1 3 .7 4.3L8 11.6l-3.8 2 .7-4.3-3.1-3 4.3-.6z" strokeLinejoin="round" />
          </svg>
        );
      })}
    </span>
  );
}

const dateFormatter = new Intl.DateTimeFormat("nl-NL", { month: "long", year: "numeric" });

function ReviewCard({ review }: { review: Review }) {
  return (
    <li className="flex min-h-64 flex-col justify-between gap-8 bg-canvas p-7 sm:p-8">
      <div className="flex flex-col gap-4">
        <Stars rating={review.rating} />
        {review.title && <h3 className="font-display text-xl font-bold leading-snug">{review.title}</h3>}
        <p className="leading-relaxed text-ink-soft">{review.body}</p>
      </div>
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ink-muted">
        <span className="font-semibold text-ink">{review.author}</span>
        {review.location && <span>· {review.location}</span>}
        {review.variant && <span>· {review.variant}</span>}
        <span>· {dateFormatter.format(new Date(review.date))}</span>
        {review.isVerifiedPurchase && (
          <span className="rounded-full border border-line px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-ink-soft">
            Geverifieerde aankoop
          </span>
        )}
      </p>
    </li>
  );
}

function PlaceholderCard() {
  return (
    <li className="flex min-h-64 flex-col justify-between gap-10 bg-canvas p-7 sm:p-8">
      <div className="flex items-center justify-between">
        <span className="rounded-full border border-line px-3 py-1 text-eyebrow font-semibold uppercase text-ink-soft">
          {REVIEWS_COPY.placeholderBadge}
        </span>
        <Stars rating={null} />
      </div>
      <div>
        <div aria-hidden className="flex flex-col gap-2.5">
          {LINE_WIDTHS.map((width) => (
            <span key={width} className={cn("h-2 rounded-full bg-surface-strong", width)} />
          ))}
        </div>
        <p className="mt-6 text-sm text-ink-muted">{REVIEWS_COPY.placeholderText}</p>
      </div>
    </li>
  );
}

export function Reviews() {
  const showPlaceholders = shouldShowReviewPlaceholders(REVIEWS, process.env.NODE_ENV);
  if (REVIEWS.length === 0 && !showPlaceholders) return null;

  const summary = summarizeReviews(REVIEWS);
  const visible = sortByNewest(REVIEWS).slice(0, MAX_VISIBLE);

  return (
    <section aria-labelledby="reviews-title" className="py-section">
      <Container>
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <SectionHeading id="reviews-title" intro={{ ...REVIEWS_COPY.intro, lead: undefined }} isStatement className="lg:col-span-7" />
          {summary.average !== null ? (
            <p className="flex items-center gap-4 lg:col-span-4 lg:col-start-9 lg:justify-self-end">
              <span className="font-display text-5xl font-extrabold tabular-nums">{summary.average.toLocaleString("nl-NL")}</span>
              <span className="flex flex-col gap-1 text-sm text-ink-muted">
                <Stars rating={summary.average} />
                {summary.count} {summary.count === 1 ? "review" : "reviews"}
              </span>
            </p>
          ) : (
            <p className="max-w-[26rem] text-ink-soft lg:col-span-4 lg:col-start-9 lg:justify-self-end">
              {REVIEWS_COPY.intro.lead}
              <span className="mt-2 block text-xs text-accent">Alleen zichtbaar tijdens ontwikkelen. Op de live site verborgen tot er echte reviews zijn.</span>
            </p>
          )}
        </div>

        <ul className="mt-14 grid gap-px overflow-hidden rounded-card border border-line bg-line md:grid-cols-3 lg:mt-20">
          {visible.length > 0
            ? visible.map((review) => <ReviewCard key={`${review.author}-${review.date}`} review={review} />)
            : [0, 1, 2].map((slot) => <PlaceholderCard key={slot} />)}
        </ul>
      </Container>
    </section>
  );
}
