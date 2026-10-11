import type { MetadataRoute } from "next";
import { LEGAL_NAV, SITE } from "@rv/config/site";
import { getAllProducts } from "@rv/lib/commerce";
import { LANDING_SLUGS } from "@rv/content/landing";
import { KENNIS_ARTICLES, KENNIS_PUBLISHED } from "@rv/content/kennis";
import { isSiteHidden } from "@rv/lib/site-mode";

/** Alle publieke routes. /bedankt en /api zijn bewust uitgesloten. */
export default function sitemap(): MetadataRoute.Sitemap {
  // Verborgen stand: niets aanbieden aan zoekmachines
  if (isSiteHidden()) return [];
  const lastModified = new Date();

  const pages: MetadataRoute.Sitemap = [
    { url: `${SITE.url}/`, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE.url}/programma`, lastModified, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE.url}/kennis`, lastModified, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE.url}/over-ons`, lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE.url}/contact`, lastModified, changeFrequency: "yearly", priority: 0.5 },
  ];

  const products: MetadataRoute.Sitemap = getAllProducts().map((product) => ({
    url: `${SITE.url}/product/${product.slug}`,
    lastModified,
    changeFrequency: "weekly",
    priority: 0.9,
  }));

  const landings: MetadataRoute.Sitemap = LANDING_SLUGS.map((slug) => ({
    url: `${SITE.url}/${slug}`,
    lastModified,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const articles: MetadataRoute.Sitemap = KENNIS_ARTICLES.map((article) => ({
    url: `${SITE.url}/kennis/${article.slug}`,
    lastModified: new Date(KENNIS_PUBLISHED),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const legal: MetadataRoute.Sitemap = LEGAL_NAV.map((item) => ({
    url: `${SITE.url}${item.href}`,
    lastModified,
    changeFrequency: "yearly",
    priority: 0.3,
  }));

  return [...pages, ...products, ...landings, ...articles, ...legal];
}
