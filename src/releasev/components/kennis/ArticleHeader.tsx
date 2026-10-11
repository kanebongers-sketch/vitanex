import Image from "next/image";
import { KENNIS_PAGE, type KennisArticle } from "@rv/content/kennis";
import { formatReadingTime } from "@rv/lib/reading-time";
import { Container } from "@rv/components/ui/Container";
import { Breadcrumbs, type Crumb } from "./Breadcrumbs";
import { formatArticleDate } from "./format-date";

interface ArticleHeaderProps {
  article: KennisArticle;
  readingMinutes: number;
  breadcrumbs: readonly Crumb[];
}

export function ArticleHeader({ article, readingMinutes, breadcrumbs }: ArticleHeaderProps) {
  const updated = article.dateModified ?? article.datePublished;

  return (
    <header className="pt-8 md:pt-12">
      <Container>
        <Breadcrumbs items={breadcrumbs} />

        <div className="mt-10 grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="min-w-0 lg:col-span-9">
            <p className="flex flex-wrap items-center gap-3 text-eyebrow font-semibold uppercase text-ink-soft">
              <span aria-hidden className="size-1.5 rounded-full bg-accent" />
              <span>{article.zone}</span>
              <span aria-hidden className="h-px w-8 bg-current opacity-40" />
              <span className="text-ink-muted">{article.audience}</span>
            </p>
            <h1 lang="nl" className="mt-6 break-words font-display text-[2rem] leading-[0.98] tracking-[-0.03em] uppercase [hyphens:manual] [font-weight:800] sm:text-display-lg">
              {article.title}
            </h1>
          </div>

          <dl className="grid min-w-0 grid-cols-2 gap-x-6 gap-y-4 border-t border-line pt-5 text-sm lg:col-span-3 lg:grid-cols-1">
            <div>
              <dt className="text-eyebrow font-semibold uppercase text-ink-muted">Leestijd</dt>
              <dd className="mt-1.5 font-display text-xl font-bold">{formatReadingTime(readingMinutes)}</dd>
            </div>
            <div>
              <dt className="text-eyebrow font-semibold uppercase text-ink-muted">Bijgewerkt</dt>
              <dd className="mt-1.5 text-ink-soft">
                <time dateTime={updated}>{formatArticleDate(updated)}</time>
              </dd>
            </div>
            <div className="col-span-2 lg:col-span-1">
              <dt className="sr-only">Auteur</dt>
              <dd className="text-ink-muted">{KENNIS_PAGE.authorLine}</dd>
            </div>
          </dl>
        </div>

        <div className="relative mt-10 aspect-[4/3] overflow-hidden rounded-card bg-surface sm:aspect-[16/9] lg:aspect-[21/9]">
          <Image
            src={article.image.src}
            alt={article.image.alt}
            fill
            priority
            quality={60}
            sizes="100vw"
            className="object-cover"
          />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-canvas/70 via-transparent to-transparent" />
        </div>
      </Container>
    </header>
  );
}
