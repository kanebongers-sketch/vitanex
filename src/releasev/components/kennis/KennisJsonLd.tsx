import { SITE } from "@rv/config/site";
import type { KennisArticle } from "@rv/content/kennis";
import { JsonLd } from "@rv/components/seo/JsonLd";
import type { Crumb } from "./Breadcrumbs";

function absoluteUrl(path: string): string {
  return path.startsWith("http") ? path : `${SITE.url}${path}`;
}

const ORGANIZATION = {
  "@type": "Organization",
  "@id": `${SITE.url}/#organization`,
  name: SITE.brandName,
  url: SITE.url,
} as const;

export function BreadcrumbJsonLd({ items }: { items: readonly Crumb[] }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.label,
          item: absoluteUrl(item.href),
        })),
      }}
    />
  );
}

export function ArticleJsonLd({ article }: { article: KennisArticle }) {
  const url = absoluteUrl(`/kennis/${article.slug}`);
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Article",
        headline: article.title,
        description: article.description,
        image: [absoluteUrl(article.image.src)],
        datePublished: article.datePublished,
        dateModified: article.dateModified ?? article.datePublished,
        inLanguage: SITE.language,
        mainEntityOfPage: { "@type": "WebPage", "@id": url },
        url,
        author: ORGANIZATION,
        publisher: ORGANIZATION,
      }}
    />
  );
}
