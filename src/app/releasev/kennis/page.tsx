import type { Metadata } from "next";
import { SITE } from "@rv/config/site";
import { KENNIS_ARTICLES, KENNIS_PAGE } from "@rv/content/kennis";
import { ArticleGrid } from "@rv/components/kennis/ArticleGrid";
import { KennisCta } from "@rv/components/kennis/KennisCta";
import { KennisHero } from "@rv/components/kennis/KennisHero";
import { BreadcrumbJsonLd } from "@rv/components/kennis/KennisJsonLd";

const TITLE = "Kennis: foam rollen en mobiliteit per lichaamsdeel";

export const metadata: Metadata = {
  title: TITLE,
  description: KENNIS_PAGE.description,
  alternates: { canonical: "/kennis" },
  openGraph: {
    type: "website",
    title: `${TITLE} · ${SITE.brandName}`,
    description: KENNIS_PAGE.description,
    url: "/kennis",
    siteName: SITE.brandName,
    locale: SITE.locale,
  },
};

const BREADCRUMBS = [
  { label: "Home", href: "/" },
  { label: "Kennis", href: "/kennis" },
] as const;

export default function KennisPage() {
  return (
    <>
      <BreadcrumbJsonLd items={BREADCRUMBS} />
      <KennisHero articles={KENNIS_ARTICLES} />
      <ArticleGrid articles={KENNIS_ARTICLES} />
      <KennisCta />
    </>
  );
}
