import type { KennisArticle } from "@rv/content/kennis";
import { Container } from "@rv/components/ui/Container";
import { Reveal } from "@rv/components/ui/Reveal";
import { ArticleCard } from "./ArticleCard";

interface ArticleGridProps {
  articles: readonly KennisArticle[];
}

/** Asymmetrische bento: rijen van 7/5 en 5/7 met verspringende hoogtes. */
const LAYOUT = [
  { span: "lg:col-span-7", variant: "wide" },
  { span: "lg:col-span-5 lg:mt-28", variant: "tall" },
  { span: "lg:col-span-5", variant: "tall" },
  { span: "lg:col-span-7 lg:mt-28", variant: "wide" },
] as const;

export function ArticleGrid({ articles }: ArticleGridProps) {
  const [featured, ...rest] = articles;
  if (!featured) return null;

  return (
    <section aria-labelledby="kennis-artikelen" className="py-section-sm">
      <h2 id="kennis-artikelen" className="sr-only">
        Alle artikelen
      </h2>
      <Container>
        <ArticleCard article={featured} variant="feature" priority />

        <div className="mt-16 grid gap-14 sm:gap-16 lg:grid-cols-12 lg:gap-x-10 lg:gap-y-16">
          {rest.map((article, index) => {
            const layout = LAYOUT[index % LAYOUT.length];
            return (
              <Reveal key={article.slug} className={layout.span} delay={(index % 2) * 0.08}>
                <ArticleCard article={article} variant={layout.variant} />
              </Reveal>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
