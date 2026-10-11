import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SITE_VERBORGEN } from "@/lib/site-modus";
import { huidigeTaalset } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const ts = await huidigeTaalset();
  const titel = ts.t("site.meta.titel");
  return {
    title: titel,
    description: ts.t("site.meta.omschrijving"),
    keywords: ts.t("site.meta.trefwoorden").split(",").map((woord) => woord.trim()),
    openGraph: {
      title: titel,
      description: ts.t("site.meta.ogOmschrijving"),
      locale: ts.locale.replace("-", "_"),
      type: "website",
    },
  };
}

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  // Tijdelijk verborgen (zie lib/site-modus.ts). De echte 307 zit in next.config.ts;
  // dit is het vangnet voor een pad dat daar (nog) niet in staat.
  if (SITE_VERBORGEN) redirect("/login");
  return <>{children}</>;
}
