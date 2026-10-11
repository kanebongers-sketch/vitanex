import { KENNIS_PAGE, type KennisArticle } from "@rv/content/kennis";
import { Container } from "@rv/components/ui/Container";
import { ArticleCard } from "./ArticleCard";

interface RelatedArticlesProps {
  articles: readonly KennisArticle[];
}

export function RelatedArticles({ articles }: RelatedArticlesProps) {
  if (articles.length === 0) return null;

  return (
    <section aria-labelledby="verder-lezen" className="border-t border-line py-section-sm">
      <Container>
        <div className="flex items-end justify-between gap-6">
          <h2 id="verder-lezen" className="font-display text-display-md uppercase">
            {KENNIS_PAGE.relatedLabel}
          </h2>
        </div>
        <ul className="mt-10 grid gap-12 md:grid-cols-2 lg:grid-cols-3 lg:gap-10">
          {articles.map((article) => (
            <li key={article.slug}>
              <ArticleCard article={article} variant="tall" headingLevel="h3" />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
