import Link from "next/link";
import { KENNIS_PAGE, type KennisArticle } from "@rv/content/kennis";
import { Container } from "@rv/components/ui/Container";

interface KennisHeroProps {
  articles: readonly KennisArticle[];
}

/** Typografische header van /kennis: grote uppercase kop, rechts een index van alle zones. */
export function KennisHero({ articles }: KennisHeroProps) {
  return (
    <header className="border-b border-line pb-section-sm pt-10 md:pt-16">
      <Container className="grid gap-12 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-8">
          <p className="flex items-center gap-3 text-eyebrow font-semibold uppercase text-ink-soft">
            <span aria-hidden className="size-1.5 rounded-full bg-accent" />
            {KENNIS_PAGE.eyebrow}
          </p>
          <h1 className="mt-6 font-display text-display-2xl uppercase">
            {KENNIS_PAGE.titleLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h1>
          <p className="mt-8 max-w-[34rem] text-lead text-ink-soft">{KENNIS_PAGE.lead}</p>
          <p className="mt-4 text-sm text-ink-muted">{KENNIS_PAGE.authorLine}</p>
        </div>

        <nav aria-label="Artikelen per zone" className="lg:col-span-4">
          <p className="mb-4 text-eyebrow font-semibold uppercase text-ink-muted">Per zone</p>
          <ol className="border-t border-line">
            {articles.map((article, index) => (
              <li key={article.slug} className="border-b border-line">
                <Link
                  href={`/kennis/${article.slug}`}
                  className="group flex items-baseline gap-4 py-3.5 text-ink-soft transition-colors duration-300 hover:text-ink"
                >
                  <span className="font-display text-sm text-accent">{String(index + 1).padStart(2, "0")}</span>
                  <span className="flex-1 font-medium">{article.zone}</span>
                  <span className="hidden text-xs text-ink-muted sm:inline">{article.audience}</span>
                  <span
                    aria-hidden
                    className="text-ink-muted transition-transform duration-300 ease-calm group-hover:translate-x-1 group-hover:text-accent"
                  >
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </nav>
      </Container>
    </header>
  );
}
