import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SITE } from "@rv/config/site";
import {
  KENNIS_ARTICLES,
  KENNIS_PAGE,
  getArticleBySlug,
  getReadingMinutes,
  getRelatedArticles,
  getTableOfContents,
} from "@rv/content/kennis";
import { Container } from "@rv/components/ui/Container";
import { ArticleHeader } from "@rv/components/kennis/ArticleHeader";
import { ArticleSections } from "@rv/components/kennis/ArticleSections";
import { ArticleJsonLd, BreadcrumbJsonLd } from "@rv/components/kennis/KennisJsonLd";
import { KennisCta } from "@rv/components/kennis/KennisCta";
import { RelatedArticles } from "@rv/components/kennis/RelatedArticles";
import { TableOfContents } from "@rv/components/kennis/TableOfContents";
import { ToolChips } from "@rv/components/kennis/ToolChip";
import { VariantNote } from "@rv/components/kennis/VariantNote";

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return KENNIS_ARTICLES.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return {};
  const path = `/kennis/${article.slug}`;
  return {
    title: article.title,
    description: article.description,
    alternates: { canonical: path },
    openGraph: {
      type: "article",
      title: `${article.title} · ${SITE.brandName}`,
      description: article.description,
      url: path,
      siteName: SITE.brandName,
      locale: SITE.locale,
      publishedTime: article.datePublished,
      modifiedTime: article.dateModified ?? article.datePublished,
      authors: [SITE.brandName],
      images: [{ url: article.image.src, alt: article.image.alt }],
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) notFound();

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Kennis", href: "/kennis" },
    { label: article.title, href: `/kennis/${article.slug}` },
  ];

  return (
    <>
      <ArticleJsonLd article={article} />
      <BreadcrumbJsonLd items={breadcrumbs} />

      <article>
        <ArticleHeader article={article} readingMinutes={getReadingMinutes(article)} breadcrumbs={breadcrumbs} />

        <Container className="grid gap-12 py-section-sm lg:grid-cols-12 lg:gap-10">
          <aside className="lg:col-span-4 xl:col-span-3">
            <div className="space-y-10 lg:sticky lg:top-28">
              <TableOfContents items={getTableOfContents(article)} />
              <ToolChips tools={article.tools} label={KENNIS_PAGE.toolsLabel} />
            </div>
          </aside>

          <div className="min-w-0 max-w-prose text-ink-soft lg:col-span-8 lg:col-start-5 xl:col-start-5">
            <div className="mb-14 space-y-5 border-l-2 border-accent pl-5 text-lead text-ink sm:mb-16 sm:pl-6">
              {article.intro.map((text) => (
                <p key={text}>{text}</p>
              ))}
            </div>

            <ArticleSections sections={article.sections} />
            <VariantNote variant={article.variant} />

            <p className="mt-14 border-t border-line pt-6 text-sm text-ink-muted">{KENNIS_PAGE.authorLine}</p>
          </div>
        </Container>
      </article>

      <RelatedArticles articles={getRelatedArticles(article)} />
      <KennisCta />
    </>
  );
}
