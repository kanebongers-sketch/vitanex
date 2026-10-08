import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SITE_VERBORGEN } from "@/lib/site-modus";

export const metadata: Metadata = {
  title: "MentaForce – Burn-out preventie voor Nederlandse teams",
  description: "MentaForce geeft HR-teams realtime inzicht in het welzijn van medewerkers. Herken burn-out risico's vroeg – anoniem, AVG-conform en actiegericht.",
  keywords: ["burn-out preventie", "vitaliteit werkplek", "HR dashboard", "welzijn medewerkers", "Nederland"],
  openGraph: {
    title: "MentaForce – Burn-out preventie voor Nederlandse teams",
    description: "Realtime inzicht in het welzijn van je team. Herken risico's vroeg – anoniem, AVG-conform en actiegericht.",
    locale: "nl_NL",
    type: "website",
  },
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  // Tijdelijk verborgen (zie lib/site-modus.ts). De echte 307 zit in next.config.ts;
  // dit is het vangnet voor een pad dat daar (nog) niet in staat.
  if (SITE_VERBORGEN) redirect("/login");
  return <>{children}</>;
}
