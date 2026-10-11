import Image from "next/image";
import Link from "next/link";
import { getReadingMinutes, type KennisArticle } from "@rv/content/kennis";
import { formatReadingTime } from "@rv/lib/reading-time";
import { cn } from "@rv/lib/cn";

type CardVariant = "feature" | "tall" | "wide";

interface ArticleCardProps {
  article: KennisArticle;
  /** "feature" = brede tegel met tekst over het beeld; "tall"/"wide" voor de bento-grid */
  variant?: CardVariant;
  headingLevel?: "h2" | "h3";
  priority?: boolean;
  className?: string;
}

const RATIOS: Record<CardVariant, string> = {
  feature: "aspect-[4/5] sm:aspect-[16/9] lg:aspect-[21/9]",
  tall: "aspect-[4/5]",
  wide: "aspect-[4/5] sm:aspect-[4/3]",
};

const SIZES: Record<CardVariant, string> = {
  feature: "100vw",
  tall: "(min-width: 1024px) 40vw, 100vw",
  wide: "(min-width: 1024px) 58vw, 100vw",
};

function ArrowIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className="size-4 transition-transform duration-300 ease-calm group-hover:translate-x-1"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M2 8h11M9 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Artikeltegel. De hele tegel is klikbaar via een uitgerekte link (een focusbare link per kaart). */
export function ArticleCard({
  article,
  variant = "wide",
  headingLevel = "h2",
  priority = false,
  className,
}: ArticleCardProps) {
  const Heading = headingLevel;
  const minutes = getReadingMinutes(article);
  const isFeature = variant === "feature";

  return (
    <article className={cn("group relative isolate", className)}>
      <div className={cn("relative overflow-hidden rounded-card bg-surface", RATIOS[variant])}>
        <Image
          src={article.image.src}
          alt={article.image.alt}
          fill
          priority={priority}
          quality={60}
          sizes={SIZES[variant]}
          className="object-cover transition-transform duration-700 ease-calm group-hover:scale-[1.03]"
        />
        <div
          aria-hidden
          className={cn(
            "absolute inset-0 bg-gradient-to-t from-canvas to-transparent",
            isFeature ? "via-canvas/50" : "via-transparent opacity-70",
          )}
        />
        <span className="absolute left-4 top-4 rounded-full border border-ink/15 bg-canvas/60 px-3 py-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-ink backdrop-blur-md">
          {article.zone}
        </span>
      </div>

      <div className={cn("flex flex-col gap-3", isFeature ? "absolute inset-x-0 bottom-0 p-5 sm:p-8 lg:p-10" : "mt-5")}>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-eyebrow font-semibold uppercase text-ink-muted">
          <span aria-hidden className="size-1.5 rounded-full bg-accent" />
          <span>{article.audience}</span>
          <span aria-hidden className="h-px w-6 bg-current opacity-40" />
          <span>{formatReadingTime(minutes)}</span>
        </p>
        <Heading
          lang="nl"
          className={cn(
            "break-words font-display uppercase [hyphens:auto]",
            isFeature ? "max-w-[20ch] text-display-md" : "text-2xl leading-tight sm:text-3xl",
          )}
        >
          <Link
            href={`/kennis/${article.slug}`}
            className="after:absolute after:inset-0 after:rounded-card focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-4 focus-visible:after:outline-accent"
          >
            {article.title}
          </Link>
        </Heading>
        <p
          className={cn(
            "max-w-[34rem] text-ink-soft",
            isFeature ? "hidden text-lead sm:block" : "line-clamp-3 text-sm sm:text-base",
          )}
        >
          {article.description}
        </p>
        <span
          aria-hidden
          className="mt-1 inline-flex items-center gap-2 text-sm font-medium text-ink transition-colors duration-300 group-hover:text-accent"
        >
          Lees artikel
          <ArrowIcon />
        </span>
      </div>
    </article>
  );
}
